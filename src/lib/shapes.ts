// Catalog of primitive OpenSCAD shapes shown on the /shapes tab.
// Each entry's `code` is a self-contained starting point used both to
// pre-render a preview GLB (static/shapes/<id>.glb) and to prefill /create.
export type Shape = {
  id: string;
  name: string;
  description: string;
  code: string;
};

export const shapes: Shape[] = [
  {
    id: "cube",
    name: "Cube",
    description: "A simple box. Adjust the [x, y, z] dimensions.",
    code: "cube([20, 20, 20], center = true);\n",
  },
  {
    id: "sphere",
    name: "Sphere",
    description: "A ball. Raise $fn for a smoother surface.",
    code: "sphere(r = 12, $fn = 64);\n",
  },
  {
    id: "cylinder",
    name: "Cylinder",
    description: "A round column. Set height and radius.",
    code: "cylinder(h = 24, r = 10, center = true, $fn = 64);\n",
  },
  {
    id: "cone",
    name: "Cone",
    description: "A cylinder that tapers to a point (r2 = 0).",
    code: "cylinder(h = 24, r1 = 12, r2 = 0, center = true, $fn = 64);\n",
  },
  {
    id: "pyramid",
    name: "Pyramid",
    description: "A 4-sided cone — a low $fn cylinder.",
    code: "cylinder(h = 22, r1 = 14, r2 = 0, center = true, $fn = 4);\n",
  },
  {
    id: "hexagon",
    name: "Hex Prism",
    description: "A six-sided prism ($fn = 6).",
    code: "cylinder(h = 18, r = 12, center = true, $fn = 6);\n",
  },
  {
    id: "torus",
    name: "Torus",
    description: "A donut, made by revolving a circle.",
    code: "rotate_extrude($fn = 64)\n  translate([11, 0, 0])\n    circle(r = 4, $fn = 32);\n",
  },
  {
    id: "rounded-cube",
    name: "Rounded Cube",
    description: "A cube with rounded edges via minkowski().",
    code:
      "minkowski() {\n  cube([16, 16, 16], center = true);\n  sphere(r = 3, $fn = 24);\n}\n",
  },
  {
    id: "tube",
    name: "Tube",
    description: "A hollow cylinder (pipe) via difference().",
    code:
      "difference() {\n  cylinder(h = 24, r = 11, center = true, $fn = 64);\n  cylinder(h = 26, r = 7, center = true, $fn = 64);\n}\n",
  },
  {
    id: "star",
    name: "Star",
    description: "A 5-point star extruded from a polygon.",
    code:
      "linear_extrude(6)\n  polygon([for (i = [0:9])\n    let (r = (i % 2 == 0) ? 14 : 6)\n    [r * cos(i * 36), r * sin(i * 36)]]);\n",
  },
  {
    id: "gear",
    name: "Gear",
    description: "An involute spur gear from the MCAD library.",
    code:
      "use <MCAD/involute_gears.scad>\n\ngear(number_of_teeth = 14,\n     circular_pitch = 6,\n     gear_thickness = 5,\n     rim_thickness = 5,\n     hub_thickness = 5,\n     bore_diameter = 4);\n",
  },
  {
    id: "text",
    name: "Text",
    description: "Extruded 3D text. Change the string or font.",
    code:
      'linear_extrude(5)\n  text("3D", size = 14, halign = "center", valign = "center");\n',
  },
  {
    id: "twisted",
    name: "Twisted Column",
    description: "A square extruded with a 180° twist.",
    code: "linear_extrude(height = 30, twist = 180, $fn = 64)\n  square([14, 14], center = true);\n",
  },
  {
    id: "capsule",
    name: "Capsule",
    description: "A pill shape — the hull of two spheres.",
    code:
      "hull() {\n  sphere(r = 6, $fn = 48);\n  translate([0, 0, 18]) sphere(r = 6, $fn = 48);\n}\n",
  },
  {
    id: "dome",
    name: "Dome",
    description: "A hemisphere — a sphere cut in half.",
    code:
      "difference() {\n  sphere(r = 13, $fn = 64);\n  translate([0, 0, -13]) cube([28, 28, 26], center = true);\n}\n",
  },
  {
    id: "octahedron",
    name: "Octahedron",
    description: "Two 4-sided pyramids base to base.",
    code:
      "union() {\n  cylinder(h = 12, r1 = 13, r2 = 0, $fn = 4);\n  mirror([0, 0, 1]) cylinder(h = 12, r1 = 13, r2 = 0, $fn = 4);\n}\n",
  },
  {
    id: "wedge",
    name: "Wedge",
    description: "A triangular ramp extruded from a polygon.",
    code: "linear_extrude(14)\n  polygon([[0, 0], [24, 0], [0, 16]]);\n",
  },
  {
    id: "frame",
    name: "Frame",
    description: "A cube with square holes bored through each face.",
    code:
      "difference() {\n  cube(22, center = true);\n  cube([14, 14, 30], center = true);\n  cube([30, 14, 14], center = true);\n  cube([14, 30, 14], center = true);\n}\n",
  },
  {
    id: "gem",
    name: "Gem",
    description: "A faceted gemstone — crown over a pointed pavilion.",
    code:
      "union() {\n  cylinder(h = 6, r1 = 13, r2 = 9, $fn = 8);\n  translate([0, 0, -13]) cylinder(h = 13, r1 = 9, r2 = 0, $fn = 8);\n}\n",
  },
  {
    id: "ellipsoid",
    name: "Ellipsoid",
    description: "A stretched sphere via non-uniform scale().",
    code: "scale([1, 0.7, 1.4]) sphere(r = 11, $fn = 64);\n",
  },
  {
    id: "prism",
    name: "Triangular Prism",
    description: "A triangle extruded into a prism.",
    code:
      "rotate([90, 0, 0])\n  linear_extrude(22)\n    polygon([[-11, 0], [11, 0], [0, 17]]);\n",
  },
  {
    id: "spring",
    name: "Spring",
    description: "A coil — a circle extruded with a big twist.",
    code:
      "linear_extrude(height = 26, twist = 720, $fn = 80)\n  translate([7, 0]) circle(r = 2.5, $fn = 24);\n",
  },
  {
    id: "arrow",
    name: "Arrow",
    description: "A shaft topped with a cone arrowhead.",
    code:
      "union() {\n  cylinder(h = 16, r = 4, $fn = 48);\n  translate([0, 0, 16]) cylinder(h = 10, r1 = 8, r2 = 0, $fn = 48);\n}\n",
  },
  {
    id: "cross",
    name: "Cross",
    description: "Two bars crossed into a plus sign.",
    code:
      "union() {\n  cube([26, 9, 9], center = true);\n  cube([9, 26, 9], center = true);\n}\n",
  },
  {
    id: "lbracket",
    name: "L-Bracket",
    description: "Two boxes joined into an L.",
    code:
      "union() {\n  cube([24, 9, 9]);\n  cube([9, 9, 24]);\n}\n",
  },
  {
    id: "washer",
    name: "Washer",
    description: "A flat ring — a short tube.",
    code:
      "difference() {\n  cylinder(h = 5, r = 14, center = true, $fn = 64);\n  cylinder(h = 7, r = 8, center = true, $fn = 64);\n}\n",
  },
  {
    id: "bowl",
    name: "Bowl",
    description: "A hollow hemisphere, open at the top.",
    code:
      "difference() {\n  sphere(r = 13, $fn = 64);\n  sphere(r = 10.5, $fn = 64);\n  translate([0, 0, 13]) cube(26, center = true);\n}\n",
  },
  {
    id: "knob",
    name: "Knob",
    description: "A cylinder capped with a sphere.",
    code:
      "union() {\n  cylinder(h = 12, r = 9, $fn = 64);\n  translate([0, 0, 12]) sphere(r = 9, $fn = 64);\n}\n",
  },
  {
    id: "jack",
    name: "Jack",
    description: "Three axes of rods with balls on the ends.",
    code:
      "union() {\n  for (a = [[0, 0, 0], [90, 0, 0], [0, 90, 0]])\n    rotate(a) cylinder(h = 28, r = 3, center = true, $fn = 32);\n  for (v = [[14,0,0],[-14,0,0],[0,14,0],[0,-14,0],[0,0,14],[0,0,-14]])\n    translate(v) sphere(r = 4, $fn = 24);\n}\n",
  },
  {
    id: "octagon",
    name: "Octagon Prism",
    description: "An eight-sided prism ($fn = 8).",
    code: "cylinder(h = 16, r = 12, center = true, $fn = 8);\n",
  },
  {
    id: "heart",
    name: "Heart",
    description: "A 45° square with two lobes — the classic heart.",
    code:
      "linear_extrude(6)\n  union() {\n    rotate(45) square(14, center = true);\n    translate([14/2 * cos(45), 14/2 * sin(45)]) circle(d = 14, $fn = 48);\n    translate([-14/2 * cos(45), 14/2 * sin(45)]) circle(d = 14, $fn = 48);\n  }\n",
  },
  {
    id: "hexnut",
    name: "Hex Nut",
    description: "A hexagonal prism with an internally threaded bore.",
    code:
      "difference() {\n  cylinder(h = 9, r = 12, center = true, $fn = 6);\n  translate([0, 0, -6])\n    linear_extrude(height = 12, twist = -360 * 5, $fn = 64)\n      union() {\n        circle(r = 6, $fn = 48);\n        polygon([[6, -1.1], [7.4, 0], [6, 1.1]]);\n      }\n}\n",
  },
  {
    id: "bolt",
    name: "Bolt",
    description: "A hex head on a threaded shaft (helical thread).",
    code:
      "union() {\n  cylinder(h = 6, r = 12, $fn = 6);\n  translate([0, 0, 6])\n    linear_extrude(height = 22, twist = -360 * 6, $fn = 72)\n      union() {\n        circle(r = 5.5, $fn = 48);\n        polygon([[5.3, -1.3], [7, 0], [5.3, 1.3]]);\n      }\n}\n",
  },
  {
    id: "lozenge",
    name: "Lozenge",
    description: "A stadium shape — hull of two circles.",
    code:
      "linear_extrude(8)\n  hull() {\n    translate([-8, 0]) circle(r = 6, $fn = 40);\n    translate([8, 0]) circle(r = 6, $fn = 40);\n  }\n",
  },
  {
    id: "table",
    name: "Table",
    description: "A top on four legs, built with a for loop.",
    code:
      "union() {\n  translate([0, 0, 13]) cube([26, 26, 2], center = true);\n  for (x = [-11, 11], y = [-11, 11])\n    translate([x, y, 0]) cylinder(h = 13, r = 1.6, $fn = 24);\n}\n",
  },
  {
    id: "stairs",
    name: "Stairs",
    description: "A flight of steps from a loop.",
    code:
      "union() {\n  for (i = [0:4])\n    translate([i * 5, 0, i * 4]) cube([5, 20, 4]);\n}\n",
  },
  {
    id: "sprocket",
    name: "Sprocket",
    description: "A disc with a bore and notched rim.",
    code:
      "difference() {\n  cylinder(h = 6, r = 13, center = true, $fn = 64);\n  cylinder(h = 8, r = 5, center = true, $fn = 32);\n  for (a = [0:30:359])\n    rotate(a) translate([13, 0, 0]) cylinder(h = 8, r = 2.5, center = true, $fn = 24);\n}\n",
  },
  {
    id: "propeller",
    name: "Propeller",
    description: "A hub and nose cone with three pitched, tapered blades.",
    code:
      "union() {\n  cylinder(h = 7, r = 4, $fn = 48);\n  translate([0, 0, 7]) cylinder(h = 3, r1 = 4, r2 = 0, $fn = 48);\n  for (a = [0, 120, 240])\n    rotate([0, 0, a])\n      translate([0, 0, 3.5])\n        rotate([30, 0, 0])\n          hull() {\n            cylinder(h = 1.4, r = 3.6, $fn = 24);\n            translate([16, 0, 0]) cylinder(h = 1.4, r = 1.6, $fn = 24);\n          }\n}\n",
  },
  {
    id: "wheel",
    name: "Wheel",
    description: "A rim, hub, and spokes.",
    code:
      "union() {\n  difference() {\n    cylinder(h = 5, r = 14, center = true, $fn = 64);\n    cylinder(h = 7, r = 11, center = true, $fn = 64);\n  }\n  cylinder(h = 5, r = 3.5, center = true, $fn = 32);\n  for (a = [0:60:179])\n    rotate([0, 0, a]) cube([28, 2.5, 4], center = true);\n}\n",
  },
  {
    id: "tee",
    name: "Pipe Tee",
    description: "Two cylinders joined into a T.",
    code:
      "union() {\n  cylinder(h = 22, r = 5, $fn = 48);\n  translate([0, 0, 20]) rotate([90, 0, 0]) cylinder(h = 24, r = 5, center = true, $fn = 48);\n}\n",
  },
  {
    id: "lattice",
    name: "Lattice",
    description: "A 3×3×3 grid of small cubes.",
    code:
      "union() {\n  for (x = [0, 8, 16], y = [0, 8, 16], z = [0, 8, 16])\n    translate([x, y, z]) cube(4);\n}\n",
  },
  {
    id: "mushroom",
    name: "Mushroom",
    description: "A stem topped with a domed cap.",
    code:
      "union() {\n  cylinder(h = 11, r = 3.5, $fn = 48);\n  translate([0, 0, 11])\n    difference() {\n      scale([1, 1, 0.62]) sphere(r = 11, $fn = 64);\n      translate([0, 0, -7]) cube([26, 26, 14], center = true);\n    }\n}\n",
  },
  {
    id: "top",
    name: "Spinning Top",
    description: "A point-down cone body with a stem on top.",
    code:
      "union() {\n  cylinder(h = 14, r1 = 0, r2 = 13, $fn = 64);\n  translate([0, 0, 14]) cylinder(h = 6, r = 2.5, $fn = 24);\n}\n",
  },
  {
    id: "obelisk",
    name: "Obelisk",
    description: "A tapered square shaft with a pyramid cap.",
    code:
      "union() {\n  cylinder(h = 26, r1 = 8, r2 = 5, $fn = 4);\n  translate([0, 0, 26]) cylinder(h = 7, r1 = 5, r2 = 0, $fn = 4);\n}\n",
  },
  {
    id: "funnel",
    name: "Funnel",
    description: "A wide bowl narrowing to a spout, hollow through.",
    code:
      "difference() {\n  union() {\n    cylinder(h = 14, r1 = 4, r2 = 14, $fn = 64);\n    translate([0, 0, -8]) cylinder(h = 8, r = 4, $fn = 48);\n  }\n  translate([0, 0, 2]) cylinder(h = 14, r1 = 2.5, r2 = 12, $fn = 64);\n  translate([0, 0, -9]) cylinder(h = 14, r = 2.5, $fn = 48);\n}\n",
  },
  {
    id: "halfpipe",
    name: "Half-Pipe",
    description: "A block with a round channel cut through it.",
    code:
      "difference() {\n  cube([24, 24, 12], center = true);\n  translate([0, 0, 4]) rotate([0, 90, 0]) cylinder(h = 26, r = 9, center = true, $fn = 64);\n}\n",
  },
  {
    id: "diamond",
    name: "Diamond",
    description: "A smooth round bipyramid.",
    code:
      "union() {\n  cylinder(h = 12, r1 = 12, r2 = 0, $fn = 64);\n  mirror([0, 0, 1]) cylinder(h = 6, r1 = 12, r2 = 0, $fn = 64);\n}\n",
  },
  {
    id: "drum",
    name: "Drum",
    description: "A barrel — a bulged profile revolved.",
    code:
      "rotate_extrude($fn = 64)\n  polygon([[0, -9], [9, -7], [11, 0], [9, 7], [0, 9]]);\n",
  },
];

export function getShape(id: string): Shape | undefined {
  return shapes.find((s) => s.id === id);
}
