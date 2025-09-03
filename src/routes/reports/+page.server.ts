import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { scads, users } from "$lib/server/db/schema";
import { and, count, desc, eq, sql } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  try {
    // SCAD file upload trends over time
    const scadTrends = await db
      .select({
        date: sql<string>`DATE(${scads.createdAt})`,
        count: count(),
      })
      .from(scads)
      .groupBy(sql`DATE(${scads.createdAt})`)
      .orderBy(sql`DATE(${scads.createdAt})`);

    // Download distribution across all SCAD files
    const allScads = await db
      .select({
        downloadCount: scads.downloadCount,
      })
      .from(scads)
      .where(eq(scads.isPublic, true));

    // Process download distribution in JavaScript
    const downloadRanges = {
      "100+": 0,
      "50-99": 0,
      "20-49": 0,
      "10-19": 0,
      "1-9": 0,
      "0": 0,
    };

    allScads.forEach((scad) => {
      const downloads = scad.downloadCount || 0;
      if (downloads >= 100) downloadRanges["100+"]++;
      else if (downloads >= 50) downloadRanges["50-99"]++;
      else if (downloads >= 20) downloadRanges["20-49"]++;
      else if (downloads >= 10) downloadRanges["10-19"]++;
      else if (downloads >= 1) downloadRanges["1-9"]++;
      else downloadRanges["0"]++;
    });

    const downloadDistribution = Object.entries(downloadRanges).map((
      [range, count],
    ) => ({
      downloadRange: range,
      count,
    }));

    // Most active users (by SCAD file count)
    const activeUsers = await db
      .select({
        username: users.username,
        scadCount: count(scads.id),
        totalDownloads: sql<number>`COALESCE(SUM(${scads.downloadCount}), 0)`,
      })
      .from(users)
      .leftJoin(
        scads,
        and(eq(users.id, scads.userId), eq(scads.isPublic, true)),
      )
      .groupBy(users.id, users.username)
      .orderBy(desc(count(scads.id)))
      .limit(10);

    // Daily uploads over time
    const dailyUploadsRaw = await db
      .select({
        date: sql<string>`DATE(${scads.createdAt})`,
        downloadCount: scads.downloadCount,
      })
      .from(scads)
      .where(eq(scads.isPublic, true))
      .orderBy(sql`DATE(${scads.createdAt})`);

    // Group by date in JavaScript
    const dailyData: Record<
      string,
      { count: number; totalDownloads: number }
    > = {};
    dailyUploadsRaw.forEach((scad) => {
      const date = scad.date;
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, totalDownloads: 0 };
      }
      dailyData[date].count++;
      dailyData[date].totalDownloads += scad.downloadCount || 0;
    });

    const dailyUploads = Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      totalDownloads: data.totalDownloads,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // File size distribution
    const fileSizes = await db
      .select({
        fileSize: scads.fileSize,
      })
      .from(scads)
      .where(and(eq(scads.isPublic, true), sql`${scads.fileSize} IS NOT NULL`));

    const sizeRanges = {
      "< 1KB": 0,
      "1-10KB": 0,
      "10-50KB": 0,
      "50-100KB": 0,
      "> 100KB": 0,
    };

    fileSizes.forEach((scad) => {
      const size = scad.fileSize || 0;
      if (size < 1024) sizeRanges["< 1KB"]++;
      else if (size < 10240) sizeRanges["1-10KB"]++;
      else if (size < 51200) sizeRanges["10-50KB"]++;
      else if (size < 102400) sizeRanges["50-100KB"]++;
      else sizeRanges["> 100KB"]++;
    });

    const fileSizeDistribution = Object.entries(sizeRanges).map((
      [range, count],
    ) => ({
      sizeRange: range,
      count,
    }));

    // Overall statistics
    const totalScads = await db
      .select({ count: count() })
      .from(scads)
      .where(eq(scads.isPublic, true));

    const totalUsers = await db.select({ count: count() }).from(users);

    const totalDownloads = await db
      .select({
        total: sql<number>`COALESCE(SUM(${scads.downloadCount}), 0)`,
      })
      .from(scads)
      .where(eq(scads.isPublic, true));

    // Get files with 3D models
    const scadsWithModels = await db
      .select({ count: count() })
      .from(scads)
      .where(and(eq(scads.isPublic, true), sql`${scads.glbUrl} IS NOT NULL`));

    const hasScads = totalScads[0]?.count > 0;

    return {
      stats: {
        totalScads: totalScads[0]?.count || 0,
        totalUsers: totalUsers[0]?.count || 0,
        totalDownloads: totalDownloads[0]?.total || 0,
        scadsWithModels: scadsWithModels[0]?.count || 0,
      },
      charts: {
        scadTrends: scadTrends.length > 0 ? scadTrends : [
          {
            date: new Date().toISOString().split("T")[0],
            count: totalScads[0]?.count || 0,
          },
        ],
        downloadDistribution: hasScads ? downloadDistribution : [
          { downloadRange: "No files yet", count: 0 },
        ],
        activeUsers: activeUsers.length > 0 ? activeUsers : [
          { username: "No users yet", scadCount: 0, totalDownloads: 0 },
        ],
        dailyUploads: hasScads ? dailyUploads : [
          {
            date: new Date().toISOString().split("T")[0],
            count: 0,
            totalDownloads: 0,
          },
        ],
        fileSizeDistribution: hasScads ? fileSizeDistribution : [
          { sizeRange: "No files yet", count: 0 },
        ],
      },
    };
  } catch (error) {
    console.error("Error loading reports data:", error);
    return {
      stats: {
        totalScads: 0,
        totalUsers: 0,
        totalDownloads: 0,
        scadsWithModels: 0,
      },
      charts: {
        scadTrends: [],
        downloadDistribution: [],
        activeUsers: [],
        dailyUploads: [],
        fileSizeDistribution: [],
      },
    };
  }
};
