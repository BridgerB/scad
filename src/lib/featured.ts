// Hard-coded "featured" items pinned to the top of the home page, ahead of
// the database-backed scads. Metadata only (no SCAD source) so this stays
// client-safe; the source for prefill is loaded server-side in /create.
export type Featured = {
  id: string;
  title: string;
  description: string;
  username: string;
  preview: string; // static GLB path
  href: string; // where the card links
};

export const featured: Featured[] = [
  {
    id: "house",
    title: "Trisplit House",
    description: "A full trisplit-design example house (multi-file project).",
    username: "bridgerb",
    preview: "/featured/house.glb",
    href: "/create?featured=house-modular",
  },
];
