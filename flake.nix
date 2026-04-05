{
  description = "A multi-user morse code system";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = {self, nixpkgs}: let
    systems = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];

    forAllSystems = nixpkgs.lib.genAttrs systems;
  in {
    devShells = forAllSystems (system: let
      pkgs = nixpkgs.legacyPackages.${system};

      myRuby = pkgs.ruby.withPackages (ps: [
        ps.git
      ]);
    in {
      default = pkgs.mkShell {
        packages = [
          pkgs.nodejs_latest
          myRuby
          pkgs.git
        ];
      };
    });
  };
}