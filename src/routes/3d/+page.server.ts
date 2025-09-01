export const load = async () => {
  return {
    models: [
      {
        name: "Default Astronaut",
        path: "/models/default.glb",
        environment: "/environments/default.hdr",
      },
    ],
  };
};
