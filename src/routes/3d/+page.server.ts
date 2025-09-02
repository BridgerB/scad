import { readFileSync, writeFileSync } from "fs";
import { convertScadToGlbWithColor } from "$lib/server/convert-scad-with-color.ts";

const SCAD_FILE_PATH = "/home/bridger/git/scad/static/models/house/house.scad";

export const load = async () => {
  // Read the current SCAD file content
  const scadContent = readFileSync(SCAD_FILE_PATH, "utf-8");

  return {
    scadContent,
    glbPath: "/models/house/house.glb",
    models: [
      {
        name: "House Model",
        path: "/models/house/house.glb",
        environment: "/environments/default.hdr",
      },
    ],
  };
};

export const actions = {
  updateScad: async ({ request }) => {
    const data = await request.formData();
    const scadContent = data.get("scadContent") as string;

    if (!scadContent) {
      return { success: false, error: "No SCAD content provided" };
    }

    try {
      // Write the updated SCAD content to file
      writeFileSync(SCAD_FILE_PATH, scadContent, "utf-8");

      // Run the conversion to update the GLB file
      await convertScadToGlbWithColor();

      return {
        success: true,
        message: "SCAD file updated and GLB regenerated successfully",
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error updating SCAD file:", error);
      return {
        success: false,
        error: `Failed to update: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },
};
