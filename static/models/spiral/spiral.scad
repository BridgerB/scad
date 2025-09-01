// OPTION 1: Spiral Tower
// Uncomment this section to try the spiral tower

$fn = 100;
for (i = [0:20]) {
    rotate([0, 0, i * 18])
    translate([10 - i * 0.3, 0, i * 2])
    cube([3, 1, 2], center = true);
}
// Central spiral rod
cylinder(h = 42, r = 0.5);
