// landscaping.scad - Landscaping Modules
include <config.scad>

// ========================================
// LAWN AREAS
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

// ========================================
// CONCRETE AREAS
// ========================================
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
// GARDEN AREAS
// ========================================
module garden_area() {
    color(garden_dirt_color) {
        // Garden dirt on right side behind fence (from fence to back of property)
        translate([18000, 10500, -100])
        cube([5000, 16000, 100]); // Extended to match back yard depth
    }
}