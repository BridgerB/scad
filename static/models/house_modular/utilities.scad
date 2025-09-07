// utilities.scad - Reusable Utility Modules
include <config.scad>

// ========================================
// BASIC UTILITY MODULES
// ========================================

module create_window_opening(x, y, z, w, d, h) {
    translate([x, y, z])
    cube([w, d, h]);
}

module create_window_pane(x, y, z, w, d, h, color_override = window_color) {
    color(color_override)
    translate([x, y, z])
    cube([w, d, h]);
}

module create_door_opening(x, y, z, w, d, h) {
    translate([x, y, z])
    cube([w, d, h]);
}

module create_door_pane(x, y, z, w, d, h, color_override = door_color) {
    color(color_override)
    translate([x, y, z])
    cube([w, d, h]);
}