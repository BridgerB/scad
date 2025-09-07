// main.scad - Main Assembly File
// ========================================
// IMPORT ALL MODULES
// ========================================
include <config.scad>
include <house_structure.scad>
include <landscaping.scad>
include <fence.scad>

// ========================================
// MAIN ASSEMBLY
// ========================================

// Landscaping (rendered first, at ground level)
lawn_areas();
concrete_areas();
garden_area();

// Fence system
wood_fence();

// Main house structure (with origin offset)
translate([house_origin_x, 0, 0])
complete_house();