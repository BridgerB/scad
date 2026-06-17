// Helpers for multi-file SCAD projects: parse/validate a project from a form,
// load a project's files (with single-file back-compat), and persist them.
import { db } from "./db";
import { scadFiles } from "./db/schema";
import { asc, eq } from "drizzle-orm";
import { sanitizeProjectPath, type ScadFile } from "./openscad/convert";

export type Project = { files: ScadFile[]; entryPath: string };

const MAX_TOTAL_BYTES = 1_000_000; // 1 MB across all files
const MAX_FILES = 50;

/**
 * Validate a project payload (from the editor's hidden JSON field).
 * Throws Error(message) on any problem.
 */
export function validateProject(raw: unknown): Project {
  if (!raw || typeof raw !== "object") throw new Error("Invalid project data");
  const { files, entryPath } = raw as { files?: unknown; entryPath?: unknown };
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("Project must have at least one file");
  }
  if (files.length > MAX_FILES) {
    throw new Error(`Too many files (max ${MAX_FILES})`);
  }
  const seen = new Set<string>();
  let total = 0;
  const cleaned: ScadFile[] = files.map((f) => {
    const file = f as { path?: unknown; content?: unknown };
    if (typeof file.path !== "string" || typeof file.content !== "string") {
      throw new Error("Each file needs a path and content");
    }
    const path = sanitizeProjectPath(file.path);
    if (seen.has(path)) throw new Error(`Duplicate file path: ${path}`);
    seen.add(path);
    total += file.content.length;
    return { path, content: file.content };
  });
  if (total > MAX_TOTAL_BYTES) {
    throw new Error("Project is too large (max 1 MB total)");
  }
  const entry = sanitizeProjectPath(
    typeof entryPath === "string" && entryPath ? entryPath : cleaned[0].path,
  );
  if (!cleaned.some((f) => f.path === entry)) {
    throw new Error(`Entry file "${entry}" is not in the project`);
  }
  return { files: cleaned, entryPath: entry };
}

/** Parse a project from a form field; falls back to a single-file `content`. */
export function projectFromForm(data: FormData): Project {
  const projectJson = data.get("project");
  if (typeof projectJson === "string" && projectJson.trim()) {
    return validateProject(JSON.parse(projectJson));
  }
  // Legacy single-file form.
  const content = (data.get("content") as string) ?? "";
  return { files: [{ path: "main.scad", content }], entryPath: "main.scad" };
}

/**
 * Load a scad's project files. If no scad_files rows exist (legacy single-file
 * record), synthesize a one-file project from the provided fallback content.
 */
export async function loadProject(
  scadId: string,
  fallbackContent: string,
): Promise<Project> {
  const rows = await db
    .select({
      path: scadFiles.path,
      content: scadFiles.content,
      isEntry: scadFiles.isEntry,
    })
    .from(scadFiles)
    .where(eq(scadFiles.scadId, scadId))
    .orderBy(asc(scadFiles.order), asc(scadFiles.path));

  if (rows.length === 0) {
    return {
      files: [{ path: "main.scad", content: fallbackContent ?? "" }],
      entryPath: "main.scad",
    };
  }
  const entry = rows.find((r) => r.isEntry)?.path ?? rows[0].path;
  return {
    files: rows.map((r) => ({ path: r.path, content: r.content })),
    entryPath: entry,
  };
}

/** Replace all of a scad's files with the given project (delete + insert). */
export async function saveProjectFiles(
  scadId: string,
  project: Project,
): Promise<void> {
  await db.delete(scadFiles).where(eq(scadFiles.scadId, scadId));
  await db.insert(scadFiles).values(
    project.files.map((f, i) => ({
      scadId,
      path: f.path,
      content: f.content,
      isEntry: f.path === project.entryPath,
      order: i,
    })),
  );
}

/** The content of the entry file, for the legacy scads.content column. */
export function entryContent(project: Project): string {
  return project.files.find((f) => f.path === project.entryPath)?.content ?? "";
}
