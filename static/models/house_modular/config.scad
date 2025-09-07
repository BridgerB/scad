// config.scad - Global Configuration & Constants
// ========================================
// GLOBAL SETTINGS
// ========================================
$fn = 50;

// ========================================
// HOUSE DIMENSIONS (FULL SIZE in mm)
// ========================================
house_width = 20000;  // 20 meters total
house_depth = 9500;   // 9.5 meters depth
house_height = 3000;  // Ground floor height
second_floor_height = 2800; // Second floor height
basement_height = 1500; // house_height/2

// Section widths (each 6 meters)
section_width = 6000;
left_section_x = -section_width;
middle_section_x = 0;
garage_section_x = section_width;

// Overhang configuration
master_bedroom_overhang = 1000; // 1 meter forward
overhang_start_height = house_height/2; // Upper half of ground floor + second floor

// House origin offset
house_origin_x = 6000;

// ========================================
// WINDOW DIMENSIONS
// ========================================
window_width = 1200;
window_depth = 300;
window_pane_depth = 100;
basement_window_height = 1000;
ground_floor_window_height = 1200;
master_bedroom_window_height = 1600;
back_bedroom_window_width = 1800; // Wider windows for back bedrooms
living_room_window_width = 3000;
living_room_window_height = 1200;
kitchen_window_width = 1500;
kitchen_window_height = 1000;

// Window positions (X coordinates relative to left section)
basement_window_x_positions = [-5400, -3600, -1800];
master_bedroom_front_window_x_positions = [-5400, -3600, -1800];
master_bedroom_back_window_x_positions = [-5050, -2650]; // Two bedrooms across the hall - shifted left 2 meters

// ========================================
// DOOR DIMENSIONS
// ========================================
door_width = 1000;
door_height = 2200;
door_depth = 300;
door_pane_depth = 100;
sliding_door_width = 2000; // Twice as wide as front door

// ========================================
// FENCE DIMENSIONS
// ========================================
fence_thickness = 200;  // 200mm thick
fence_height = 1800;    // 1.8m tall

// ========================================
// COLORS
// ========================================
grass_color = [0.424, 0.482, 0.188]; // 6C7B30
concrete_color = [0.643, 0.718, 0.741]; // A4B7BD
basement_color = [0.5, 0.5, 0.5];
house_color = [0.435, 0.616, 0.702]; // 6F9DB3
living_room_color = [0.545, 0.624, 0.627]; // 8B9FA0
master_bedroom_color = [0.514, 0.686, 0.737]; // 83AFBC
garage_color = [0.9, 0.9, 0.9];
garage_door_color = [0.8, 0.8, 0.773]; // CCCCC5
window_color = [0.1, 0.1, 0.1];
door_color = [0.153, 0.243, 0.243]; // 273E3E
roof_color = [0.722, 0.745, 0.745]; // B8BEBE
main_roof_color = [0.722, 0.745, 0.745]; // B8BEBE
fence_color = [0.6, 0.4, 0.2]; // Brown wood fence
garden_dirt_color = [0.4, 0.3, 0.2]; // Brown dirt for garden