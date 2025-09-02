import { db } from "$lib/server/db";
import { scadPhotos, scads, users } from "$lib/server/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import type { PageServerLoad } from "./$types";
import { convertScadToGlbWithColor } from "$lib/server/convert-scad-with-color";

import { count } from "drizzle-orm";

export const load: PageServerLoad = async ({ url }) => {
  const searchQuery = url.searchParams.get("search")?.trim();
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 25;
  const offset = (page - 1) * limit;

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

  // Get total count for pagination
  const totalCountResult = await db
    .select({ count: count() })
    .from(scads)
    .leftJoin(users, eq(scads.userId, users.id))
    .where(whereClause);

  const totalCount = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get paginated results
  const scadData = await db
    .select({
      id: scads.id,
      title: scads.title,
      description: scads.description,
      content: scads.content,
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
    .limit(limit)
    .offset(offset);

  // Generate GLB files for SCADs that don't have them (async, don't wait)
  scadData.forEach(async (scad) => {
    if (scad.content) {
      const tempScadPath = `/home/bridger/git/scad/static/models/scads/${scad.id}.scad`;
      const outputGlbPath = `/home/bridger/git/scad/static/models/scads/${scad.id}.glb`;
      
      if (!existsSync(outputGlbPath)) {
        try {
          // Ensure directory exists
          mkdirSync(dirname(tempScadPath), { recursive: true });
          
          // Write the SCAD content to temp file
          writeFileSync(tempScadPath, scad.content, "utf-8");

          // Convert to GLB using our conversion function (don't await - run in background)
          convertScadToGlbWithColor(tempScadPath, outputGlbPath).catch(error => {
            console.error(`Error generating GLB for SCAD ${scad.id}:`, error);
          });
        } catch (error) {
          console.error(`Error setting up GLB generation for SCAD ${scad.id}:`, error);
        }
      }
    }
  });

  return {
    scads: scadData,
    searchQuery: searchQuery || "",
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
