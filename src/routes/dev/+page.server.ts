import { db } from "$lib/server/db";
import { scadPhotos, scadRatings, scads, users } from "$lib/server/db/schema";
import { redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

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
module gear(teeth=20, module=2, height=5) {
    linear_extrude(height)
    circle(r=teeth*module/2, $fn=teeth*4);
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

  `// Phone Stand
angle = 60;
width = 80;
depth = 60;
height = 40;

difference() {
    hull() {
        cube([width, 10, height]);
        translate([0, depth-10, 0])
            cube([width, 10, 20]);
    }
    translate([10, 5, 10])
        cube([width-20, depth, height]);
}`,

  `// Customizable Keychain
text_string = "OpenSCAD";
text_size = 8;
thickness = 3;

linear_extrude(thickness)
text(text_string, size=text_size, font="Arial:style=Bold", halign="center");

translate([0, -15, 0])
difference() {
    cylinder(r=5, h=thickness);
    cylinder(r=2, h=thickness*2, center=true);
}`,
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

export const actions: Actions = {
  seed: async ({ request }) => {
    const data = await request.formData();
    const count = parseInt(data.get("count") as string) || 10;

    try {
      // Create some sample users first
      const userIds = [];
      for (let i = 0; i < Math.min(5, count); i++) {
        const [user] = await db.insert(users).values({
          username: `${randomChoice(sampleUsernames)}_${randomInt(100, 999)}`,
          email: `user${i}@example.com`,
        }).returning({ id: users.id });
        userIds.push(user.id);
      }

      // Create SCADs
      for (let i = 0; i < count; i++) {
        const [scad] = await db.insert(scads).values({
          title: randomChoice(sampleTitles),
          description: randomChoice(sampleDescriptions),
          content: randomChoice(sampleScadCode),
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
      return { success: false, message: "Failed to seed database" };
    }
  },
};
