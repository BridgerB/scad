import { db } from "$lib/server/db";
import { scadPhotos, scadRatings, scads, users } from "$lib/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import type { PageServerLoad, Actions } from "./$types";
import { convertScadToGlbWithColor } from "$lib/server/convert-scad-with-color";

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

  // Check if GLB model exists, if not generate it
  const tempScadPath = `/home/bridger/git/scad/static/models/scads/${scadId}.scad`;
  const outputGlbPath = `/home/bridger/git/scad/static/models/scads/${scadId}.glb`;
  
  if (!existsSync(outputGlbPath)) {
    try {
      // Ensure directory exists
      mkdirSync(dirname(tempScadPath), { recursive: true });
      
      // Write the SCAD content to temp file
      writeFileSync(tempScadPath, scad.content, "utf-8");

      // Convert to GLB using our conversion function
      await convertScadToGlbWithColor(tempScadPath, outputGlbPath);
    } catch (error) {
      console.error("Error generating initial GLB file:", error);
      // Continue without failing the page load
    }
  }

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
  updateScad: async ({ request }) => {
    const data = await request.formData();
    const scadContent = data.get("scadContent") as string;
    const scadId = data.get("scadId") as string;

    if (!scadContent || !scadId) {
      return { 
        type: "error", 
        data: { error: "No SCAD content or ID provided" }
      };
    }

    try {
      // Create scad-specific temp file path
      const tempScadPath = `/home/bridger/git/scad/static/models/scads/${scadId}.scad`;
      const outputGlbPath = `/home/bridger/git/scad/static/models/scads/${scadId}.glb`;
      
      // Ensure directory exists
      mkdirSync(dirname(tempScadPath), { recursive: true });
      
      // Write the SCAD content to temp file
      writeFileSync(tempScadPath, scadContent, "utf-8");

      // Convert to GLB using our conversion function
      await convertScadToGlbWithColor(tempScadPath, outputGlbPath);

      return {
        type: "success",
        data: {
          message: "SCAD file updated and GLB regenerated successfully",
          timestamp: Date.now(),
        }
      };
    } catch (error) {
      console.error("Error updating SCAD file:", error);
      return {
        type: "error",
        data: {
          error: `Failed to update: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        }
      };
    }
  },
};
