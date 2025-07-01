{
  description = "VS Code Copilot Chat Extension Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js 22.x as required by package.json
            nodejs_22

            # Package managers
            npm-check-updates

            # Development tools
            git

            # VS Code (optional - if you want to run it from nix)
            # vscode
          ];

          shellHook = ''
            echo "🚀 VS Code Copilot Chat Development Environment"
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
            echo ""
            echo "Available commands:"
            echo "  npm install     - Install dependencies"
            echo "  npm run compile - Build the extension"
            echo "  npm run watch   - Build and watch for changes"
            echo ""

            # Ensure we're using the right Node.js version
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';

          # Environment variables
          NODE_ENV = "development";
        };
      });
}
