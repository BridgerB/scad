import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scads = pgTable("scads", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  tags: text("tags"),
  downloadCount: integer("download_count").default(0),
  fileSize: integer("file_size"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const scadPhotos = pgTable("scad_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  scadId: uuid("scad_id").references(() => scads.id).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scadRatings = pgTable("scad_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  scadId: uuid("scad_id").references(() => scads.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1 for like, -1 for dislike
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
