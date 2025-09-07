// house_structure.scad - Main House Structure Modules
include <config.scad>
include <windows.scad>
include <doors.scad>

// ========================================
// BASEMENT SECTION
// ========================================
module basement_section() {
    color(basement_color)
    difference() {
        translate([left_section_x, 0, -basement_height])
        cube([section_width, house_depth, basement_height]);
        
        basement_windows();
    }
}

// ========================================
// LEFT SECTION (MASTER BEDROOM)
// ========================================
module left_section_structure() {
    difference() {
        union() {
            // Ground floor - lower portion (stays in place) - living room color
            color(living_room_color)
            translate([left_section_x, 0, 0])
            cube([section_width, house_depth, house_height/2]);
            
            // Ground floor - upper portion (extends 1m forward) - master bedroom color
            color(master_bedroom_color)
            translate([left_section_x, -master_bedroom_overhang, house_height/2])
            cube([section_width, house_depth + master_bedroom_overhang, house_height/2]);
            
            // Second floor (master bedroom extends 1m forward) - master bedroom color
            color(master_bedroom_color)
            translate([left_section_x, -master_bedroom_overhang, house_height])
            cube([section_width, house_depth + master_bedroom_overhang, second_floor_height]);
        }
        
        master_bedroom_window_openings();
    }
}

// ========================================
// MIDDLE SECTION (LIVING ROOM/KITCHEN)
// ========================================
module middle_section_structure() {
    color(living_room_color)
    difference() {
        translate([middle_section_x, 0, 0])
        cube([section_width, house_depth, house_height]);
        
        // All door openings for middle section
        all_door_openings();
        
        // Ground floor window openings
        ground_floor_window_openings();
    }
}

// ========================================
// GARAGE SECTION
// ========================================
module garage_section() {
    color(garage_color)
    translate([garage_section_x, 0, 0])
    difference() {
        cube([section_width, house_depth, house_height]);
        
        // Garage door opening handled in doors.scad
        // Back door opening handled in doors.scad
    }
}

// ========================================
// ROOF SYSTEM
// ========================================
module roof_system() {
    // Left roof - front to back (peaked) for master bedroom section
    color(roof_color)
    translate([left_section_x, house_depth, house_height + second_floor_height])
    rotate([90, 0, 0])
    linear_extrude(height = house_depth + master_bedroom_overhang)
    polygon([[0, 0], [section_width, 0], [section_width/2, 1200]]);
    
    // Main roof - left to right (peaked, covers middle and garage)
    color(main_roof_color)
    translate([middle_section_x, 0, house_height])
    rotate([90, 0, 90])
    linear_extrude(height = section_width * 2)
    polygon([[0, 0], [house_depth, 0], [house_depth/2, 1500]]);
}

// ========================================
// COMPLETE HOUSE ASSEMBLY
// ========================================
module complete_house() {
    basement_section();
    left_section_structure();
    middle_section_structure();
    garage_section();
    roof_system();
    
    // All window panes
    basement_window_panes();
    master_bedroom_window_panes();
    ground_floor_window_panes();
    
    // All door panes
    all_door_panes();
}