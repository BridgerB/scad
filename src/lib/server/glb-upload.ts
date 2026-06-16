// In-process GLB generation (bundled WASM OpenSCAD) + Firebase upload.
// No external conversion service required.
import { bucket } from "./firebase-admin";
import { randomUUID } from "crypto";
import { convertScadToGlb } from "./openscad/convert";

export async function generateAndUploadGlb(
  scadContent: string,
): Promise<string> {
  const glbId = randomUUID();

  try {
    console.log(
      `Generating GLB for upload: ${scadContent.substring(0, 100)}...`,
    );

    // Convert SCAD to GLB in-process (bundled WASM OpenSCAD)
    const glbBuffer = await convertScadToGlb(scadContent);

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
