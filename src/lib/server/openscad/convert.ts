// In-process OpenSCAD -> GLB conversion.
//
// Runs the WASM build of OpenSCAD (bundled at ./openscad.cjs) as a child node
// process to turn SCAD source into a colored OFF mesh, then converts that OFF
// to a GLB entirely in JS (parseOff + exportGlb, vendored from
// openscad-playground). No external HTTP service required.
//
// Supports multi-file projects: all files are written into one temp dir
// (subfolders included) so relative `include <...>`/`use <...>` resolve, and
// OpenSCAD renders the designated entry file.
//
// This is intended to run at WRITE time (create / save / seed) — the resulting
// GLB is uploaded once and its URL stored; read paths just load that GLB.
import { spawn } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { parseOff } from "./import_off";
import { exportGlb } from "./export_glb";

export type ScadFile = { path: string; content: string };

// Absolute path to the bundled WASM CLI build.
// Note the .cjs extension: the build is a CommonJS script, and this project's
// package.json sets "type": "module", so a .js would be (wrongly) loaded as ESM.
const OPENSCAD_JS = fileURLToPath(new URL("./openscad.cjs", import.meta.url));
// Directory holding openscad.cjs plus the bundled resource folders
// (color-schemes, fonts, libraries, locale). OpenSCAD resolves its resource
// path from the process cwd, so we run the child from here.
const OPENSCAD_DIR = dirname(OPENSCAD_JS);

const RENDER_TIMEOUT_MS = 60_000;

/**
 * Validate and normalize a project-relative file path. Prevents path traversal
 * when writing files into the temp render dir. Throws on anything unsafe.
 * Returns a forward-slash, normalized relative path.
 */
export function sanitizeProjectPath(rawPath: string): string {
  if (typeof rawPath !== "string" || rawPath.trim() === "") {
    throw new Error("Invalid file path: empty");
  }
  // Normalize separators to forward slash, trim.
  const p = rawPath.replace(/\\/g, "/").trim().replace(/^\.\//, "");
  if (isAbsolute(p) || p.startsWith("/")) {
    throw new Error(`Invalid file path (absolute not allowed): ${rawPath}`);
  }
  if (!/^[A-Za-z0-9._/ -]+$/.test(p)) {
    throw new Error(`Invalid file path (illegal characters): ${rawPath}`);
  }
  const segments = p.split("/").filter((s) => s.length > 0);
  if (segments.some((s) => s === "..")) {
    throw new Error(`Invalid file path (".." not allowed): ${rawPath}`);
  }
  const cleaned = segments.join("/");
  if (!cleaned) throw new Error(`Invalid file path: ${rawPath}`);
  return cleaned;
}

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
      else {
        reject(new Error(`OpenSCAD exited with code ${code}: ${stderr.trim()}`));
      }
    });
  });
}

/**
 * Convert a multi-file OpenSCAD project to a colored GLB buffer, in-process.
 * `entryPath` must match one of the files' (sanitized) paths.
 * Throws on compilation failure.
 */
export async function convertScadProjectToGlb(
  files: ScadFile[],
  entryPath: string,
): Promise<Buffer> {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("files is required and must be a non-empty array");
  }

  const entry = sanitizeProjectPath(entryPath);
  const dir = mkdtempSync(join(tmpdir(), "scad-"));
  const offPath = join(dir, "__out.off");

  try {
    let entryWritten = false;
    for (const file of files) {
      if (typeof file?.content !== "string") {
        throw new Error(`File "${file?.path}" has no content`);
      }
      const rel = sanitizeProjectPath(file.path);
      const dest = join(dir, rel);
      // Defense in depth: ensure the resolved path stays inside the temp dir.
      if (!resolve(dest).startsWith(resolve(dir) + sep)) {
        throw new Error(`Invalid file path (escapes project): ${file.path}`);
      }
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, file.content, "utf-8");
      if (rel === entry) entryWritten = true;
    }
    if (!entryWritten) {
      throw new Error(`Entry file "${entry}" not found in project files`);
    }

    // Step 1: SCAD -> colored OFF via WASM OpenSCAD (manifold backend).
    await runOpenscad([join(dir, entry), "-o", offPath, "--backend=manifold"]);

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

/**
 * Convert a single OpenSCAD source string to a colored GLB buffer.
 * Thin wrapper over convertScadProjectToGlb for the common one-file case.
 */
export async function convertScadToGlb(scadContent: string): Promise<Buffer> {
  if (!scadContent || typeof scadContent !== "string") {
    throw new Error("scadContent is required and must be a string");
  }
  return convertScadProjectToGlb(
    [{ path: "main.scad", content: scadContent }],
    "main.scad",
  );
}
