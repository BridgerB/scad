import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// In-memory GLB conversion function
async function convertScadToGlbViaApi(scadContent: string): Promise<Buffer> {
  const apiUrl = env.OPENSCAD_API_URL;
  const apiKey = env.OPENSCAD_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("OPENSCAD_API_URL and OPENSCAD_API_KEY environment variables are required");
  }

  console.log(`API GLB conversion for ${scadContent.length} characters of SCAD`);

  const response = await fetch(`${apiUrl}/api/convert-scad`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ scadContent }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const result = await response.json();
  
  if (!result.success || !result.glbData) {
    throw new Error(`API conversion failed: ${result.error || 'Unknown error'}`);
  }

  return Buffer.from(result.glbData, 'base64');
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { scadContent, scadId } = await request.json();

    if (!scadContent || !scadId) {
      return json({
        success: false,
        error: "No SCAD content or ID provided"
      }, { status: 400 });
    }

    // Convert SCAD to GLB in memory only (no file system operations)
    console.log(`Generating in-memory GLB preview for SCAD ${scadId}...`);
    const glbBuffer = await convertScadToGlbViaApi(scadContent);
    
    // Convert buffer to base64 for transport
    const glbBase64 = glbBuffer.toString('base64');
    
    console.log(`Successfully generated ${glbBuffer.length} byte GLB preview`);

    return json({
      success: true,
      message: "3D model preview updated",
      glbData: glbBase64,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error("Error updating SCAD preview:", error);
    return json({
      success: false,
      error: `Failed to update preview: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    }, { status: 500 });
  }
};