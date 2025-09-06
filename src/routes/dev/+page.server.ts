import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { scadPhotos, scadRatings, scads, users } from "$lib/server/db/schema";
import { count, desc, sql } from "drizzle-orm";
import { generateAndUploadGlb } from "$lib/server/glb-upload";

const sampleTitles = [
  "Parametric Gear Generator",
  "Modular Box System",
  "Threaded Bottle Cap",
  "Parametric Vase",
  "Phone Stand",
  "Cable Management Clips",
  "Desk Organizer",
  "Miniature House Model",
  "Customizable Keychain",
  "Arduino Case",
  "Lamp Shade Design",
  "Puzzle Box",
  "Tool Holder",
  "Plant Pot",
  "Mechanical Joints",
  "Hexagonal Storage",
  "Spiral Staircase",
  "Logo Embosser",
  "Coin Holder",
  "Bracket Mount",
];

const sampleDescriptions = [
  "A fully parametric gear system with customizable teeth count and module size.",
  "Modular storage solution that can be combined in various configurations.",
  "Standard bottle cap with custom threading for various bottle sizes.",
  "Elegant vase design with adjustable height and pattern variations.",
  "Adjustable phone stand for different device sizes and viewing angles.",
  "Simple clips to organize cables on your desk or workspace.",
  "Multi-compartment organizer for pens, paper clips, and small items.",
  "Detailed miniature house perfect for architectural visualization.",
  "Personalized keychain with customizable text and shapes.",
  "Protective case for Arduino boards with access to all ports.",
  "Modern lamp shade with parametric pattern cutouts.",
  "Mechanical puzzle box with hidden opening mechanism.",
  "Wall-mounted holder for screwdrivers, wrenches, and other tools.",
  "Decorative plant pot with drainage holes and saucer.",
  "Collection of mechanical joints for robotics and articulated models.",
  "Honeycomb-inspired storage containers that tessellate perfectly.",
  "Miniature spiral staircase model with railings and supports.",
  "Custom logo embosser for creating raised impressions.",
  "Organized coin storage with slots for different denominations.",
  "Universal mounting bracket for various applications.",
];

const sampleScadCode = [
  `// Parametric Gear
module gear(teeth=20, mod=2, height=5) {
    linear_extrude(height)
        circle(r=teeth*mod/2, $fn=teeth*4);
}

gear();`,

  `// Storage Box
module storage_box(width=50, depth=30, height=20) {
    difference() {
        cube([width, depth, height]);
        translate([2, 2, 2])
            cube([width-4, depth-4, height]);
    }
}

storage_box();`,

  `// Simple Cube
cube([20, 20, 20]);`,

  `// Simple Cylinder
cylinder(r=10, h=15, $fn=50);`,
];

const sampleUsernames = [
  "maker3d",
  "designpro",
  "cadmaster",
  "printlover",
  "engineer42",
  "creator99",
  "3dgenius",
  "modelking",
  "scadexpert",
  "fablab",
  "prototyper",
  "meshmaker",
  "solidworks",
  "parametric",
  "openhardware",
];

const samplePhotoUrls = [
  "https://picsum.photos/400/300?random=1",
  "https://picsum.photos/400/300?random=2",
  "https://picsum.photos/400/300?random=3",
  "https://picsum.photos/400/300?random=4",
  "https://picsum.photos/400/300?random=5",
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const load: PageServerLoad = async () => {
  try {
    // Database health check
    const dbHealthCheck = await db
      .select({ now: sql<string>`NOW()` })
      .from(sql`(SELECT NOW() as now) as health_check`)
      .limit(1);

    // Get table sizes
    const scadTableSize = await db.select({ count: count() }).from(scads);
    const userTableSize = await db.select({ count: count() }).from(users);
    const photoTableSize = await db.select({ count: count() }).from(scadPhotos);
    const ratingTableSize = await db.select({ count: count() }).from(
      scadRatings,
    );

    // Get recent database activity
    const recentScads = await db
      .select({
        id: scads.id,
        title: scads.title,
        createdAt: scads.createdAt,
      })
      .from(scads)
      .orderBy(desc(scads.createdAt))
      .limit(5);

    const recentUsers = await db
      .select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    // System information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
    };

    return {
      dbHealth: {
        status: "connected",
        timestamp: dbHealthCheck[0]?.now || new Date().toISOString(),
      },
      tableStats: {
        scads: scadTableSize[0]?.count || 0,
        users: userTableSize[0]?.count || 0,
        photos: photoTableSize[0]?.count || 0,
        ratings: ratingTableSize[0]?.count || 0,
      },
      recentActivity: {
        scads: recentScads,
        users: recentUsers,
      },
      systemInfo,
    };
  } catch (error) {
    console.error("Error loading dev data:", error);
    return {
      dbHealth: {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      tableStats: { scads: 0, users: 0, photos: 0, ratings: 0 },
      recentActivity: { scads: [], users: [] },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || "development",
      },
    };
  }
};

export const actions: Actions = {
  seed: async ({ request }) => {
    const data = await request.formData();
    const count = parseInt(data.get("count") as string) || 10;

    try {
      // Truncate all tables before seeding
      console.log("Truncating existing data...");
      await db.delete(scadRatings);
      await db.delete(scadPhotos);
      await db.delete(scads);
      await db.delete(users);
      console.log("Tables truncated successfully");

      // Create some sample users first
      const userIds = [];
      for (let i = 0; i < Math.min(5, count); i++) {
        const timestamp = Date.now();
        const [user] = await db.insert(users).values({
          username: `${randomChoice(sampleUsernames)}_${
            randomInt(100, 999)
          }_${timestamp}`,
          email: `user${i}_${timestamp}@example.com`,
        }).returning({ id: users.id });
        userIds.push(user.id);
      }

      // Create SCADs
      for (let i = 0; i < count; i++) {
        const scadContent = randomChoice(sampleScadCode);
        const title = randomChoice(sampleTitles);
        const description = randomChoice(sampleDescriptions);
        let glbUrl = null;

        // Generate and upload GLB file
        try {
          console.log(`Generating GLB for SCAD ${i + 1}/${count}: ${title}...`);
          glbUrl = await generateAndUploadGlb(scadContent);
          console.log(`Successfully generated GLB for ${title}: ${glbUrl}`);
        } catch (error) {
          console.error(
            `Failed to generate GLB for SCAD ${i + 1} (${title}):`,
            error.message,
          );
          // Continue without GLB URL - let it be null
        }

        const [scad] = await db.insert(scads).values({
          title: `${title} #${i + 1}`, // Add index to ensure uniqueness
          description: description,
          content: scadContent,
          userId: randomChoice(userIds),
          tags: JSON.stringify([
            randomChoice([
              "mechanical",
              "household",
              "electronics",
              "decorative",
              "tools",
            ]),
            randomChoice(["beginner", "intermediate", "advanced"]),
            randomChoice(["printable", "parametric", "functional"]),
          ]),
          downloadCount: randomInt(0, 500),
          fileSize: randomInt(1024, 50000),
          glbUrl: glbUrl,
          isPublic: Math.random() > 0.1, // 90% public
        }).returning({ id: scads.id });

        // Add 1-3 photos per SCAD
        const photoCount = randomInt(1, 3);
        for (let j = 0; j < photoCount; j++) {
          await db.insert(scadPhotos).values({
            scadId: scad.id,
            url: `${
              randomChoice(samplePhotoUrls)
            }&seed=${Date.now()}_${i}_${j}`,
            description: `Photo ${j + 1} of ${randomChoice(sampleTitles)}`,
            order: j,
          });
        }

        // Add some random ratings
        const ratingCount = randomInt(0, userIds.length);
        const ratedUsers = [...userIds].sort(() => 0.5 - Math.random()).slice(
          0,
          ratingCount,
        );

        for (const userId of ratedUsers) {
          await db.insert(scadRatings).values({
            scadId: scad.id,
            userId: userId,
            rating: Math.random() > 0.3 ? 1 : -1, // 70% positive ratings
          });
        }
      }

      return { success: true, message: `Successfully seeded ${count} SCADs!` };
    } catch (error) {
      console.error("Seeding error:", error);
      return fail(500, { error: "Failed to seed database" });
    }
  },

  testFirebase: async () => {
    try {
      // Test Firebase connection by attempting to generate a small GLB
      const testScadCode = `cube([10, 10, 10]);`;

      console.log("Testing Firebase Storage connection...");
      const glbUrl = await generateAndUploadGlb(testScadCode);

      return {
        success: true,
        message: "Firebase Storage connection successful",
        response: glbUrl
          ? `GLB uploaded to: ${glbUrl}`
          : "GLB generated but no URL returned",
      };
    } catch (error) {
      return fail(500, {
        error: `Firebase Storage test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  },

};
