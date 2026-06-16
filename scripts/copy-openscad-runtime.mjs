// Postbuild: the in-process OpenSCAD converter (src/lib/server/openscad/convert.ts)
// loads `openscad.cjs` and its resource folders as siblings via
// `new URL("./openscad.cjs", import.meta.url)`. Vite does not copy those data
// files into the server bundle, so we copy them next to the built convert chunk.
import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(root, "src", "lib", "server", "openscad");
const ITEMS = ["openscad.cjs", "color-schemes", "fonts", "libraries", "locale"];

// Output roots to scan (adapter-node final + raw vite output as fallback).
const SCAN_ROOTS = [
  join(root, "build", "server"),
  join(root, ".svelte-kit", "output", "server"),
];

function findConvertDirs(dir, found = new Set()) {
  if (!existsSync(dir)) return found;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) findConvertDirs(p, found);
    else if (/^convert(-[\w]+)?\.js$/.test(name)) found.add(dir);
  }
  return found;
}

if (!existsSync(join(SRC, "openscad.cjs"))) {
  console.error(`[copy-openscad-runtime] source not found: ${SRC}`);
  process.exit(1);
}

const targets = new Set();
for (const r of SCAN_ROOTS) for (const d of findConvertDirs(r)) targets.add(d);

if (targets.size === 0) {
  console.warn("[copy-openscad-runtime] no convert chunk found; nothing copied");
  process.exit(0);
}

for (const target of targets) {
  for (const item of ITEMS) {
    const from = join(SRC, item);
    if (!existsSync(from)) continue;
    cpSync(from, join(target, item), { recursive: true });
  }
  console.log(`[copy-openscad-runtime] copied runtime -> ${target}`);
}
