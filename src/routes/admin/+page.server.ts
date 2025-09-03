import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { scadPhotos, scadRatings, scads, users } from "$lib/server/db/schema";
import { and, count, desc, eq, sql } from "drizzle-orm";
import JSZip from "jszip";

type DatabaseRecord = Record<string, any>;

type BackupResult = {
  zipBuffer: Buffer;
  timestamp: string;
};

async function convertToCSV(data: DatabaseRecord[]): Promise<string> {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",");
  const rows = data.map((row) => {
    return headers
      .map((header) => {
        let value = row[header];
        if (value === null || value === undefined) {
          return "";
        }
        if (Array.isArray(value)) {
          value = `"${value.join(";")}"`;
        }
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        }
        if (typeof value === "string") {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",");
  });
  return [headerRow, ...rows].join("\n");
}

async function backupDatabase(): Promise<BackupResult> {
  try {
    console.log("🚀 Starting SCAD database backup...\n");

    const zip = new JSZip();

    const now = new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const timestamp = localTime.toISOString().replace(/:/g, "-").split(".")[0];

    // Backup each table individually using schema objects

    // Backup users table
    console.log("Backing up users...");
    const usersData = await db.select().from(users);
    const usersCSV = await convertToCSV(usersData);
    zip.file("users.csv", usersCSV);
    console.log(`✓ Backed up ${usersData.length} records from users`);

    // Backup scads table
    console.log("Backing up scads...");
    const scadsData = await db.select().from(scads);
    const scadsCSV = await convertToCSV(scadsData);
    zip.file("scads.csv", scadsCSV);
    console.log(`✓ Backed up ${scadsData.length} records from scads`);

    // Backup scad_photos table
    console.log("Backing up scad_photos...");
    const photosData = await db.select().from(scadPhotos);
    const photosCSV = await convertToCSV(photosData);
    zip.file("scad_photos.csv", photosCSV);
    console.log(`✓ Backed up ${photosData.length} records from scad_photos`);

    // Backup scad_ratings table
    console.log("Backing up scad_ratings...");
    const ratingsData = await db.select().from(scadRatings);
    const ratingsCSV = await convertToCSV(ratingsData);
    zip.file("scad_ratings.csv", ratingsCSV);
    console.log(`✓ Backed up ${ratingsData.length} records from scad_ratings`);

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });

    console.log("\n✨ SCAD database backup completed successfully!");
    return { zipBuffer, timestamp };
  } catch (error) {
    console.error("\n❌ SCAD database backup failed:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "");
    throw error;
  }
}

export const load: PageServerLoad = async () => {
  try {
    // Get all SCAD files with user info and download counts
    const allScads = await db
      .select({
        id: scads.id,
        title: scads.title,
        description: scads.description,
        userId: scads.userId,
        username: users.username,
        downloadCount: scads.downloadCount,
        fileSize: scads.fileSize,
        glbUrl: scads.glbUrl,
        isPublic: scads.isPublic,
        createdAt: scads.createdAt,
        updatedAt: scads.updatedAt,
      })
      .from(scads)
      .innerJoin(users, eq(scads.userId, users.id))
      .orderBy(desc(scads.createdAt));

    // Get photo counts for each SCAD
    const photoCounts = await db
      .select({
        scadId: scadPhotos.scadId,
        photoCount: count(),
      })
      .from(scadPhotos)
      .groupBy(scadPhotos.scadId);

    // Get rating counts for each SCAD
    const ratingCounts = await db
      .select({
        scadId: scadRatings.scadId,
        ratingCount: count(),
        avgRating: sql<number>`AVG(CAST(${scadRatings.rating} AS FLOAT))`,
      })
      .from(scadRatings)
      .groupBy(scadRatings.scadId);

    // Merge counts with SCAD data
    const scadsWithCounts = allScads.map((scad) => ({
      ...scad,
      photoCount: photoCounts.find((pc) => pc.scadId === scad.id)?.photoCount ||
        0,
      ratingCount: ratingCounts.find((rc) =>
        rc.scadId === scad.id
      )?.ratingCount || 0,
      avgRating: ratingCounts.find((rc) => rc.scadId === scad.id)?.avgRating ||
        0,
    }));

    // System statistics
    const totalScads = await db.select({ count: count() }).from(scads);
    const totalUsers = await db.select({ count: count() }).from(users);
    const totalPhotos = await db.select({ count: count() }).from(scadPhotos);
    const totalDownloads = await db
      .select({ total: sql<number>`COALESCE(SUM(${scads.downloadCount}), 0)` })
      .from(scads);
    const scadsWithModels = await db
      .select({ count: count() })
      .from(scads)
      .where(sql`${scads.glbUrl} IS NOT NULL`);

    // Most active users by upload count
    const activeUsers = await db
      .select({
        userId: users.id,
        username: users.username,
        email: users.email,
        scadCount: count(scads.id),
        totalDownloads: sql<number>`COALESCE(SUM(${scads.downloadCount}), 0)`,
      })
      .from(users)
      .leftJoin(scads, eq(users.id, scads.userId))
      .groupBy(users.id, users.username, users.email)
      .orderBy(desc(count(scads.id)))
      .limit(10);

    // Most downloaded SCAD files
    const mostDownloaded = await db
      .select({
        id: scads.id,
        title: scads.title,
        username: users.username,
        downloadCount: scads.downloadCount,
        createdAt: scads.createdAt,
      })
      .from(scads)
      .innerJoin(users, eq(scads.userId, users.id))
      .where(eq(scads.isPublic, true))
      .orderBy(desc(scads.downloadCount))
      .limit(10);

    return {
      scads: scadsWithCounts,
      stats: {
        totalScads: totalScads[0]?.count || 0,
        totalUsers: totalUsers[0]?.count || 0,
        totalPhotos: totalPhotos[0]?.count || 0,
        totalDownloads: totalDownloads[0]?.total || 0,
        scadsWithModels: scadsWithModels[0]?.count || 0,
      },
      activeUsers,
      mostDownloaded,
    };
  } catch (error) {
    console.error("Error loading admin data:", error);
    return {
      scads: [],
      stats: {
        totalScads: 0,
        totalUsers: 0,
        totalPhotos: 0,
        totalDownloads: 0,
        scadsWithModels: 0,
      },
      activeUsers: [],
      mostDownloaded: [],
    };
  }
};

export const actions: Actions = {
  backup: async () => {
    try {
      const { zipBuffer, timestamp } = await backupDatabase();
      const base64File = zipBuffer.toString("base64");

      return {
        success: true,
        file: base64File,
        filename: `scad-backup-${timestamp}.zip`,
        type: "application/zip",
      };
    } catch (err) {
      console.error("Backup failed:", err);
      return fail(500, { error: "Failed to create backup" });
    }
  },

  deleteScad: async ({ request }) => {
    const data = await request.formData();
    const scadId = data.get("scadId")?.toString();

    if (!scadId) {
      return fail(400, { error: "SCAD ID is required" });
    }

    try {
      // Delete in order: ratings, photos, scad
      await db.delete(scadRatings).where(eq(scadRatings.scadId, scadId));
      await db.delete(scadPhotos).where(eq(scadPhotos.scadId, scadId));
      await db.delete(scads).where(eq(scads.id, scadId));

      return { success: true, message: "SCAD file deleted successfully" };
    } catch (error) {
      console.error("Error deleting SCAD:", error);
      return fail(500, { error: "Failed to delete SCAD file" });
    }
  },

  editScadTitle: async ({ request }) => {
    const data = await request.formData();
    const scadId = data.get("scadId")?.toString();
    const newTitle = data.get("title")?.toString();

    if (!scadId || !newTitle) {
      return fail(400, { error: "SCAD ID and title are required" });
    }

    if (newTitle.trim().length === 0 || newTitle.trim().length > 200) {
      return fail(400, { error: "Title must be between 1 and 200 characters" });
    }

    try {
      await db
        .update(scads)
        .set({ title: newTitle.trim() })
        .where(eq(scads.id, scadId));

      return { success: true, message: "SCAD title updated successfully" };
    } catch (error) {
      console.error("Error updating SCAD title:", error);
      return fail(500, { error: "Failed to update SCAD title" });
    }
  },

  togglePublic: async ({ request }) => {
    const data = await request.formData();
    const scadId = data.get("scadId")?.toString();
    const isPublic = data.get("isPublic") === "true";

    if (!scadId) {
      return fail(400, { error: "SCAD ID is required" });
    }

    try {
      await db
        .update(scads)
        .set({ isPublic: !isPublic })
        .where(eq(scads.id, scadId));

      return {
        success: true,
        message: `SCAD file is now ${!isPublic ? "public" : "private"}`,
      };
    } catch (error) {
      console.error("Error toggling SCAD visibility:", error);
      return fail(500, { error: "Failed to update SCAD visibility" });
    }
  },

  bulkDelete: async ({ request }) => {
    const data = await request.formData();
    const scadIds = data.getAll("selectedScads").map((id) => id.toString());

    if (scadIds.length === 0) {
      return fail(400, { error: "No SCAD files selected" });
    }

    try {
      // Delete in order: ratings, photos, scads
      for (const scadId of scadIds) {
        await db.delete(scadRatings).where(eq(scadRatings.scadId, scadId));
        await db.delete(scadPhotos).where(eq(scadPhotos.scadId, scadId));
        await db.delete(scads).where(eq(scads.id, scadId));
      }

      return {
        success: true,
        message: `Successfully deleted ${scadIds.length} SCAD file${
          scadIds.length > 1 ? "s" : ""
        }`,
      };
    } catch (error) {
      console.error("Error bulk deleting SCAD files:", error);
      return fail(500, { error: "Failed to delete selected SCAD files" });
    }
  },

  clearAllRatings: async () => {
    try {
      await db.delete(scadRatings);
      return {
        success: true,
        message: "All SCAD ratings cleared successfully",
      };
    } catch (error) {
      console.error("Error clearing ratings:", error);
      return fail(500, { error: "Failed to clear SCAD ratings" });
    }
  },

  deleteUser: async ({ request }) => {
    const data = await request.formData();
    const userId = data.get("userId")?.toString();

    if (!userId) {
      return fail(400, { error: "User ID is required" });
    }

    try {
      // First get all SCAD IDs for this user
      const userScads = await db
        .select({ id: scads.id })
        .from(scads)
        .where(eq(scads.userId, userId));

      // Delete all related data for each SCAD
      for (const scad of userScads) {
        await db.delete(scadRatings).where(eq(scadRatings.scadId, scad.id));
        await db.delete(scadPhotos).where(eq(scadPhotos.scadId, scad.id));
      }

      // Delete all user's SCAD files
      await db.delete(scads).where(eq(scads.userId, userId));

      // Delete all ratings made by this user
      await db.delete(scadRatings).where(eq(scadRatings.userId, userId));

      // Finally delete the user
      await db.delete(users).where(eq(users.id, userId));

      return {
        success: true,
        message: "User and all associated data deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      return fail(500, { error: "Failed to delete user" });
    }
  },
};
