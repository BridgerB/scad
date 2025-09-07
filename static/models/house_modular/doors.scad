// doors.scad - Door Modules
include <config.scad>
include <utilities.scad>

// ========================================
// DOOR OPENINGS
// ========================================
module all_door_openings() {
    // Front door opening
    create_door_opening(200, -100, 0, door_width, door_depth, door_height);
    
    // Sliding door opening (back - straight across from front door)
    create_door_opening(200, house_depth - 100, 0, sliding_door_width, door_depth, door_height);
    
    // Garage door opening (front) - relative to garage section
    translate([garage_section_x, 0, 0])
    translate([200, -100, 0])
    cube([5600, 300, house_height - 200]);
    
    // Garage back door opening (against kitchen wall)
    create_door_opening(garage_section_x + 200, house_depth - 100, 0, door_width, door_depth, door_height);
}

// ========================================
// DOOR PANES
// ========================================
module all_door_panes() {
    // Front door
    create_door_pane(200, -50, 0, door_width, door_pane_depth, door_height, door_color);
    
    // Sliding door (back - glass panels)
    create_door_pane(200, house_depth - 50, 0, sliding_door_width, door_pane_depth, door_height, window_color);
    
    // Garage door (front)
    color(garage_door_color)
    translate([garage_section_x + 200, -50, 0])
    cube([5600, door_pane_depth, house_height - 200]);
    
    // Garage back door (against kitchen wall)
    create_door_pane(garage_section_x + 200, house_depth - 50, 0, door_width, door_pane_depth, door_height, door_color);
}