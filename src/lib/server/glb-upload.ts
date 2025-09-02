import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { bucket } from "./firebase-admin";
import { convertScadToGlbWithColor } from "./convert-scad-with-color";
import { randomUUID } from "crypto";

export async function generateAndUploadGlb(
  scadContent: string,
): Promise<string> {
  const tempId = Date.now().toString();
  const glbId = randomUUID();

  // Create temporary SCAD file
  const tempScadPath = `/tmp/temp-${tempId}.scad`;
  const tempGlbPath = `/tmp/temp-${tempId}.glb`;

  try {
    // Write SCAD content to temporary file with proper encoding
    writeFileSync(tempScadPath, scadContent, "utf8");
    console.log(`Written SCAD content to: ${tempScadPath}`);
    console.log(`SCAD content preview: ${scadContent.substring(0, 100)}...`);

    // Convert SCAD to GLB using existing utility
    await convertScadToGlbWithColor(tempScadPath, tempGlbPath);

    // Read the generated GLB file
    const glbBuffer = readFileSync(tempGlbPath);

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
  } finally {
    // Clean up temporary files
    try {
      unlinkSync(tempScadPath);
    } catch (e) {
      console.warn("Could not clean up temp SCAD file:", tempScadPath);
    }

    try {
      unlinkSync(tempGlbPath);
    } catch (e) {
      console.warn("Could not clean up temp GLB file:", tempGlbPath);
    }
  }
}
