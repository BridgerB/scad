// In-process GLB generation (bundled WASM OpenSCAD) + Firebase upload.
// No external conversion service required.
import { bucket } from "./firebase-admin";
import { randomUUID } from "crypto";
import {
  convertScadProjectToGlb,
  convertScadToGlb,
  type ScadFile,
} from "./openscad/convert";

async function uploadGlb(glbBuffer: Buffer): Promise<string> {
  const glbId = randomUUID();
  const fileName = `scads/${glbId}.glb`;
  const file = bucket.file(fileName);

  await file.save(glbBuffer, {
    metadata: {
      contentType: "model/gltf-binary",
      cacheControl: "public, max-age=31536000",
    },
  });
  await file.makePublic();

  const publicUrl =
    `https://storage.googleapis.com/scad-bridgerb-com.firebasestorage.app/${fileName}`;
  console.log(
    `Successfully uploaded GLB to Firebase: ${fileName} (${glbBuffer.length} bytes)`,
  );
  return publicUrl;
}

export async function generateAndUploadGlb(
  scadContent: string,
): Promise<string> {
  try {
    const glbBuffer = await convertScadToGlb(scadContent);
    return await uploadGlb(glbBuffer);
  } catch (error) {
    console.error("Failed to generate or upload GLB:", error);
    throw error;
  }
}

export async function generateAndUploadGlbFromProject(
  files: ScadFile[],
  entryPath: string,
): Promise<string> {
  try {
    const glbBuffer = await convertScadProjectToGlb(files, entryPath);
    return await uploadGlb(glbBuffer);
  } catch (error) {
    console.error("Failed to generate or upload project GLB:", error);
    throw error;
  }
}
