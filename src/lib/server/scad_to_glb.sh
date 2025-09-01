#!/bin/bash

# Check if an input file is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <input.scad>"
    echo "Example: $0 /home/bridger/git/scad/static/models/house/house.scad"
    exit 1
fi

# Input SCAD file
INPUT_FILE="$1"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' does not exist."
    exit 1
fi

# Check if input file has .scad extension
if [[ ! "$INPUT_FILE" =~ \.scad$ ]]; then
    echo "Error: Input file '$INPUT_FILE' must have a .scad extension."
    exit 1
fi

# Derive output GLB file by replacing .scad with .glb
OUTPUT_FILE="${INPUT_FILE%.scad}.glb"

# Derive temporary OBJ file path
TEMP_OBJ_FILE="${INPUT_FILE%.scad}.obj"

# Ensure OpenSCAD is available
if ! command -v openscad >/dev/null 2>&1; then
    echo "Error: OpenSCAD is not installed or not in PATH. Please install OpenSCAD or add it to PATH."
    exit 1
fi

# Ensure Blender is available
if ! command -v blender >/dev/null 2>&1; then
    echo "Error: Blender is not installed or not in PATH. Please install Blender or add it to PATH."
    exit 1
fi

# Step 1: Convert SCAD to OBJ using OpenSCAD
echo "Converting '$INPUT_FILE' to temporary OBJ '$TEMP_OBJ_FILE'..."
openscad -o "$TEMP_OBJ_FILE" "$INPUT_FILE"

# Check if OBJ file was created
if [ ! -f "$TEMP_OBJ_FILE" ]; then
    echo "Error: Failed to create '$TEMP_OBJ_FILE'. Check OpenSCAD output for errors."
    exit 1
fi

# Python script for Blender to convert OBJ to GLB
PYTHON_SCRIPT="
import bpy
import os

# Clear the scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import OBJ
bpy.ops.wm.obj_import(filepath='$TEMP_OBJ_FILE')

# Select all objects
bpy.ops.object.select_all(action='SELECT')

# Repair non-manifold geometry
for obj in bpy.context.selected_objects:
    if obj.type == 'MESH':
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.remove_doubles(threshold=0.0001)
        bpy.ops.mesh.normals_make_consistent()
        bpy.ops.object.mode_set(mode='OBJECT')

# Ensure materials are applied
for obj in bpy.context.selected_objects:
    if obj.type == 'MESH':
        if not obj.data.materials:
            # Create a default material if none exists
            mat = bpy.data.materials.new(name='DefaultMaterial')
            mat.use_nodes = True
            principled = mat.node_tree.nodes.get('Principled BSDF')
            if principled:
                principled.inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1.0)  # Default gray
            obj.data.materials.append(mat)

# Export to GLB with material settings
bpy.ops.export_scene.gltf(
    filepath='$OUTPUT_FILE',
    export_format='GLB',
    export_materials='EXPORT'
)

# Clean up temporary OBJ and MTL files
os.remove('$TEMP_OBJ_FILE')
mtl_file = '${TEMP_OBJ_FILE%.obj}.mtl'
if os.path.exists(mtl_file):
    os.remove(mtl_file)
"

# Run Blender in background mode with the Python script
echo "Converting '$TEMP_OBJ_FILE' to '$OUTPUT_FILE'..."
blender -b -P <(echo "$PYTHON_SCRIPT") --debug

# Check if the output file was created
if [ -f "$OUTPUT_FILE" ]; then
    echo "Successfully created '$OUTPUT_FILE'"
else
    echo "Error: Failed to create '$OUTPUT_FILE'. Check Blender output for errors."
    exit 1
fi