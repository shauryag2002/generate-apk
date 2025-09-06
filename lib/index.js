#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const https = require("https");
const http = require("http");
const path = require("path");
const readline = require("readline");
const { crossPlatformUnzip } = require("./utils");

const BUNDLETOOL_JAR_NAME = "bundletool-all-1.18.1.jar";
const BUNDLETOOL_RELEASE_URL =
  "https://github.com/google/bundletool/releases/latest/download/bundletool-all-1.18.1.jar";

let keystoreConfig = null;

// --- Helpers ---
function makeExecutable(filePath) {
  try {
    // Set read, write, execute permissions for owner; read, execute for group and others
    fs.chmodSync(filePath, 0o755);
    console.log(`✅ Made ${filePath} executable`);
  } catch (err) {
    console.warn(`⚠️  Could not set executable permissions: ${err.message}`);
  }
}

function ask(question, { hideInput = false } = {}) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  if (hideInput) {
    rl.stdoutMuted = true;
    rl._writeToOutput = (stringToWrite) => {
      if (!rl.stdoutMuted) rl.output.write(stringToWrite);
    };
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    if (hideInput) rl.stdoutMuted = true;
  });
}

function downloadWithRedirect(url, dest, maxRedirects = 5) {
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

async function ensureBundletool() {
  if (fs.existsSync(BUNDLETOOL_JAR_NAME)) {
    console.log(`✅ Found ${BUNDLETOOL_JAR_NAME}`);
    return;
  }
  console.log(`📥 Downloading latest bundletool…`);
  await downloadWithRedirect(BUNDLETOOL_RELEASE_URL, BUNDLETOOL_JAR_NAME);
  console.log(`✅ bundletool downloaded`);
}

async function pickAabFile(cliArg) {
  if (cliArg) {
    if (!fs.existsSync(cliArg)) {
      console.error(`❌ File not found: ${cliArg}`);
      process.exit(1);
    }
    return cliArg;
  }
  const aabs = fs
    .readdirSync(".")
    .filter((f) => f.endsWith(".aab"))
    .sort();
  if (aabs.length === 0) {
    console.error("❌ No .aab files found in this directory.");
    process.exit(1);
  }
  if (aabs.length === 1) {
    console.log(`⚙️  Only one .aab found, using ${aabs[0]}`);
    return aabs[0];
  }
  console.log("Select the AAB to convert:");
  aabs.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
  let idx;
  while (true) {
    const ans = await ask(`Enter number (1–${aabs.length}): `);
    idx = parseInt(ans, 10);
    if (idx >= 1 && idx <= aabs.length) break;
    console.log("❌ Invalid choice, try again.");
  }
  return aabs[idx - 1];
}

async function getKeystoreConfig() {
  if (keystoreConfig) return keystoreConfig;

  console.log(
    '\n🔐 Signing setup (press Enter to use default values or "skip" for unsigned APK)'
  );

  const ksPath = await ask(
    'Keystore path [chatreal-release.keystore] or "skip": '
  );

  // Allow skipping keystore for unsigned APKs
  if (ksPath.toLowerCase() === "skip" || ksPath.toLowerCase() === "s") {
    console.log("⚠️  Creating unsigned APK (not suitable for production)");
    return (keystoreConfig = null);
  }

  const resolvedKsPath = ksPath || "chatreal-release.keystore";

  // Check if keystore exists, if not create it
  if (!fs.existsSync(resolvedKsPath)) {
    console.log(`📋 Keystore not found at ${resolvedKsPath}`);
    const createKeystore = await ask("Create new keystore? (Y/n): ");

    if (
      createKeystore.toLowerCase() === "n" ||
      createKeystore.toLowerCase() === "no"
    ) {
      console.log("⚠️  Creating unsigned APK");
      return (keystoreConfig = null);
    }

    console.log("🔧 Creating new keystore...");

    // Get keystore details
    const alias = (await ask("Key alias [chatreal]: ")) || "chatreal";
    const ksPass = (await ask("Keystore password [123456]: ")) || "123456";
    const keyPass = (await ask("Key password [123456]: ")) || "123456";

    // Get certificate details
    const commonName = (await ask("Your name [Test User]: ")) || "Test User";
    const orgUnit = (await ask("Organization unit [Test Org]: ")) || "Test Org";
    const org = (await ask("Organization [Test Company]: ")) || "Test Company";
    const city = (await ask("City [Test City]: ")) || "Test City";
    const state = (await ask("State [Test State]: ")) || "Test State";
    const country = (await ask("Country code (2 letters) [US]: ")) || "US";

    const dname = `CN=${commonName}, OU=${orgUnit}, O=${org}, L=${city}, S=${state}, C=${country}`;

    try {
      const keytoolCmd = `keytool -genkey -v -keystore "${resolvedKsPath}" -alias "${alias}" -keyalg RSA -keysize 2048 -validity 10000 -storepass "${ksPass}" -keypass "${keyPass}" -dname "${dname}"`;

      console.log("🔑 Generating keystore...");
      execSync(keytoolCmd, { stdio: "inherit" });
      console.log(`✅ Keystore created: ${resolvedKsPath}`);

      return (keystoreConfig = {
        ksPath: resolvedKsPath,
        alias: alias,
        ksPass: ksPass,
        keyPass: keyPass,
      });
    } catch (err) {
      console.error("❌ Failed to create keystore:", err.message);
      console.log("💡 Make sure you have Java JDK installed (keytool command)");
      console.log("⚠️  Creating unsigned APK instead");
      return (keystoreConfig = null);
    }
  }

  // Keystore exists, get the details
  const alias = await ask("Key alias [chatreal]: ");
  const resolvedAlias = alias || "chatreal";

  const ksPass = await ask("Keystore password [default: 123456]: ");
  const resolvedKsPass = ksPass || "123456";

  const keyPass = await ask("Key password [default: 123456]: ");
  const resolvedKeyPass = keyPass || "123456";

  console.log("✅ Keystore details captured\n");
  return (keystoreConfig = {
    ksPath: resolvedKsPath,
    alias: resolvedAlias,
    ksPass: resolvedKsPass,
    keyPass: resolvedKeyPass,
  });
}

// --- Main Flow ---
async function main() {
  makeExecutable(__filename);

  const cliArg = process.argv[2];
  await ensureBundletool();

  const aabFile = await pickAabFile(cliArg);
  const baseName = path.basename(aabFile, ".aab");
  const outputApks = `${baseName}.apks`;

  // Remove existing .apks if present
  if (fs.existsSync(outputApks)) {
    console.log(`⚠️  ${outputApks} already exists, removing...`);
    fs.unlinkSync(outputApks);
  }

  const ks = await getKeystoreConfig();

  // Build command
  let buildCmd = `java -jar ${BUNDLETOOL_JAR_NAME} build-apks --bundle=${aabFile} --output=${outputApks} --mode=universal`;
  if (ks) {
    buildCmd +=
      ` --ks=${ks.ksPath}` +
      ` --ks-pass=pass:${ks.ksPass}` +
      ` --ks-key-alias=${ks.alias}` +
      ` --key-pass=pass:${ks.keyPass}`;
  }

  console.log(`🔧 Building APKS from ${aabFile}…`);
  execSync(buildCmd, { stdio: "inherit" });

  // Remove existing universal.apk if present
  if (fs.existsSync("universal.apk")) {
    fs.unlinkSync("universal.apk");
  }

  console.log(`📦 Extracting universal.apk…`);
  try {
    crossPlatformUnzip(outputApks, ".", "universal.apk");
  } catch (error) {
    console.error(`❌ Failed to extract APK: ${error.message}`);
    process.exit(1);
  }

  const defaultName = ks
    ? `${baseName}-signed.apk`
    : `${baseName}-unsigned.apk`;
  let apkName = await ask(`Enter final APK name [default: ${defaultName}]: `);
  if (!apkName) apkName = defaultName;
  if (!apkName.toLowerCase().endsWith(".apk")) apkName += ".apk";

  // Overwrite existing APK if present
  if (fs.existsSync(apkName)) {
    console.log(`⚠️  ${apkName} already exists, overwriting...`);
    fs.unlinkSync(apkName);
  }

  fs.renameSync("universal.apk", apkName);
  console.log(`\n✅ APK ready: ${apkName}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
