# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## OpenSCAD Reference

---
> **🔗 REQUIRED READING**: You MUST visit and read the [OpenSCAD Cheatsheet](https://raw.githubusercontent.com/openscad/openscad.github.com/refs/heads/main/cheatsheet/index.html) to understand the complete OpenSCAD syntax.

This comprehensive reference contains all OpenSCAD commands, functions, and syntax patterns that users will be writing in the CodeMirror editor:

### Cheatsheet Covers:
- **3D Primitives**: `sphere()`, `cube()`, `cylinder()`, `polyhedron()`
- **2D Shapes**: `circle()`, `square()`, `polygon()`
- **Transformations**: `translate()`, `rotate()`, `scale()`, `mirror()`
- **Boolean Operations**: `union()`, `difference()`, `intersection()` (CSG modeling foundation)
- **Advanced Features**: List comprehensions with `for` loops, conditional statements
- **Mathematical Functions**: `sin`, `cos`, `sqrt`, `abs`
- **String Manipulation**: `str`, `chr`, `ord`
- **Special Variables**: `$fn` for controlling mesh resolution
- **Modifier Characters**:
  - `*` disable
  - `!` show only
  - `#` highlight
  - `%` transparent
- **Extrusion Operations**: `linear_extrude`, `rotate_extrude`
- **File Import**: STL, OFF, AMF, 3MF format support

Users can leverage this reference when creating parametric models, debugging geometry issues, or understanding syntax errors in their OpenSCAD code within the platform's real-time preview system.
---

## Project Overview

This is **OpenSCAD Files** - a full-stack 3D model sharing platform built with
SvelteKit that allows users to create, share, and view OpenSCAD 3D models with
real-time preview capabilities.

## Development Commands

### Database Management

```bash
npm run db:start     # Start PostgreSQL via Docker Compose
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate migration files
npm run db:migrate   # Run database migrations  
npm run db:studio    # Open Drizzle Studio for database management
```

### Development & Build

```bash
npm run dev          # Start development server with hot reload
npm run check        # TypeScript type checking across codebase
npm run build        # Create production build
npm run preview      # Preview production build locally
```

## Core Architecture

### 3D Model Processing Pipeline

This is the **most critical and complex** part of the system:

1. **SCAD Input**: Users write OpenSCAD code in CodeMirror editor with syntax
   highlighting
2. **Real-time Conversion**: Debounced (100ms) conversion from SCAD → OFF → GLB
3. **OpenSCAD CLI**: Called with `--backend=manifold` for color support,
   generates `.off` files
4. **Coordinate Transform**: Converts OpenSCAD Z-up to GLB Y-up:
   `(x, y, z) → (x, z, -y)`
5. **GLB Generation**: Uses utilities from external `openscad-playground`
   project
6. **Dual Storage**: Local files for preview, Firebase Storage for permanent
   sharing

### External Dependencies

> **⚠️ Critical**: The project has a hard dependency on
> `/home/bridger/git/openscad-playground/` for:
>
> - `parseOff` function from `src/io/import_off.ts`
> - `exportGlb` function from `src/io/export_glb.ts`
>
> These are imported directly in `src/lib/server/convert-scad-with-color.ts` and
> must be available locally.

### Database Schema (Drizzle ORM)

| Table              | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| **`users`**        | UUID primary keys, username/email storage                            |
| **`scads`**        | Core model storage with OpenSCAD source, metadata, Firebase GLB URLs |
| **`scad_ratings`** | Like/dislike system (-1, 1)                                          |
| **`scad_photos`**  | Photo attachments (schema ready, not used in UI)                     |

**Relationships**: `scads.userId → users.id`, ratings/photos reference scads.

### Route Architecture

| Route               | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| **`/`**             | Home page with searchable grid, pagination (25 items), complex queries with joins |
| **`/create`**       | Creation form with live preview using temporary GLB generation                    |
| **`/[scad]`**       | Dual-pane editor with CodeMirror + 3D viewer, live updates                        |
| **`/api/glb/[id]`** | Firebase Storage proxy with proper CORS/cache headers                             |

### Server Actions

Each route handles form submissions via SvelteKit server actions:

| Action              | Purpose                             |
| ------------------- | ----------------------------------- |
| `create/preview`    | Temporary GLB for real-time editing |
| `create/create`     | Save to database + Firebase upload  |
| `[scad]/updateScad` | Live preview during editing         |
| `[scad]/saveScad`   | Permanent save with Firebase sync   |

### Dual Model Strategy

| Storage Type           | Location                                | Purpose             |
| ---------------------- | --------------------------------------- | ------------------- |
| **Local GLB Files**    | `/static/models/previews/`              | Real-time editing   |
| **Firebase GLB Files** | `scad-bridgerb-com.firebasestorage.app` | Permanent storage   |
| **Fallback Chain**     | Firebase → local → error state          | Automatic switching |

**Implementation**: Model viewer src uses conditional logic:

```javascript
useFirebaseModel ? getGlbProxyUrl() : /models/previews/${id}.glb
```

## Technology Stack

| Layer             | Technologies                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Frontend**      | SvelteKit 5 + TypeScript, CodeMirror 6 with C++ syntax (for OpenSCAD), Google Model Viewer |
| **Database**      | PostgreSQL + Drizzle ORM with type-safe operations                                         |
| **3D Processing** | OpenSCAD CLI + custom conversion utilities                                                 |
| **Storage**       | Firebase Admin SDK for server-side operations                                              |
| **Development**   | Docker Compose for PostgreSQL, Vite for bundling                                           |

## Configuration Requirements

| Component         | Requirement                                                      |
| ----------------- | ---------------------------------------------------------------- |
| **Environment**   | `.env` must contain `DATABASE_URL` for PostgreSQL connection     |
| **Firebase**      | Service account key in `/src/lib/server/firebase-admin-key.json` |
| **OpenSCAD**      | Must be installed and available in system PATH                   |
| **External Code** | `openscad-playground` project must be available locally          |

## Development Patterns

### Real-time 3D Preview

- Debounced updates prevent excessive OpenSCAD CLI calls
- Status overlays during processing with proper error states
- Cache busting via timestamps: `?t=${Date.now()}`
- Coordinate system transformations for proper GLB orientation

### Type-Safe Database Operations

- Schema-first approach with Drizzle generates TypeScript types
- Complex queries use proper joins and aggregations
- Search functionality across title/description/tags using `ilike`

### File Processing

- Temporary files in `/tmp/` with UUID identifiers
- Proper cleanup after processing to prevent disk bloat
- Error handling for OpenSCAD compilation failures

When working on this codebase, always consider the 3D processing pipeline as the
core feature - changes to model generation, storage, or display require
understanding the full SCAD→GLB→Firebase→Display flow.
