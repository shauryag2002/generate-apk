# 📦 generate-apk

[![npm version](https://badge.fury.io/js/generate-apk.svg)](https://badge.fury.io/js/generate-apk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-12%2B-green.svg)](https://nodejs.org/)

A powerful and user-friendly Node.js CLI tool to convert Android App Bundles (AAB) to APKs using Google's BundleTool, with interactive prompts and automatic keystore management.

## ✨ Features

- 🚀 **Two modes**: Interactive and automated build mode
- 📥 **Automatic BundleTool download** - no manual setup required
- 🔐 **Automatic keystore creation** - generates signed APKs ready for distribution
- 🎯 **Smart AAB detection** - finds `.aab` files automatically
- 📋 **Interactive prompts** with sensible defaults
- 🛡️ **Universal APK generation** compatible with all devices
- 🎨 **Beautiful CLI interface** with emojis and clear feedback
- ⚡ **Cross-platform support** (Windows, macOS, Linux)
- 📁 **Organized output** - uses dedicated build folder on desktop
- 🔧 **CI/CD friendly** - scriptable build mode

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g generate-apk
```

### Local Installation

```bash
npm install generate-apk
npx generate-apk
```

## 🚀 Quick Start

### Interactive Mode

Navigate to a directory containing your `.aab` file and run:

```bash
generate-apk
```

**What it does:**

1. 📥 Downloads BundleTool automatically (if not present)
2. 🔍 Detects `.aab` files in your directory
3. 🔐 Prompts for keystore details or creates one automatically
4. ⚙️ Generates signed APK with your specified name

### Build Mode (Automated)

For automated workflows and CI/CD:

```bash
generate-apk build <file.aab> --name=<output.apk>
```

**What it does:**

1. 📁 Uses/creates `build` folder on desktop
2. 🔑 Creates keystore automatically (no prompts)
3. ⚙️ Generates signed APK with default settings
4. 📱 Ready for distribution

## 🛠️ Usage Examples

### Interactive Mode Examples

```bash
# Basic usage - finds .aab files automatically
generate-apk

# Direct file specification
generate-apk app-release.aab
```

**Interactive workflow:**

```bash
$ generate-apk
✅ Found bundletool-all-1.18.1.jar
⚙️  Only one .aab found, using app-release.aab

🔐 Signing setup (press Enter for defaults or "skip" for unsigned)
Keystore path [chatreal-release.keystore] or "skip":
📋 Keystore not found. Create new keystore? (Y/n): y
🔑 Creating keystore...
✅ Keystore created: chatreal-release.keystore

🔧 Building signed APKS from app-release.aab…
📦 Extracting universal.apk…
Enter final APK name [app-release-signed.apk]: MyApp-v1.2.3.apk

✅ APK ready: MyApp-v1.2.3.apk
```

### Build Mode Examples

```bash
# Basic build command
generate-apk build app-release.aab --name=myapp.apk

# Multiple APKs (all go to same build folder)
generate-apk build app-release.aab --name=release.apk
generate-apk build app-debug.aab --name=debug.apk
```

**Build mode workflow:**

```bash
$ generate-apk build app-release.aab --name=myapp.apk

📁 Using existing build directory: /home/user/Desktop/build
✅ Found bundletool-all-1.18.1.jar
✅ Found keystore: release.keystore
🔧 Building signed APKS from app-release.aab...
📦 Extracting universal.apk...

✅ APK conversion completed!
📱 APK file: myapp.apk (signed)
📁 Location: /home/user/Desktop/build
🔐 Signed with keystore: release.keystore

💡 Your signed APK is ready for distribution and installation!
```

## ⚙️ Command Reference

### Interactive Mode

```bash
generate-apk                    # Auto-detect AAB files
generate-apk <file.aab>         # Specify AAB file
generate-apk --help             # Show help
```

### Build Mode

```bash
generate-apk build <file.aab> --name=<output.apk>
```

**Build mode features:**

- ✅ Uses existing `build` folder on desktop (creates if needed)
- ✅ No interactive prompts - uses defaults
- ✅ Automatically creates and reuses keystore
- ✅ Generates signed APKs ready for distribution
- ✅ Perfect for automation and CI/CD

## 🔐 Keystore Management

### Interactive Mode

- Prompts for keystore path, alias, and passwords
- Can create new keystores with custom details
- Supports existing keystores
- Option to skip signing (unsigned APK)

### Build Mode

- Automatically creates `release.keystore` in build folder
- Uses secure defaults: RSA 2048-bit, 10,000-day validity
- Reuses existing keystore for subsequent builds
- Fallback to unsigned APK if keystore creation fails

**Default keystore settings:**

- **File**: `release.keystore`
- **Alias**: `release`
- **Store password**: `123456`
- **Key password**: `123456`

> **Note**: For production apps, consider using custom keystores with stronger passwords.

## 📁 Project Structure

```
generate-apk/
├── bin/
│   └── generate-apk.js          # 🚀 CLI entry point with command routing
├── lib/
│   ├── index.js                 # 🛠️ Interactive mode logic
│   ├── build.js                 # 🏗️ Build mode logic
│   └── utils.js                 # 🔧 Cross-platform utilities
├── package.json                 # 📋 Package configuration
└── README.md                   # 📖 Documentation
```

## 📋 Output Structure

### Interactive Mode

Creates files in current directory:

```
your-project/
├── app-release.aab              # Your input file
├── MyApp-v1.2.3.apk            # Generated APK
├── bundletool-all-1.18.1.jar   # Downloaded tool
└── chatreal-release.keystore    # Created keystore
```

### Build Mode

Creates organized build folder on desktop:

```
~/Desktop/build/
├── bundletool-all-1.18.1.jar   # Downloaded once, reused
├── release.keystore             # Auto-generated keystore
├── myapp.apk                    # Your signed APKs
├── release.apk                  # Multiple APKs supported
└── debug.apk                    # All in one place
```

## 🔧 Prerequisites

- **Node.js** 12.0.0 or higher
- **Java Runtime Environment (JRE)** 8+ for BundleTool and keystore operations
- **Android App Bundle (.aab)** file

### Installing Java (if needed)

**Ubuntu/Debian:**

```bash
sudo apt update && sudo apt install openjdk-11-jdk
```

**macOS:**

```bash
brew install openjdk@11
```

**Windows:**
Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or use [OpenJDK](https://openjdk.org/)

## 🎯 Advanced Usage

### React Native Integration

```bash
# Build your React Native app
cd android && ./gradlew bundleRelease

# Convert to APK
cd app/build/outputs/bundle/release
generate-apk build app-release.aab --name=MyApp-v1.0.0.apk
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Convert AAB to APK
  run: |
    npm install -g generate-apk
    generate-apk build app/build/outputs/bundle/release/app-release.aab --name=release.apk
```

### Package.json Scripts

```json
{
  "scripts": {
    "build-apk": "generate-apk build android/app/build/outputs/bundle/release/app-release.aab --name=myapp.apk",
    "build-apk-interactive": "generate-apk"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**"No .aab files found"**

- Ensure you're in the correct directory
- Check that your file has the `.aab` extension
- Use direct file path: `generate-apk my-app.aab`

**"java: command not found"**

- Install Java JDK/JRE 8 or higher
- Ensure `java` and `keytool` are in your system PATH
- Test with: `java -version` and `keytool -help`

**"keytool: command not found"**

- Install Java JDK (not just JRE)
- On some systems: `sudo apt install openjdk-11-jdk`

**Permission denied (Linux/macOS)**

- Run: `chmod +x ./bin/generate-apk.js`
- Or install globally: `npm install -g generate-apk`

**PowerShell errors (Windows)**

- Ensure PowerShell execution policy allows scripts
- Run PowerShell as administrator if needed

### Debug Information

The tool provides detailed feedback at each step:

- ✅ Success indicators
- 📥 Download progress
- 🔧 Build process status
- ⚠️ Warning messages
- ❌ Clear error descriptions

## 🔄 Version History

- **v1.1.0**: Added build mode, cross-platform unzip, automatic keystore creation
- **v1.0.0**: Initial release with interactive mode

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google BundleTool** - The official tool for Android App Bundle operations
- **Android Developer Community** - For feedback and feature requests
- **Node.js Community** - For the excellent ecosystem

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/shauryag2002/generate-apk/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/shauryag2002/generate-apk/discussions)
- 📧 **Email**: guptashaurya2002@gmail.com

---

<div align="center">

**⭐ If this tool helped you, please give it a star on GitHub! ⭐**

Made with ❤️ by [Shaurya Gupta](https://github.com/shauryag2002)

</div>
