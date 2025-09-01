#!/usr/bin/env tsx

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Import the conversion utilities from openscad-playground project
import { parseOff } from '/home/bridger/git/openscad-playground/src/io/import_off.ts';
import { exportGlb } from '/home/bridger/git/openscad-playground/src/io/export_glb.ts';

async function convertScadToGlbWithColor() {
    const scadPath = '/home/bridger/git/openscad/src/house/house.scad';
    const tempOffPath = '/tmp/house-color.off';
    const outputGlbPath = '/home/bridger/git/scad/static/models/house/house.glb';
    
    console.log(`Converting SCAD with colors: ${scadPath}`);
    
    // Step 1: Generate OFF file with colors using OpenSCAD with Manifold backend
    console.log('Generating OFF file with colors using OpenSCAD...');
    try {
        execSync(`openscad --backend=manifold -o ${tempOffPath} ${scadPath}`, {
            stdio: 'inherit'
        });
        console.log(`Generated colored OFF file: ${tempOffPath}`);
    } catch (error) {
        console.error('Failed to generate OFF file:', error);
        process.exit(1);
    }
    
    // Step 2: Parse the OFF file
    console.log('Parsing OFF file...');
    const offContent = readFileSync(tempOffPath, 'utf-8');
    const polyhedron = parseOff(offContent);
    
    console.log(`Parsed OFF: ${polyhedron.vertices.length} vertices, ${polyhedron.faces.length} faces, ${polyhedron.colors.length} colors`);
    
    // Step 3: Convert to GLB
    console.log('Converting to GLB format...');
    const glbBlob = await exportGlb(polyhedron);
    const glbBuffer = Buffer.from(await glbBlob.arrayBuffer());
    
    // Step 4: Ensure output directory exists and write GLB file
    mkdirSync(dirname(outputGlbPath), { recursive: true });
    writeFileSync(outputGlbPath, glbBuffer);
    
    console.log(`Successfully converted to ${outputGlbPath} (${glbBuffer.length} bytes)`);
    
    // Clean up temporary file
    try {
        execSync(`rm ${tempOffPath}`);
    } catch (error) {
        console.warn('Could not clean up temp file:', tempOffPath);
    }
}

// Run the conversion if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await convertScadToGlbWithColor();
}

export { convertScadToGlbWithColor };