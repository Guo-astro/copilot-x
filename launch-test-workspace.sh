#!/bin/bash

# Script to launch VS Code Extension Development Host for testing Copilot X

# First, make sure the extension is compiled
echo "Compiling extension..."
if ! npm run compile; then
    echo "❌ Compilation failed! Please fix the errors and try again."
    exit 1
fi

# Launch VS Code with extension development mode and API proposals enabled
echo "Launching VS Code Extension Development Host with API proposals..."
code --extensionDevelopmentPath="$(pwd)" --enable-proposed-api=goastro.copilot-x

echo "✅ VS Code Extension Development Host launched!"
echo "Your Copilot X extension should now be available for testing."
echo ""
echo "🧪 To test the workbenchServiceImpl.test.ts specifically:"
echo "1. Open the Command Palette (Cmd+Shift+P)"
echo "2. Run 'Tasks: Run Task'"
echo "3. Select 'npm: test:extension'"
echo "Or run manually: npm run test:extension"
echo ""
echo "💡 Note: API proposals are enabled with --enable-proposed-api=goastro.copilot-x"
