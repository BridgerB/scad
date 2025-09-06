$fn = 50;

module split_sphere(r = 10) {
    color("red") 
        intersection() {
            sphere(r);
            translate([0, 0, r/2]) cube([r*2, r*2, r], center=true);
        }
    
    color("white") 
        intersection() {
            sphere(r);
            translate([0, 0, -r/2]) cube([r*2, r*2, r], center=true);
        }
}

split_sphere();