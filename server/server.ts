#!/usr/bin/env tsx

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { readFileSync, statSync, unlinkSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// Import the conversion utilities from openscad-playground project
import { parseOff } from "/home/ubuntu/git/openscad-playground/src/io/import_off.ts";
import { exportGlb } from "/home/ubuntu/git/openscad-playground/src/io/export_glb.ts";

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("ERROR: API_KEY environment variable is required");
  console.error(
    "Please create a .env file or set the API_KEY environment variable",
  );
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API key authentication middleware
function authenticateApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const providedKey = req.headers["x-api-key"];

  if (!providedKey) {
    return res.status(401).json({
      error: "API key required in x-api-key header",
    });
  }

  if (providedKey !== API_KEY) {
    return res.status(403).json({
      error: "Invalid API key",
    });
  }

  next();
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "openscad-converter",
  });
});

// SCAD to GLB conversion endpoint
app.post("/api/convert-scad", authenticateApiKey, async (req, res) => {
  let tempScadPath: string | null = null;
  let tempOffPath: string | null = null;

  try {
    console.log("\n=== API: SCAD to GLB Conversion Started ===");
    console.log(`Request from: ${req.ip}`);
    console.log(`User-Agent: ${req.headers["user-agent"]}`);

    // Extract SCAD content from request
    const { scadContent } = req.body;

    if (!scadContent || typeof scadContent !== "string") {
      return res.status(400).json({
        error: "scadContent is required and must be a string",
      });
    }

    console.log(`SCAD content length: ${scadContent.length} characters`);
    console.log(`SCAD content preview (first 200 chars):`);
    console.log(
      `"${scadContent.substring(0, 200)}${
        scadContent.length > 200 ? "..." : ""
      }"`,
    );

    // Generate unique temporary file paths
    const tempId = Date.now().toString() +
      Math.random().toString(36).substring(2);
    tempScadPath = `/tmp/api-${tempId}.scad`;
    tempOffPath = `/tmp/api-${tempId}.off`;

    console.log(`Temp SCAD path: ${tempScadPath}`);
    console.log(`Temp OFF path: ${tempOffPath}`);

    // Write SCAD content to temporary file
    writeFileSync(tempScadPath, scadContent, "utf-8");
    console.log("Written SCAD content to temporary file");

    // Step 1: Generate OFF file with colors using OpenSCAD
    console.log("\n--- Step 1: Generating OFF file with OpenSCAD ---");
    const openscadCommand = `openscad -o ${tempOffPath} ${tempScadPath}`;
    console.log(`OpenSCAD command: ${openscadCommand}`);

    try {
      const result = execSync(openscadCommand, {
        stdio: "pipe",
        encoding: "utf8",
        timeout: 30000, // 30 second timeout
      });

      console.log(`Generated colored OFF file: ${tempOffPath}`);
      if (result) console.log("OpenSCAD output:", result);

      // Check if OFF file was created
      const offStats = statSync(tempOffPath);
      console.log(`OFF file size: ${offStats.size} bytes`);
    } catch (error: any) {
      console.error("Failed to generate OFF file:", error);
      throw new Error(
        `OpenSCAD compilation failed: ${
          error.stderr || error.stdout || error.message || "Unknown error"
        }`,
      );
    }

    // Step 2: Parse the OFF file
    console.log("\n--- Step 2: Parsing OFF file ---");
    const offContent = readFileSync(tempOffPath, "utf-8");
    console.log(`OFF file content length: ${offContent.length} characters`);
    console.log(`OFF file preview (first 300 chars):`);
    console.log(
      `"${offContent.substring(0, 300)}${
        offContent.length > 300 ? "..." : ""
      }"`,
    );

    const polyhedron = parseOff(offContent);

    console.log(
      `Parsed OFF: ${polyhedron.vertices.length} vertices, ${polyhedron.faces.length} faces, ${polyhedron.colors.length} colors`,
    );

    // Log sample vertices and colors if available
    if (polyhedron.vertices.length > 0) {
      console.log(
        `First vertex: (${polyhedron.vertices[0].x}, ${
          polyhedron.vertices[0].y
        }, ${polyhedron.vertices[0].z})`,
      );
    }
    if (polyhedron.colors.length > 0) {
      console.log(
        `First color: r=${polyhedron.colors[0].r}, g=${
          polyhedron.colors[0].g
        }, b=${polyhedron.colors[0].b}`,
      );
    }

    // Step 3: Apply coordinate system transformation
    console.log("\n--- Step 3: Applying coordinate system transformation ---");
    console.log("Transform: (x, y, z) → (x, z, -y)");

    const transformedPolyhedron = {
      vertices: polyhedron.vertices.map((vertex) => ({
        x: vertex.x, // X stays the same
        y: vertex.z, // Y = Z
        z: -vertex.y, // Z = -Y
      })),
      faces: polyhedron.faces,
      colors: polyhedron.colors,
    };

    // Log sample transformed vertex
    if (transformedPolyhedron.vertices.length > 0) {
      console.log(
        `First transformed vertex: (${transformedPolyhedron.vertices[0].x}, ${
          transformedPolyhedron.vertices[0].y
        }, ${transformedPolyhedron.vertices[0].z})`,
      );
    }

    // Step 4: Convert to GLB
    console.log("\n--- Step 4: Converting to GLB format ---");
    const glbBlob = await exportGlb(transformedPolyhedron);
    const glbBuffer = Buffer.from(await glbBlob.arrayBuffer());

    console.log(`GLB blob size: ${glbBlob.size} bytes`);
    console.log(`GLB buffer size: ${glbBuffer.length} bytes`);

    console.log("=== API: SCAD to GLB Conversion Complete ===\n");

    // Return GLB as base64 encoded data
    const base64Glb = glbBuffer.toString("base64");

    res.json({
      success: true,
      glbData: base64Glb,
      metadata: {
        vertices: transformedPolyhedron.vertices.length,
        faces: transformedPolyhedron.faces.length,
        colors: transformedPolyhedron.colors.length,
        glbSize: glbBuffer.length,
        scadLength: scadContent.length,
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({
      error: `Conversion failed: ${error.message || "Unknown error"}`,
      timestamp: new Date().toISOString(),
    });
  } finally {
    // Clean up temporary files
    try {
      if (tempScadPath) {
        unlinkSync(tempScadPath);
        console.log("Cleaned up temp SCAD file");
      }
    } catch (cleanupError) {
      console.warn("Could not clean up temp SCAD file:", tempScadPath);
    }

    try {
      if (tempOffPath) {
        unlinkSync(tempOffPath);
        console.log("Cleaned up temp OFF file");
      }
    } catch (cleanupError) {
      console.warn("Could not clean up temp OFF file:", tempOffPath);
    }
  }
});

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  },
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    available: [
      "GET /health",
      "POST /api/convert-scad (requires x-api-key header)",
    ],
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`OpenSCAD Conversion API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(
    `Convert endpoint: POST http://localhost:${PORT}/api/convert-scad`,
  );
  console.log(`Required header: x-api-key: ${API_KEY}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
});
