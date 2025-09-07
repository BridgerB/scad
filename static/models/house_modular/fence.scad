// fence.scad - Wood Fence Module
include <config.scad>

// ========================================
// FENCE MODULE
// ========================================
module wood_fence(
    main_fence_x = 18000,
    main_fence_y = 10500, 
    main_fence_width = 5000,
    connector_fence_x = 17800,
    connector_fence_y = 9500,
    connector_fence_height = 1000,
    thickness = fence_thickness,
    height = fence_height,
    color_override = fence_color
) {
    color(color_override) {
        // Main fence across back of sidewalk
        translate([main_fence_x, main_fence_y, 0])
        cube([main_fence_width, thickness, height]);
        
        // Short fence connecting to house
        translate([connector_fence_x, connector_fence_y, 0])
        cube([thickness, connector_fence_height, height]);
    }
}