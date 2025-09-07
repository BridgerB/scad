// Basic House - Trisplit Design
$fn = 50;

// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

// House dimensions (FULL SIZE in mm)
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

// Window dimensions
window_width = 1200;
window_depth = 300;
window_pane_depth = 100;
basement_window_height = 1000;
ground_floor_window_height = 1200;
master_bedroom_window_height = 1600;
back_bedroom_window_width = 1800; // Wider windows for back bedrooms
living_room_window_width = 3000;
living_room_window_height = 1200;

// Door dimensions  
door_width = 1000;
door_height = 2200;
door_depth = 300;
door_pane_depth = 100;
sliding_door_width = 2000; // Twice as wide as front door
kitchen_window_width = 1500;
kitchen_window_height = 1000;

// Colors
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

// Window positions (X coordinates relative to left section)
basement_window_x_positions = [-5400, -3600, -1800];
master_bedroom_front_window_x_positions = [-5400, -3600, -1800];
master_bedroom_back_window_x_positions = [-5050, -2650]; // Two bedrooms across the hall - shifted left 2 meters

// House origin offset
house_origin_x = 6000;

// ========================================
// REUSABLE MODULES
// ========================================

module create_window_opening(x, y, z, w, d, h) {
    translate([x, y, z])
    cube([w, d, h]);
}

module create_window_pane(x, y, z, w, d, h) {
    color(window_color)
    translate([x, y, z])
    cube([w, d, h]);
}

module create_door_opening(x, y, z, w, d, h) {
    translate([x, y, z])
    cube([w, d, h]);
}

module create_door_pane(x, y, z, w, d, h) {
    color(door_color)
    translate([x, y, z])
    cube([w, d, h]);
}

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
        create_window_pane(x, -50, -100, window_width, window_pane_depth, basement_window_height);
    }
    // Back window panes (straight across from front)
    for (x = basement_window_x_positions) {
        create_window_pane(x, house_depth - 50, -100, window_width, window_pane_depth, basement_window_height);
    }
}

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
        create_window_pane(x, -1050, house_height + 100, window_width, window_pane_depth, master_bedroom_window_height);
    }
    // Back windows (bedrooms across the hall) - wider
    for (x = master_bedroom_back_window_x_positions) {
        create_window_pane(x, house_depth - 50, house_height + 100, back_bedroom_window_width, window_pane_depth, master_bedroom_window_height);
    }
}

// ========================================
// LANDSCAPING MODULES  
// ========================================

module lawn_areas() {
    color(grass_color) {
        // Left side lawn (in front of left section) - extended to 12m from front door
        translate([-2500, -12000, -100])
        cube([8500, 12000, 100]);
        
        // Left side of house (along the side) - extended
        translate([-2500, 0, -100])
        cube([2500, 9500, 100]);
        
        // Front of middle section lawn - extended to 12m from front door
        translate([6000, -12000, -100])
        cube([6000, 12000, 100]);
        
        // Back yard lawn (behind house) - with gap for walkway
        translate([-2500, 9500, -100])
        cube([8700, 1000, 100]); // Left side grass (before walkway)
        
        // Grass between green door and concrete walkway (fills the hole)
        translate([6200, 9500, -100])
        cube([6000, 1000, 100]);
        
        // Back yard lawn continued (after walkway) - extended to 16m from sliding door
        translate([-2500, 10500, -100])
        cube([20500, 16000, 100]); // Extended back yard to 16m depth
    }
}

module concrete_areas() {
    color(concrete_color) {
        // Driveway/garage area (in front of garage) - extended to match grass
        translate([12000, -12000, -100])
        cube([6000, 12000, 100]);
        
        // Right side concrete area (in front) - extended to match grass
        translate([18000, -12000, -100])
        cube([5000, 12000, 100]);
        
        // Right side of house (along the side)
        translate([18000, 0, -100])
        cube([5000, 9500, 100]);
        
        // 1 meter sidewalk to garage door (extends back from concrete)
        translate([18000, 9500, -100])
        cube([5000, 1000, 100]);
        
        // Walkway from gate to green door (horizontal concrete path)
        translate([12200, 9500, -100])
        cube([5600, 1000, 100]); // From green door to gate
    }
}

// ========================================
// HOUSE STRUCTURE MODULES
// ========================================

module basement_section() {
    color(basement_color)
    difference() {
        translate([left_section_x, 0, -basement_height])
        cube([section_width, house_depth, basement_height]);
        
        basement_windows();
    }
}

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

module middle_section_structure() {
    color(living_room_color)
    difference() {
        translate([middle_section_x, 0, 0])
        cube([section_width, house_depth, house_height]);
        
        // Front door opening
        create_door_opening(200, -100, 0, door_width, door_depth, door_height);
        
        // Living room window opening (front)
        create_window_opening(1500, -100, 1500, living_room_window_width, window_depth, living_room_window_height);
        
        // Sliding door opening (back - straight across from front door)
        create_door_opening(200, house_depth - 100, 0, sliding_door_width, door_depth, door_height);
        
        // Kitchen window opening (back - moved 1m east)
        create_window_opening(3500, house_depth - 100, 1200, kitchen_window_width, window_depth, kitchen_window_height);
    }
}

module garage_section() {
    color(garage_color)
    translate([garage_section_x, 0, 0])
    difference() {
        cube([section_width, house_depth, house_height]);
        
        // Garage door opening (front)
        translate([200, -100, 0])
        cube([5600, 300, house_height - 200]);
        
        // Back door opening (against kitchen wall)
        create_door_opening(200, house_depth - 100, 0, door_width, door_depth, door_height);
    }
}

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
// DOORS & WINDOWS
// ========================================

module doors_and_windows() {
    // Front door
    create_door_pane(200, -50, 0, door_width, door_pane_depth, door_height);
    
    // Living room window (front)
    create_window_pane(1500, -50, 1500, living_room_window_width, window_pane_depth, living_room_window_height);
    
    // Sliding door (back - glass panels)
    color(window_color)
    create_window_pane(200, house_depth - 50, 0, sliding_door_width, door_pane_depth, door_height);
    
    // Kitchen window (back - moved 1m east)
    create_window_pane(3500, house_depth - 50, 1200, kitchen_window_width, window_pane_depth, kitchen_window_height);
    
    // Garage door (front)
    color(garage_door_color)
    translate([garage_section_x + 200, -50, 0])
    cube([5600, door_pane_depth, house_height - 200]);
    
    // Garage back door (against kitchen wall)
    create_door_pane(garage_section_x + 200, house_depth - 50, 0, door_width, door_pane_depth, door_height);
    
    // Basement window panes
    basement_window_panes();
    
    // Master bedroom window panes
    master_bedroom_window_panes();
}

// ========================================
// FENCE MODULE
// ========================================

module wood_fence() {
    color(fence_color) {
        // Main fence across back of sidewalk (pushed back 1 meter)
        translate([18000, 10500, 0])
        cube([5000, 200, 1800]); // 200mm thick, 1.8m tall fence
        
        // Short fence connecting island fence to house (1 meter)
        translate([17800, 9500, 0])
        cube([200, 1000, 1800]); // Perpendicular connector fence
    }
}

// ========================================
// GARDEN MODULE
// ========================================

module garden_area() {
    color(garden_dirt_color) {
        // Garden dirt on right side behind fence (from fence to back of property)
        translate([18000, 10500, -100])
        cube([5000, 16000, 100]); // Extended to match back yard depth
    }
}

// ========================================
// MAIN ASSEMBLY
// ========================================

// Landscaping
lawn_areas();
concrete_areas();
wood_fence();
garden_area();

// Main house structure (with origin offset)
translate([house_origin_x, 0, 0])
union() {
    basement_section();
    left_section_structure();
    middle_section_structure();
    garage_section();
    roof_system();
    doors_and_windows();
}