import { db } from "$lib/server/db";
import { scadPhotos, scadRatings, scads, users } from "$lib/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { generateAndUploadGlb } from "$lib/server/glb-upload";
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

// In-memory GLB conversion function
async function convertScadToGlbViaApi(scadContent: string): Promise<Buffer> {
  const { env } = await import('$env/dynamic/private');
  const apiUrl = env.OPENSCAD_API_URL;
  const apiKey = env.OPENSCAD_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("OPENSCAD_API_URL and OPENSCAD_API_KEY environment variables are required");
  }

  console.log(`API GLB conversion for ${scadContent.length} characters of SCAD`);

  const response = await fetch(`${apiUrl}/api/convert-scad`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ scadContent }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const result = await response.json();
  
  if (!result.success || !result.glbData) {
    throw new Error(`API conversion failed: ${result.error || 'Unknown error'}`);
  }

  return Buffer.from(result.glbData, 'base64');
}

export const actions: Actions = {
  // Live update action - generates GLB in memory and returns it directly
  updateScad: async ({ request }) => {
    const data = await request.formData();
    const scadContent = data.get("scadContent") as string;
    const scadId = data.get("scadId") as string;

    if (!scadContent || !scadId) {
      return {
        type: "error",
        error: "No SCAD content or ID provided",
      };
    }

    try {
      // Convert SCAD to GLB in memory only (no file system operations)
      console.log(`Generating in-memory GLB preview for SCAD ${scadId}...`);
      const glbBuffer = await convertScadToGlbViaApi(scadContent);
      
      // Convert buffer to base64 for transport
      const glbBase64 = glbBuffer.toString('base64');
      
      console.log(`Successfully generated ${glbBuffer.length} byte GLB preview`);

      return {
        type: "success",
        message: "3D model preview updated",
        glbData: glbBase64,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error updating SCAD preview:", error);
      return {
        type: "error",
        error: `Failed to update preview: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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
          updatedAt: new Date(),
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
