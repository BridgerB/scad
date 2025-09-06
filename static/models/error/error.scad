// Multi-line ERROR Message
// 3D extruded text displaying error message

// Parameters
text_size = 12;          // Font size
text_height = 3;         // Extrusion height
font_name = "Arial:style=Bold";  // Font (change as needed)
line_spacing = 15;       // Space between lines

// Quality settings
$fn = 50;

module error_message() {
    rotate([90, 0, 0]) {
        // Line 1: ERROR IN
        translate([0, line_spacing * 2, 0])
            linear_extrude(height = text_height) {
                text("ERROR IN", 
                     size = text_size, 
                     font = font_name, 
                     halign = "center", 
                     valign = "center");
            }
        
        // Line 2: YOUR CODE
        translate([0, line_spacing, 0])
            linear_extrude(height = text_height) {
                text("YOUR CODE", 
                     size = text_size, 
                     font = font_name, 
                     halign = "center", 
                     valign = "center");
            }
        
        // Line 3: <-
        translate([0, 0, 0])
            linear_extrude(height = text_height) {
                text("<-", 
                     size = text_size, 
                     font = font_name, 
                     halign = "center", 
                     valign = "center");
            }
        
        // Line 4: TRY AGAIN
        translate([0, -line_spacing * 1, 0])
            linear_extrude(height = text_height) {
                text("TRY AGAIN", 
                     size = text_size, 
                     font = font_name, 
                     halign = "center", 
                     valign = "center");
            }
    }
}

// Create the ERROR message
error_message();