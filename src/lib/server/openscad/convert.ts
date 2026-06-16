// In-process OpenSCAD -> GLB conversion.
//
// Runs the WASM build of OpenSCAD (bundled at ./openscad.js) as a child node
// process to turn SCAD source into a colored OFF mesh, then converts that OFF
// to a GLB entirely in JS (parseOff + exportGlb, vendored from
// openscad-playground). No external HTTP service required.
//
// This is intended to run at WRITE time (create / save / seed) — the resulting
// GLB is uploaded once and its URL stored; read paths just load that GLB.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseOff } from "./import_off";
import { exportGlb } from "./export_glb";

// Absolute path to the bundled WASM CLI build.
// Note the .cjs extension: the build is a CommonJS script, and this project's
// package.json sets "type": "module", so a .js would be (wrongly) loaded as ESM.
const OPENSCAD_JS = fileURLToPath(new URL("./openscad.cjs", import.meta.url));
// Directory holding openscad.cjs plus the bundled resource folders
// (color-schemes, fonts, libraries, locale). OpenSCAD resolves its resource
// path from the process cwd, so we run the child from here.
const OPENSCAD_DIR = dirname(OPENSCAD_JS);

const RENDER_TIMEOUT_MS = 60_000;

function runOpenscad(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [OPENSCAD_JS, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: OPENSCAD_DIR,
    });
    let stderr = "";
    child.stdout?.on("data", () => {});
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`OpenSCAD timed out after ${RENDER_TIMEOUT_MS}ms`));
    }, RENDER_TIMEOUT_MS);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`OpenSCAD exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

/**
 * Convert OpenSCAD source to a colored GLB buffer, in-process.
 * Throws on compilation failure.
 */
export async function convertScadToGlb(scadContent: string): Promise<Buffer> {
  if (!scadContent || typeof scadContent !== "string") {
    throw new Error("scadContent is required and must be a string");
  }

  const dir = mkdtempSync(join(tmpdir(), "scad-"));
  const scadPath = join(dir, "in.scad");
  const offPath = join(dir, "out.off");

  try {
    writeFileSync(scadPath, scadContent, "utf-8");

    // Step 1: SCAD -> colored OFF via WASM OpenSCAD (manifold backend).
    await runOpenscad([scadPath, "-o", offPath, "--backend=manifold"]);

    // Step 2: parse OFF.
    const offContent = readFileSync(offPath, "utf-8");
    const polyhedron = parseOff(offContent);

    // Step 3: OpenSCAD Z-up -> GLB Y-up: (x, y, z) -> (x, z, -y).
    const transformed = {
      vertices: polyhedron.vertices.map((v) => ({ x: v.x, y: v.z, z: -v.y })),
      faces: polyhedron.faces,
      colors: polyhedron.colors,
    };

    // Step 4: OFF -> GLB (pure JS).
    const glbBlob = await exportGlb(transformed);
    return Buffer.from(await glbBlob.arrayBuffer());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
