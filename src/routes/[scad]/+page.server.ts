import { db } from "$lib/server/db";
import { scadPhotos, scadRatings, scads, users } from "$lib/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { generateAndUploadGlbFromProject } from "$lib/server/glb-upload";
import { convertScadProjectToGlb } from "$lib/server/openscad/convert";
import {
  entryContent,
  loadProject,
  saveProjectFiles,
  validateProject,
} from "$lib/server/scad-files";

export const load: PageServerLoad = async ({ params }) => {
  const scadId = params.scad;

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

  // Load the project's files (synthesizes a single main.scad for legacy rows).
  const project = await loadProject(scadId, scad.content ?? "");

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
    project,
    photos,
    stats,
  };
};

// Parse a project from the form: prefers the `project` JSON field, falls back
// to a legacy single `scadContent` field.
function readProject(data: FormData) {
  const projectJson = data.get("project");
  if (typeof projectJson === "string" && projectJson.trim()) {
    return validateProject(JSON.parse(projectJson));
  }
  const content = (data.get("scadContent") as string) ?? "";
  return { files: [{ path: "main.scad", content }], entryPath: "main.scad" };
}

export const actions: Actions = {
  // Live update action - generates GLB in memory and returns it directly
  updateScad: async ({ request }) => {
    const data = await request.formData();
    const scadId = data.get("scadId") as string;

    let project;
    try {
      project = readProject(data);
    } catch (e) {
      return {
        type: "error",
        error: e instanceof Error ? e.message : "Invalid project",
      };
    }
    if (!scadId || !entryContent(project).trim()) {
      return { type: "error", error: "No SCAD content or ID provided" };
    }

    try {
      const glbBuffer = await convertScadProjectToGlb(
        project.files,
        project.entryPath,
      );
      return {
        type: "success",
        message: "3D model preview updated",
        glbData: glbBuffer.toString("base64"),
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

  // Save action - updates database (scads + scad_files) and Firebase Storage
  saveScad: async ({ request }) => {
    const data = await request.formData();
    const scadId = data.get("scadId") as string;

    let project;
    try {
      project = readProject(data);
    } catch (e) {
      return {
        type: "error",
        data: { error: e instanceof Error ? e.message : "Invalid project" },
      };
    }
    if (!scadId || !entryContent(project).trim()) {
      return { type: "error", data: { error: "No SCAD content or ID provided" } };
    }

    try {
      let newGlbUrl = null;
      try {
        newGlbUrl = await generateAndUploadGlbFromProject(
          project.files,
          project.entryPath,
        );
      } catch (glbError) {
        console.error(`Failed to generate GLB for SCAD ${scadId}:`, glbError);
      }

      await db.update(scads)
        .set({
          content: entryContent(project),
          fileSize: project.files.reduce((n, f) => n + f.content.length, 0),
          glbUrl: newGlbUrl,
          updatedAt: new Date(),
        })
        .where(eq(scads.id, scadId));

      await saveProjectFiles(scadId, project);

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
