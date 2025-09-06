// API-based GLB generation and upload - no file system operations needed
import { bucket } from "./firebase-admin";
import { randomUUID } from "crypto";
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

  console.log(`\n=== API GLB Upload: SCAD to GLB Conversion Started ===`);
  console.log(`API Endpoint: ${apiUrl}`);
  console.log(`SCAD content length: ${scadContent.length} characters`);
  console.log(
    `SCAD content preview (first 100 chars): ${
      scadContent.substring(0, 100)
    }...`,
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

    console.log(`API conversion successful: ${result.metadata.glbSize} bytes`);

    // Decode base64 GLB data
    const glbBuffer = Buffer.from(result.glbData, "base64");
    console.log(`Decoded GLB buffer: ${glbBuffer.length} bytes`);
    console.log(`=== API GLB Upload: SCAD to GLB Conversion Complete ===\n`);

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

export async function generateAndUploadGlb(
  scadContent: string,
): Promise<string> {
  const glbId = randomUUID();

  try {
    console.log(
      `Generating GLB for upload: ${scadContent.substring(0, 100)}...`,
    );

    // Convert SCAD to GLB using API
    const glbBuffer = await convertScadToGlbViaApi(scadContent);

    // Upload to Firebase Storage
    const fileName = `scads/${glbId}.glb`;
    const file = bucket.file(fileName);

    await file.save(glbBuffer, {
      metadata: {
        contentType: "model/gltf-binary",
        cacheControl: "public, max-age=31536000",
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl =
      `https://storage.googleapis.com/scad-bridgerb-com.firebasestorage.app/${fileName}`;

    console.log(
      `Successfully uploaded GLB to Firebase: ${fileName} (${glbBuffer.length} bytes)`,
    );

    return publicUrl;
  } catch (error) {
    console.error("Failed to generate or upload GLB:", error);
    throw error;
  }
  // No temporary file cleanup needed since we use API directly
}
