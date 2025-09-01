import { db } from "$lib/server/db";
import { scadPhotos, scadRatings, scads, users } from "$lib/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

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

  return {
    scad: {
      ...scad,
      tags: scad.tags ? JSON.parse(scad.tags) : [],
    },
    photos,
    stats,
  };
};
