import { db } from "$lib/server/db";
import { scads, users } from "$lib/server/db/schema";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { generateAndUploadGlb } from "$lib/server/glb-upload";
import { convertScadToGlbWithColor } from "$lib/server/convert-scad-with-color";
import { writeFileSync, mkdirSync, unlinkSync } from "fs";
import { dirname } from "path";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async () => {
	// No initial data needed for create page
	return {};
};

export const actions: Actions = {
	// Preview action - generates temporary GLB for preview
	preview: async ({ request }) => {
		const data = await request.formData();
		const scadContent = data.get("scadContent") as string;

		if (!scadContent) {
			return {
				type: "error",
				data: { error: "No SCAD content provided" },
			};
		}

		try {
			// Create temporary files for preview
			const tempId = Date.now();
			const tempScadPath = `/tmp/preview-${tempId}.scad`;
			const tempGlbPath = `/tmp/preview-${tempId}.glb`;
			const previewGlbPath = `/home/bridger/git/scad/static/models/previews/temp.glb`;

			// Ensure preview directory exists
			mkdirSync(dirname(previewGlbPath), { recursive: true });

			// Write the SCAD content to temp file
			writeFileSync(tempScadPath, scadContent, "utf-8");

			// Convert to GLB using our conversion function
			await convertScadToGlbWithColor(tempScadPath, tempGlbPath);

			// Copy the generated GLB to preview location
			const fs = await import('fs');
			const glbBuffer = fs.readFileSync(tempGlbPath);
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
					message: "Preview generated successfully",
					timestamp: Date.now(),
				},
			};
		} catch (error) {
			console.error("Error generating preview:", error);
			return {
				type: "error",
				data: {
					error: `Failed to generate preview: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				},
			};
		}
	},

	// Create action - saves new SCAD to database
	create: async ({ request }) => {
		const data = await request.formData();
		const title = (data.get("title") as string)?.trim();
		const username = (data.get("username") as string)?.trim();
		const description = (data.get("description") as string)?.trim();
		const content = (data.get("content") as string)?.trim();
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

		if (!content) {
			errors.content = "OpenSCAD code is required";
		} else if (content.length > 100000) {
			errors.content = "Code must be 100,000 characters or less";
		}

		if (description && description.length > 1000) {
			errors.description = "Description must be 1,000 characters or less";
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		// Parse tags
		let tags: string[] = [];
		if (tagsString) {
			tags = tagsString
				.split(',')
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0)
				.slice(0, 10); // Limit to 10 tags
		}

		try {
			// Generate a unique ID for the SCAD
			const scadId = crypto.randomUUID();

			// Create or find user (simplified approach for now)
			let userId: string;
			const email = `${username.toLowerCase().replace(/\s+/g, '')}@example.com`;
			
			// Check if user already exists
			const existingUsers = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, email))
				.limit(1);

			if (existingUsers.length > 0) {
				userId = existingUsers[0].id;
			} else {
				// Create new user
				const [newUser] = await db.insert(users).values({
					username,
					email,
				}).returning({ id: users.id });
				userId = newUser.id;
			}

			let glbUrl: string | null = null;
			
			// Generate and upload GLB file to Firebase
			try {
				console.log(`Generating GLB for new SCAD ${scadId}...`);
				glbUrl = await generateAndUploadGlb(content);
				console.log(`Successfully generated GLB: ${glbUrl}`);
			} catch (glbError) {
				console.error(`Failed to generate GLB for new SCAD ${scadId}:`, glbError);
				// Continue with creation even if GLB generation fails
			}

			// Insert the new SCAD into the database
			const [newScad] = await db.insert(scads).values({
				id: scadId,
				title,
				description: description || null,
				content,
				userId,
				tags: tags.length > 0 ? JSON.stringify(tags) : null,
				downloadCount: 0,
				fileSize: content.length,
				isPublic: true,
				glbUrl,
				createdAt: new Date(),
				updatedAt: new Date(),
			}).returning({ id: scads.id });

			// Success - redirect to the new SCAD page
			throw redirect(303, `/${newScad.id}`);
		} catch (error) {
			// Check if this is actually a redirect (which is expected)
			if (
				error && typeof error === "object" && "status" in error &&
				error.status === 303
			) {
				throw error; // Re-throw redirect - this is the expected behavior
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