{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    esbuild
    git
    nginx
    pandoc
    python3
    sassc
    nodePackages.typescript
  ];
}
