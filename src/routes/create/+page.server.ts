import { db } from "$lib/server/db";
import { scads, users } from "$lib/server/db/schema";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { generateAndUploadGlbFromProject } from "$lib/server/glb-upload";
import {
  entryContent,
  projectFromForm,
  saveProjectFiles,
} from "$lib/server/scad-files";
import type { ScadFile } from "$lib/server/openscad/convert";
import { eq } from "drizzle-orm";

import { getShape } from "$lib/shapes";

// Featured example sources (server-only), loaded as raw strings at build time.
import houseMain from "../../../static/models/house_modular/main.scad?raw";
import houseConfig from "../../../static/models/house_modular/config.scad?raw";
import houseStructure from "../../../static/models/house_modular/house_structure.scad?raw";
import houseWindows from "../../../static/models/house_modular/windows.scad?raw";
import houseDoors from "../../../static/models/house_modular/doors.scad?raw";
import houseUtilities from "../../../static/models/house_modular/utilities.scad?raw";
import houseLandscaping from "../../../static/models/house_modular/landscaping.scad?raw";
import houseFence from "../../../static/models/house_modular/fence.scad?raw";

type FeaturedProject = {
  files: ScadFile[];
  entryPath: string;
  preview: string;
};

const featuredProjects: Record<string, FeaturedProject> = {
  "house-modular": {
    entryPath: "main.scad",
    preview: "/featured/house.glb",
    files: [
      { path: "main.scad", content: houseMain },
      { path: "config.scad", content: houseConfig },
      { path: "house_structure.scad", content: houseStructure },
      { path: "windows.scad", content: houseWindows },
      { path: "doors.scad", content: houseDoors },
      { path: "utilities.scad", content: houseUtilities },
      { path: "landscaping.scad", content: houseLandscaping },
      { path: "fence.scad", content: houseFence },
    ],
  },
};

const DEFAULT_CODE = `// Start designing! Edit this or add files.
cylinder(h = 20, r = 8, $fn = 64);
`;

function oneFile(content: string) {
  return { files: [{ path: "main.scad", content }], entryPath: "main.scad" };
}

export const load: PageServerLoad = async ({ url }) => {
  // Optional ?featured=<id> prefills a multi-file example (home page).
  const featuredId = url.searchParams.get("featured");
  const feat = featuredId ? featuredProjects[featuredId] : undefined;
  if (feat) {
    return {
      project: { files: feat.files, entryPath: feat.entryPath },
      initialPreview: feat.preview,
    };
  }

  // Optional ?shape=<id> prefills the editor from the Shapes tab.
  const shapeId = url.searchParams.get("shape");
  const shape = shapeId ? getShape(shapeId) : undefined;
  if (shape) {
    return {
      project: oneFile(shape.code),
      initialPreview: `/shapes/${shape.id}.glb`,
    };
  }

  return { project: oneFile(DEFAULT_CODE), initialPreview: null };
};

export const actions: Actions = {
  // Create action - saves new SCAD to database
  create: async ({ request }) => {
    const data = await request.formData();
    const title = (data.get("title") as string)?.trim();
    const username = (data.get("username") as string)?.trim();
    const description = (data.get("description") as string)?.trim();
    const tagsString = (data.get("tags") as string)?.trim();

    // Validation
    const errors: Record<string, string> = {};

    if (!title) {
      errors.title = "Title is required";
    } else if (title.length > 200) {
      errors.title = "Title must be 200 characters or less";
    }

    if (!username) {
      errors.username = "Your name is required";
    } else if (username.length > 100) {
      errors.username = "Name must be 100 characters or less";
    }

    if (description && description.length > 1000) {
      errors.description = "Description must be 1,000 characters or less";
    }

    // Parse + validate the multi-file project.
    let project;
    try {
      project = projectFromForm(data);
      if (!entryContent(project).trim()) {
        errors.content = "The entry file is empty";
      }
    } catch (e) {
      errors.content = e instanceof Error ? e.message : "Invalid project";
    }

    if (Object.keys(errors).length > 0 || !project) {
      return fail(400, { errors });
    }

    try {
      const scadId = crypto.randomUUID();

      // Create or find user (simplified approach for now)
      let userId: string;
      const email = `${username.toLowerCase().replace(/\s+/g, "")}@example.com`;
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
      } else {
        const [newUser] = await db.insert(users).values({ username, email })
          .returning({ id: users.id });
        userId = newUser.id;
      }

      // Parse tags
      let tags: string[] = [];
      if (tagsString) {
        tags = tagsString.split(",").map((t) => t.trim()).filter((t) =>
          t.length > 0
        ).slice(0, 10);
      }

      // Generate and upload GLB from the project.
      let glbUrl: string | null = null;
      try {
        glbUrl = await generateAndUploadGlbFromProject(
          project.files,
          project.entryPath,
        );
      } catch (glbError) {
        console.error(`Failed to generate GLB for new SCAD ${scadId}:`, glbError);
      }

      const content = entryContent(project);
      const totalSize = project.files.reduce((n, f) => n + f.content.length, 0);

      const [newScad] = await db.insert(scads).values({
        id: scadId,
        title,
        description: description || null,
        content,
        userId,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        downloadCount: 0,
        fileSize: totalSize,
        isPublic: true,
        glbUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({ id: scads.id });

      await saveProjectFiles(newScad.id, project);

      throw redirect(303, `/${newScad.id}`);
    } catch (error) {
      if (
        error && typeof error === "object" && "status" in error &&
        error.status === 303
      ) {
        throw error;
      }
      console.error("Error creating SCAD:", error);
      return fail(500, {
        error: `Failed to create SCAD file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  },
};
