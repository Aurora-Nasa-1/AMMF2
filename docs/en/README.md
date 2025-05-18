
# AMMF2 - Aurora Modular Magisk Framework

[简体中文](../README.md) | [English](README.md)

<div align="center">
    <img src="https://img.shields.io/github/commit-activity/w/Aurora-Nasa-1/AMMF2" alt="GitHub Commit Activity">
    <img src="https://img.shields.io/github/license/Aurora-Nasa-1/AMMF2" alt="GitHub License">
</div>

## 📋 Project Overview

AMMF2 (Aurora Modular Magisk Framework 2) is a powerful Magisk module development framework designed to simplify the module development process by providing standardized structures and rich functional components. The framework supports multiple languages, WebUI configuration interface, custom scripts, and other features, making it suitable for various types of Magisk module development.

[Telegram Group](https://t.me/AuroraNasaModule)

## ✨ Key Features

- **Multi-language Support**: Built-in support for Chinese, English, Japanese, Russian, and other languages
- **WebUI Configuration Interface**: Beautiful Material Design-style web configuration interface
- **Custom Script System**: Flexible script system supporting installation-time and runtime scripts
- **File Monitoring Service**: Built-in filewatch tool supporting file change-triggered operations
- **Logging Tools**: Complete logging system with log recording and error handling
- **User Interaction Features**: Various user interaction methods such as menu selection and key detection
- **GitHub Action Support**: Built-in GitHub Action workflows supporting automatic building and publishing
- **Comprehensive Error Handling**: Provides complete error handling and logging mechanisms

## 🚀 Quick Start

### Getting the Framework

```bash
# Method 1: Clone the repository using Git
git clone https://github.com/Aurora-Nasa-1/AMMF2.git
cd AMMF2

# Method 2: Download ZIP archive
# Visit https://github.com/Aurora-Nasa-1/AMMF2/archive/refs/heads/main.zip

# Other methods...
```

### Basic Configuration

**Note: This framework requires GitHub Action for module building**

1. **How to create a new module**:
  [Module Development Guide](module_development.md)

2. **Release Upload Configuration**:
   Action uses `softprops/action-gh-release@v2` to upload Release, needs to be configured in repository settings

3. **Commit or create Tag(v*) to trigger build, Enjoy**

### Build Module

1. **Local Build Module**:  
   Run the `build.sh` script to build the module:  
   ```bash
   ./build.sh
   ```
   
### Custom Script Development
2. **GitHub Action Automatic Build**:
   Trigger the build by committing or pushing a tag (v*).

**To ensure future updatability, it is recommended not to modify service.sh and customize.sh**

1. **Installation Script**:
   Write custom scripts executed during module installation in `files/scripts/install_custom_script.sh`.

2. **Service Script**:
   Write runtime service scripts for the module in `files/scripts/service_script.sh`.

## 📚 More Documentation

- [Directory Structure](directory.md) - Detailed project directory structure description
- [Script Development Guide](script.md) - Script development and function usage instructions
- [WebUI Development Guide](webui.md) - WebUI development and customization instructions

## 🤝 Contribution

Welcome to submit PR or Issue to improve this framework! If you find this project useful, please give it a Star ⭐

## 📄 License

This project is licensed under the MIT LICENSE.

## 🙏 Acknowledgments

[Pure CSS Material 3 Design](https://github.com/jogemu/md3css)
