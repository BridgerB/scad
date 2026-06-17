import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import {
  convertScadProjectToGlb,
  convertScadToGlb,
} from "$lib/server/openscad/convert";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { scadContent, files, entryPath } = body;

    let glbBuffer: Buffer;

    if (Array.isArray(files) && files.length > 0) {
      // Multi-file project preview.
      glbBuffer = await convertScadProjectToGlb(files, entryPath);
    } else if (typeof scadContent === "string" && scadContent.trim()) {
      // Legacy single-file preview.
      glbBuffer = await convertScadToGlb(scadContent);
    } else {
      return json({
        success: false,
        error: "No SCAD content or files provided",
      }, { status: 400 });
    }

    const glbBase64 = glbBuffer.toString("base64");
    console.log(`Generated ${glbBuffer.length} byte GLB preview`);

    return json({
      success: true,
      message: "3D model preview updated",
      glbData: glbBase64,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error updating SCAD preview:", error);
    return json({
      success: false,
      error: `Failed to update preview: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    }, { status: 500 });
  }
};
