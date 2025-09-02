#!/usr/bin/env tsx

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { execSync } from "child_process";

// Import the conversion utilities from openscad-playground project
import { parseOff } from "/home/bridger/git/openscad-playground/src/io/import_off.ts";
import { exportGlb } from "/home/bridger/git/openscad-playground/src/io/export_glb.ts";

async function convertScadToGlbWithColor(
  scadPath = "/home/bridger/git/scad/static/models/generated/output.scad",
  customOutputPath?: string
) {
  const tempOffPath = "/tmp/output-color.off";
  const outputGlbPath = customOutputPath || "/home/bridger/git/scad/static/models/generated/output.glb";

  console.log(`Converting SCAD with colors: ${scadPath}`);

  // Step 1: Generate OFF file with colors using OpenSCAD with Manifold backend
  console.log("Generating OFF file with colors using OpenSCAD...");
  try {
    execSync(`openscad --backend=manifold -o ${tempOffPath} ${scadPath}`, {
      stdio: "inherit",
    });
    console.log(`Generated colored OFF file: ${tempOffPath}`);
  } catch (error) {
    console.error("Failed to generate OFF file:", error);
    throw new Error(`OpenSCAD compilation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Step 2: Parse the OFF file
  console.log("Parsing OFF file...");
  const offContent = readFileSync(tempOffPath, "utf-8");
  const polyhedron = parseOff(offContent);

  console.log(
    `Parsed OFF: ${polyhedron.vertices.length} vertices, ${polyhedron.faces.length} faces, ${polyhedron.colors.length} colors`,
  );

  // Step 2.5: Fix coordinate system (OpenSCAD Z-up to GLB Y-up) + flip upside down
  console.log("Applying coordinate system transformation...");
  const transformedPolyhedron = {
    vertices: polyhedron.vertices.map((vertex) => ({
      x: vertex.x, // X stays the same
      y: vertex.z, // Y = Z (was -Z, now flipped)
      z: -vertex.y, // Z = -Y (was Y, now flipped)
    })),
    faces: polyhedron.faces,
    colors: polyhedron.colors,
  };

  // Step 3: Convert to GLB
  console.log("Converting to GLB format...");
  const glbBlob = await exportGlb(transformedPolyhedron);
  const glbBuffer = Buffer.from(await glbBlob.arrayBuffer());

  // Step 4: Ensure output directory exists and write GLB file
  mkdirSync(dirname(outputGlbPath), { recursive: true });
  writeFileSync(outputGlbPath, glbBuffer);

  console.log(
    `Successfully converted to ${outputGlbPath} (${glbBuffer.length} bytes)`,
  );

  // Clean up temporary file
  try {
    execSync(`rm ${tempOffPath}`);
  } catch (error) {
    console.warn("Could not clean up temp file:", tempOffPath);
  }
}

// Run the conversion if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await convertScadToGlbWithColor();
}

export { convertScadToGlbWithColor };
