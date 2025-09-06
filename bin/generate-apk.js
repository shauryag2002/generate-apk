#!/usr/bin/env node

const args = process.argv.slice(2);

// Show help if requested
if (args[0] === "--help" || args[0] === "-h") {
  console.log(`
📦 generate-apk - Convert Android App Bundles to APK

Usage:
  generate-apk                                    # Interactive mode
  generate-apk build <file.aab> --name=<output>   # Build mode (automated)
  generate-apk --help                             # Show this help

Examples:
  generate-apk                                    # Start interactive conversion
  generate-apk build app-release.aab --name=myapp.apk  # Build APK in desktop folder

Build mode features:
  • Uses existing 'build' folder on desktop (creates if not present)
  • Uses default settings (no prompts)
  • Generates signed APK (creates keystore automatically)
  • Cross-platform compatible
`);
  process.exit(0);
}

// Check if this is the new "build" command
if (args[0] === "build") {
  // Handle: generate-apk build file-name.aab --name=chat.apk
  const { buildApkFromAab } = require("../lib/build");

  async function handleBuildCommand() {
    try {
      const aabFile = args[1];

      if (!aabFile) {
        console.error(
          "❌ Usage: generate-apk build <file.aab> --name=<output.apk>"
        );
        console.error(
          "   Example: generate-apk build app-release.aab --name=myapp.apk"
        );
        console.error('   Run "generate-apk --help" for more information');
        process.exit(1);
      }

      // Parse --name parameter
      let outputName = "app-unsigned.apk";
      const nameArg = args.find((arg) => arg.startsWith("--name="));
      if (nameArg) {
        outputName = nameArg.split("=")[1];
      }

      await buildApkFromAab(aabFile, outputName);
    } catch (error) {
      console.error("❌ Build failed:", error.message);
      process.exit(1);
    }
  }

  handleBuildCommand();
} else {
  // Default behavior - run the interactive mode
  require("../lib/index.js");
}
