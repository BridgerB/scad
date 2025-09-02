import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { id } = params;

  if (!id) {
    throw error(400, "GLB ID is required");
  }

  try {
    // Construct the Firebase Storage URL
    const firebaseUrl =
      `https://storage.googleapis.com/scad-bridgerb-com.firebasestorage.app/scads/${id}.glb`;

    // Fetch the GLB file from Firebase Storage
    const response = await fetch(firebaseUrl);

    if (!response.ok) {
      throw error(404, "GLB file not found");
    }

    // Get the GLB data
    const glbData = await response.arrayBuffer();

    // Return the GLB file with proper headers
    return new Response(glbData, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000", // 1 year cache
      },
    });
  } catch (err) {
    console.error("Error proxying GLB file:", err);
    throw error(500, "Failed to fetch GLB file");
  }
};
