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
        
        # Create a derivation for the development environment
        copilot-x-dev = pkgs.stdenv.mkDerivation {
          pname = "copilot-x-dev";
          version = "0.29.2";
          
          src = ./.;
          
          buildInputs = with pkgs; [
            nodejs_22
            npm-check-updates
            git
          ];
          
          buildPhase = ''
            echo "Development environment ready"
          '';
          
          installPhase = ''
            mkdir -p $out/bin
            echo "#!/bin/sh" > $out/bin/copilot-x-dev
            echo "echo 'Copilot X Development Environment'" >> $out/bin/copilot-x-dev
            chmod +x $out/bin/copilot-x-dev
          '';
        };
      in
      {
        # Provide both packages and devShells
        packages.default = copilot-x-dev;
        
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
            # Disable nvm to avoid conflicts
            unset NVM_DIR
            unset NVM_BIN

            # Clear any nvm-related paths
            export PATH=$(echo "$PATH" | tr ':' '\n' | grep -v '\.nvm' | tr '\n' ':' | sed 's/:$//')

            # Ensure Nix-provided Node.js is first in PATH
            export PATH="${pkgs.nodejs_22}/bin:$PWD/node_modules/.bin:$PATH"

            echo "🚀 VS Code Copilot Chat Development Environment"
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
            echo "Node.js path: $(which node)"
            echo ""
            echo "Available commands:"
            echo "  npm install     - Install dependencies"
            echo "  npm run compile - Build the extension"
            echo "  npm run watch   - Build and watch for changes"
            echo ""
          '';

          # Environment variables
          NODE_ENV = "development";
        };
      });
}
