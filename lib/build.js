#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { crossPlatformUnzip, getBuildFolder } = require("./utils");

const BUNDLETOOL_JAR_NAME = "bundletool-all-1.18.1.jar";
const BUNDLETOOL_RELEASE_URL =
  "https://github.com/google/bundletool/releases/latest/download/bundletool-all-1.18.1.jar";

/**
 * Download with redirect support
 */
function downloadWithRedirect(url, dest, maxRedirects = 5) {
  const https = require("https");
  const http = require("http");

  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          maxRedirects > 0
        ) {
          return resolve(
            downloadWithRedirect(res.headers.location, dest, maxRedirects - 1)
          );
        }
        if (res.statusCode !== 200) {
          return reject(
            new Error(`Download failed (status ${res.statusCode})`)
          );
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.existsSync(dest) && fs.unlinkSync(dest);
        reject(err);
      });
  });
}

/**
 * Ensure keystore exists in build directory with default settings
 */
async function ensureKeystore(workDir) {
  const keystorePath = path.join(workDir, "release.keystore");
  const alias = "release";
  const storePass = "123456";
  const keyPass = "123456";

  if (fs.existsSync(keystorePath)) {
    console.log(`✅ Found keystore: release.keystore`);
    return {
      path: keystorePath,
      alias: alias,
      storePass: storePass,
      keyPass: keyPass,
    };
  }

  console.log(`🔑 Creating keystore for signed APK...`);

  try {
    const keytoolCmd = `keytool -genkey -v -keystore "${keystorePath}" -alias "${alias}" -keyalg RSA -keysize 2048 -validity 10000 -storepass "${storePass}" -keypass "${keyPass}" -dname "CN=Generate APK Tool, OU=Dev, O=Dev, L=Dev, S=Dev, C=US"`;

    execSync(keytoolCmd, { stdio: "pipe", cwd: workDir });
    console.log(`✅ Keystore created: release.keystore`);

    return {
      path: keystorePath,
      alias: alias,
      storePass: storePass,
      keyPass: keyPass,
    };
  } catch (error) {
    console.warn(`⚠️  Failed to create keystore: ${error.message}`);
    console.log(`🔄 Falling back to unsigned APK`);
    return null;
  }
}

/**
 * Ensure bundletool is available
 */
async function ensureBundletool(workDir) {
  const bundletoolPath = path.join(workDir, BUNDLETOOL_JAR_NAME);

  if (fs.existsSync(bundletoolPath)) {
    console.log(`✅ Found ${BUNDLETOOL_JAR_NAME}`);
    return bundletoolPath;
  }

  console.log(`📥 Downloading latest bundletool to ${workDir}...`);
  await downloadWithRedirect(BUNDLETOOL_RELEASE_URL, bundletoolPath);
  console.log(`✅ bundletool downloaded`);
  return bundletoolPath;
}

/**
 * Build APK from AAB with default settings
 * @param {string} aabFile - Path to the AAB file
 * @param {string} outputName - Name for the output APK
 * @param {string} buildDir - Directory to build in
 */
async function buildApkFromAab(aabFile, outputName, buildDir) {
  // Ensure AAB file exists
  if (!fs.existsSync(aabFile)) {
    throw new Error(`❌ AAB file not found: ${aabFile}`);
  }

  // Get or create build directory
  const workDir = getBuildFolder();

  // Copy AAB file to work directory
  const aabBaseName = path.basename(aabFile);
  const workAabPath = path.join(workDir, aabBaseName);
  fs.copyFileSync(aabFile, workAabPath);

  // Ensure bundletool in work directory
  const bundletoolPath = await ensureBundletool(workDir);

  // Ensure keystore for signed APK
  const keystore = await ensureKeystore(workDir);

  // Generate output files
  const baseName = path.basename(aabFile, ".aab");
  const outputApks = path.join(workDir, `${baseName}.apks`);

  // Build command with signing if keystore is available
  let buildCmd = `java -jar "${bundletoolPath}" build-apks --bundle="${workAabPath}" --output="${outputApks}" --mode=universal`;

  if (keystore) {
    buildCmd += ` --ks="${keystore.path}" --ks-pass=pass:${keystore.storePass} --ks-key-alias=${keystore.alias} --key-pass=pass:${keystore.keyPass}`;
    console.log(`🔧 Building signed APKS from ${aabBaseName}...`);
  } else {
    console.log(`🔧 Building unsigned APKS from ${aabBaseName}...`);
  }
  try {
    execSync(buildCmd, { stdio: "inherit", cwd: workDir });
  } catch (error) {
    throw new Error(`❌ Failed to build APKS: ${error.message}`);
  }

  // Extract universal.apk using cross-platform method
  console.log(`📦 Extracting universal.apk...`);
  try {
    crossPlatformUnzip(outputApks, workDir, "universal.apk");
  } catch (error) {
    throw new Error(`❌ Failed to extract APK: ${error.message}`);
  }

  // Rename to final output name
  const universalApkPath = path.join(workDir, "universal.apk");
  const finalApkName = outputName.endsWith(".apk")
    ? outputName
    : `${outputName}.apk`;
  const finalApkPath = path.join(workDir, finalApkName);

  if (fs.existsSync(universalApkPath)) {
    fs.renameSync(universalApkPath, finalApkPath);

    // Clean up intermediate files
    fs.unlinkSync(outputApks);
    fs.unlinkSync(workAabPath);

    const signStatus = keystore ? "signed" : "unsigned";
    console.log(`\n✅ APK conversion completed!`);
    console.log(`📱 APK file: ${finalApkName} (${signStatus})`);
    console.log(`📁 Location: ${workDir}`);
    if (keystore) {
      console.log(`🔐 Signed with keystore: release.keystore`);
    }
    console.log(
      `\n💡 Your ${signStatus} APK is ready for ${
        keystore
          ? "distribution and installation"
          : "testing (requires manual installation)"
      }!`
    );

    return finalApkPath;
  } else {
    throw new Error(`❌ Failed to create universal.apk`);
  }
}

module.exports = {
  buildApkFromAab,
};
