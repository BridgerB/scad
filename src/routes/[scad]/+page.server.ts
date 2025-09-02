import { db } from "$lib/server/db";
import { scadPhotos, scadRatings, scads, users } from "$lib/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { generateAndUploadGlb } from "$lib/server/glb-upload";
import { convertScadToGlbWithColor } from "$lib/server/convert-scad-with-color";
import { writeFileSync, mkdirSync, unlinkSync, readFileSync } from "fs";
import { dirname } from "path";

export const load: PageServerLoad = async ({ params }) => {
  const scadId = params.scad;

  // Get SCAD details with user info
  const scadData = await db
    .select({
      id: scads.id,
      title: scads.title,
      description: scads.description,
      content: scads.content,
      tags: scads.tags,
      downloadCount: scads.downloadCount,
      fileSize: scads.fileSize,
      isPublic: scads.isPublic,
      createdAt: scads.createdAt,
      updatedAt: scads.updatedAt,
      username: users.username,
      userEmail: users.email,
      glbUrl: scads.glbUrl,
    })
    .from(scads)
    .leftJoin(users, eq(scads.userId, users.id))
    .where(eq(scads.id, scadId))
    .limit(1);

  if (!scadData.length || !scadData[0].isPublic) {
    throw error(404, "SCAD not found");
  }

  const scad = scadData[0];

  // Get all photos for this SCAD
  const photos = await db
    .select({
      id: scadPhotos.id,
      url: scadPhotos.url,
      description: scadPhotos.description,
      order: scadPhotos.order,
    })
    .from(scadPhotos)
    .where(eq(scadPhotos.scadId, scadId))
    .orderBy(scadPhotos.order);

  // Get rating statistics
  const ratingStats = await db
    .select({
      likes: sql<number>`COUNT(CASE WHEN ${scadRatings.rating} = 1 THEN 1 END)`,
      dislikes: sql<
        number
      >`COUNT(CASE WHEN ${scadRatings.rating} = -1 THEN 1 END)`,
    })
    .from(scadRatings)
    .where(eq(scadRatings.scadId, scadId));

  const stats = ratingStats[0] || { likes: 0, dislikes: 0 };


  return {
    scad: {
      ...scad,
      tags: scad.tags ? JSON.parse(scad.tags) : [],
    },
    photos,
    stats,
  };
};

export const actions: Actions = {
  // Live update action - generates local GLB for preview
  updateScad: async ({ request }) => {
    const data = await request.formData();
    const scadContent = data.get("scadContent") as string;
    const scadId = data.get("scadId") as string;

    if (!scadContent || !scadId) {
      return {
        type: "error",
        data: { error: "No SCAD content or ID provided" },
      };
    }

    try {
      // Create temporary files in /tmp for preview
      const tempId = Date.now();
      const tempScadPath = `/tmp/preview-${scadId}-${tempId}.scad`;
      const tempGlbPath = `/tmp/preview-${scadId}-${tempId}.glb`;
      const previewGlbPath = `/home/bridger/git/scad/static/models/previews/${scadId}.glb`;

      // Ensure preview directory exists
      mkdirSync(dirname(previewGlbPath), { recursive: true });

      // Write the SCAD content to temp file
      writeFileSync(tempScadPath, scadContent, "utf-8");

      // Convert to GLB using our conversion function
      await convertScadToGlbWithColor(tempScadPath, tempGlbPath);

      // Copy the generated GLB to preview location
      const glbBuffer = readFileSync(tempGlbPath);
      writeFileSync(previewGlbPath, glbBuffer);

      // Clean up temporary files
      try {
        unlinkSync(tempScadPath);
        unlinkSync(tempGlbPath);
      } catch (cleanupError) {
        console.warn("Could not clean up temp files:", cleanupError);
      }

      return {
        type: "success",
        data: {
          message: "3D model preview updated",
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error updating SCAD preview:", error);
      return {
        type: "error",
        data: {
          error: `Failed to update preview: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      };
    }
  },

  // Save action - updates database and Firebase Storage
  saveScad: async ({ request }) => {
    const data = await request.formData();
    const scadContent = data.get("scadContent") as string;
    const scadId = data.get("scadId") as string;

    if (!scadContent || !scadId) {
      return {
        type: "error",
        data: { error: "No SCAD content or ID provided" },
      };
    }

    try {
      let newGlbUrl = null;
      
      // Generate and upload new GLB file to Firebase
      try {
        console.log(`Saving GLB to Firebase for SCAD ${scadId}...`);
        newGlbUrl = await generateAndUploadGlb(scadContent);
        console.log(`Successfully saved new GLB: ${newGlbUrl}`);
      } catch (glbError) {
        console.error(`Failed to generate GLB for SCAD ${scadId}:`, glbError);
        // Continue with update even if GLB generation fails
      }

      // Update the SCAD content and GLB URL in the database
      await db.update(scads)
        .set({ 
          content: scadContent,
          glbUrl: newGlbUrl, // Update with new GLB URL (or keep existing if generation failed)
          updatedAt: new Date()
        })
        .where(eq(scads.id, scadId));

      return {
        type: "success",
        data: {
          message: newGlbUrl 
            ? "SCAD file saved and 3D model uploaded successfully"
            : "SCAD file saved successfully (3D model upload failed)",
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error saving SCAD file:", error);
      return {
        type: "error",
        data: {
          error: `Failed to save: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      };
    }
  },
};
