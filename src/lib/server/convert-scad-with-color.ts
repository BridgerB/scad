#!/usr/bin/env tsx

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { env } from "$env/dynamic/private";

// API client for OpenSCAD conversion service
async function convertScadToGlbViaApi(scadContent: string): Promise<Buffer> {
  const apiUrl = env.OPENSCAD_API_URL;
  const apiKey = env.OPENSCAD_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "OPENSCAD_API_URL and OPENSCAD_API_KEY environment variables are required",
    );
  }

  console.log(`\n=== API SCAD to GLB Conversion Started ===`);
  console.log(`API Endpoint: ${apiUrl}`);
  console.log(`SCAD content length: ${scadContent.length} characters`);
  console.log(`SCAD content preview (first 200 chars):`);
  console.log(
    `"${scadContent.substring(0, 200)}${
      scadContent.length > 200 ? "..." : ""
    }"`,
  );

  try {
    const response = await fetch(`${apiUrl}/api/convert-scad`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        scadContent: scadContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorData}`,
      );
    }

    const result = await response.json();

    if (!result.success || !result.glbData) {
      throw new Error(
        `API conversion failed: ${result.error || "Unknown error"}`,
      );
    }

    console.log(`API conversion successful:`);
    console.log(`- Vertices: ${result.metadata.vertices}`);
    console.log(`- Faces: ${result.metadata.faces}`);
    console.log(`- Colors: ${result.metadata.colors}`);
    console.log(`- GLB size: ${result.metadata.glbSize} bytes`);

    // Decode base64 GLB data
    const glbBuffer = Buffer.from(result.glbData, "base64");
    console.log(`Decoded GLB buffer: ${glbBuffer.length} bytes`);
    console.log(`=== API SCAD to GLB Conversion Complete ===\n`);

    return glbBuffer;
  } catch (error) {
    console.error("API conversion failed:", error);
    throw new Error(
      `OpenSCAD API conversion failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

async function convertScadToGlbWithColor(
  scadPath = "/home/bridger/git/scad/static/models/generated/output.scad",
  customOutputPath?: string,
) {
  const outputGlbPath = customOutputPath ||
    "/home/bridger/git/scad/static/models/generated/output.glb";

  console.log(`\n=== SCAD to GLB Conversion Started ===`);
  console.log(`Converting SCAD file: ${scadPath}`);
  console.log(`Output path: ${outputGlbPath}`);

  try {
    // Read SCAD content from file
    const scadContent = readFileSync(scadPath, "utf-8");
    console.log(`Read SCAD file: ${scadContent.length} characters`);

    // Convert via API
    const glbBuffer = await convertScadToGlbViaApi(scadContent);

    // Ensure output directory exists and write GLB file
    console.log(`\n--- Writing GLB file ---`);
    console.log(`Creating output directory: ${dirname(outputGlbPath)}`);
    mkdirSync(dirname(outputGlbPath), { recursive: true });
    writeFileSync(outputGlbPath, glbBuffer);

    console.log(
      `Successfully converted to ${outputGlbPath} (${glbBuffer.length} bytes)`,
    );
    console.log(`=== SCAD to GLB Conversion Complete ===\n`);
  } catch (error) {
    console.error("Conversion failed:", error);
    throw error;
  }
}

// Run the conversion if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await convertScadToGlbWithColor();
}

export { convertScadToGlbWithColor };
