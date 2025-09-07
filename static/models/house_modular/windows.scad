// windows.scad - Window Modules
include <config.scad>
include <utilities.scad>

// ========================================
// BASEMENT WINDOWS
// ========================================
module basement_windows() {
    // Front window openings
    for (x = basement_window_x_positions) {
        create_window_opening(x, -100, -100, window_width, window_depth, basement_window_height);
    }
    // Back window openings (straight across from front)
    for (x = basement_window_x_positions) {
        create_window_opening(x, house_depth - 100, -100, window_width, window_depth, basement_window_height);
    }
}

module basement_window_panes() {
    // Front window panes
    for (x = basement_window_x_positions) {
        create_window_pane(x, -50, -100, window_width, window_pane_depth, basement_window_height, window_color);
    }
    // Back window panes (straight across from front)
    for (x = basement_window_x_positions) {
        create_window_pane(x, house_depth - 50, -100, window_width, window_pane_depth, basement_window_height, window_color);
    }
}

// ========================================
// MASTER BEDROOM WINDOWS
// ========================================
module master_bedroom_window_openings() {
    // Front windows (master bedroom)
    for (x = master_bedroom_front_window_x_positions) {
        create_window_opening(x, -1100, house_height + 100, window_width, window_depth, master_bedroom_window_height);
    }
    // Back windows (bedrooms across the hall) - wider
    for (x = master_bedroom_back_window_x_positions) {
        create_window_opening(x, house_depth - 100, house_height + 100, back_bedroom_window_width, window_depth, master_bedroom_window_height);
    }
}

module master_bedroom_window_panes() {
    // Front windows (master bedroom)
    for (x = master_bedroom_front_window_x_positions) {
        create_window_pane(x, -1050, house_height + 100, window_width, window_pane_depth, master_bedroom_window_height, window_color);
    }
    // Back windows (bedrooms across the hall) - wider
    for (x = master_bedroom_back_window_x_positions) {
        create_window_pane(x, house_depth - 50, house_height + 100, back_bedroom_window_width, window_pane_depth, master_bedroom_window_height, window_color);
    }
}

// ========================================
// GROUND FLOOR WINDOWS
// ========================================
module ground_floor_window_openings() {
    // Living room window opening (front)
    create_window_opening(1500, -100, 1500, living_room_window_width, window_depth, living_room_window_height);
    
    // Kitchen window opening (back - moved 1m east)
    create_window_opening(3500, house_depth - 100, 1200, kitchen_window_width, window_depth, kitchen_window_height);
}

module ground_floor_window_panes() {
    // Living room window (front)
    create_window_pane(1500, -50, 1500, living_room_window_width, window_pane_depth, living_room_window_height, window_color);
    
    // Kitchen window (back - moved 1m east)
    create_window_pane(3500, house_depth - 50, 1200, kitchen_window_width, window_pane_depth, kitchen_window_height, window_color);
}