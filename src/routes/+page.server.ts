import { db } from "$lib/server/db";
import { scadPhotos, scads, users } from "$lib/server/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const searchQuery = url.searchParams.get("search")?.trim();

  let whereClause = eq(scads.isPublic, true);

  if (searchQuery) {
    whereClause = and(
      eq(scads.isPublic, true),
      or(
        ilike(scads.title, `%${searchQuery}%`),
        ilike(scads.description, `%${searchQuery}%`),
        ilike(scads.tags, `%${searchQuery}%`),
        ilike(users.username, `%${searchQuery}%`),
      ),
    );
  }

  const scadData = await db
    .select({
      id: scads.id,
      title: scads.title,
      description: scads.description,
      downloadCount: scads.downloadCount,
      createdAt: scads.createdAt,
      username: users.username,
      firstPhoto: scadPhotos.url,
    })
    .from(scads)
    .leftJoin(users, eq(scads.userId, users.id))
    .leftJoin(scadPhotos, eq(scads.id, scadPhotos.scadId))
    .where(whereClause)
    .orderBy(desc(scads.createdAt))
    .limit(20);

  return {
    scads: scadData,
    searchQuery: searchQuery || "",
  };
};
