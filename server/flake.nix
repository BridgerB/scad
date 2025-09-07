{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = {
    self,
    nixpkgs,
  }: let
    pkgs = nixpkgs.legacyPackages.x86_64-linux;
  in {
    packages.x86_64-linux.default = pkgs.buildEnv {
      name = "oci-server-env";
      paths = with pkgs; [ openscad-unstable neovim nodejs_24 git gnumake unzip zip ];
    };
  };
}
