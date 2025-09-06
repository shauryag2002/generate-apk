const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Cross-platform unzip function
 * @param {string} zipFile - Path to the zip file
 * @param {string} outputDir - Directory to extract to
 * @param {string} specificFile - Specific file to extract (optional)
 */
function crossPlatformUnzip(zipFile, outputDir = ".", specificFile = null) {
  const isWindows = process.platform === "win32";

  try {
    if (isWindows) {
      // Use PowerShell on Windows
      if (specificFile) {
        const psCommand = `Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${zipFile}'); $entry = $zip.Entries | Where-Object { $_.Name -eq '${specificFile}' }; if ($entry) { [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, '${path.join(
          outputDir,
          specificFile
        )}', $true) }; $zip.Dispose()`;
        execSync(`powershell -Command "${psCommand}"`, { stdio: "pipe" });
      } else {
        const psCommand = `Expand-Archive -Path "${zipFile}" -DestinationPath "${outputDir}" -Force`;
        execSync(`powershell -Command "${psCommand}"`, { stdio: "pipe" });
      }
    } else {
      // Use unzip on Unix-like systems
      if (specificFile) {
        execSync(`unzip -o "${zipFile}" "${specificFile}" -d "${outputDir}"`, {
          stdio: "pipe",
        });
      } else {
        execSync(`unzip -o "${zipFile}" -d "${outputDir}"`, { stdio: "pipe" });
      }
    }
  } catch (error) {
    throw new Error(`Failed to extract ${zipFile}: ${error.message}`);
  }
}

/**
 * Get the user's desktop path
 */
function getDesktopPath() {
  const os = require("os");
  const homeDir = os.homedir();

  if (process.platform === "win32") {
    return path.join(homeDir, "Desktop");
  } else {
    return path.join(homeDir, "Desktop");
  }
}

/**
 * Get or create build folder on desktop
 * @param {string} baseName - Base name for the folder (default: 'build')
 * @returns {string} Full path to the build folder
 */
function getBuildFolder(baseName = "build") {
  const desktopPath = getDesktopPath();
  const buildPath = path.join(desktopPath, baseName);

  if (fs.existsSync(buildPath)) {
    console.log(`📁 Using existing build directory: ${buildPath}`);
    return buildPath;
  } else {
    fs.mkdirSync(buildPath, { recursive: true });
    console.log(`📁 Created build directory: ${buildPath}`);
    return buildPath;
  }
}

module.exports = {
  crossPlatformUnzip,
  getDesktopPath,
  getBuildFolder,
};
