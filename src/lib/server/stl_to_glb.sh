#!/bin/bash

# Check if an input file is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <input.stl>"
    echo "Example: $0 /home/bridger/git/scad/static/models/spiral.stl"
    exit 1
fi

# Input STL file
INPUT_FILE="$1"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' does not exist."
    exit 1
fi

# Check if input file has .stl extension
if [[ ! "$INPUT_FILE" =~ \.stl$ ]]; then
    echo "Error: Input file '$INPUT_FILE' must have a .stl extension."
    exit 1
fi

# Derive output GLB file by replacing .stl with .glb
OUTPUT_FILE="${INPUT_FILE%.stl}.glb"

# Ensure Blender is available
if ! command -v blender >/dev/null 2>&1; then
    echo "Error: Blender is not installed or not in PATH. Please install Blender or add it to PATH."
    exit 1
fi

# Python script for Blender to convert STL to GLB
PYTHON_SCRIPT="
import bpy
import os

# Clear the scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import STL
bpy.ops.wm.stl_import(filepath='$INPUT_FILE')

# Export to GLB
bpy.ops.export_scene.gltf(filepath='$OUTPUT_FILE', export_format='GLB')
"

# Run Blender in background mode with the Python script
echo "Converting '$INPUT_FILE' to '$OUTPUT_FILE'..."
blender -b -P <(echo "$PYTHON_SCRIPT") --debug

# Check if the output file was created
if [ -f "$OUTPUT_FILE" ]; then
    echo "Successfully created '$OUTPUT_FILE'"
else
    echo "Error: Failed to create '$OUTPUT_FILE'. Check Blender output for errors."
    exit 1
fi