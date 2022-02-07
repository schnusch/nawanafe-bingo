{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    esbuild
    git
    nginx
    pandoc
    sassc
    nodePackages.typescript
  ];
}
