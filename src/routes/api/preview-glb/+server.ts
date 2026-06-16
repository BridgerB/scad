import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { convertScadToGlb } from "$lib/server/openscad/convert";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { scadContent, scadId } = await request.json();

    if (!scadContent || !scadId) {
      return json({
        success: false,
        error: "No SCAD content or ID provided",
      }, { status: 400 });
    }

    // Convert SCAD to GLB in memory only (no file system operations)
    console.log(`Generating in-memory GLB preview for SCAD ${scadId}...`);
    const glbBuffer = await convertScadToGlb(scadContent);

    // Convert buffer to base64 for transport
    const glbBase64 = glbBuffer.toString("base64");

    console.log(`Successfully generated ${glbBuffer.length} byte GLB preview`);

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
