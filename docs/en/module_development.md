# AMMF2 Module Development Guide

## 📚 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Development with AMMF2-overlay](#quick-development-with-ammf2-overlay)
- [Development with AMMF2 Framework](#development-with-ammf2-framework)
- [Best Practices](#best-practices)
- [FAQ](#faq)

## Prerequisites

Before starting development, make sure you understand:

- Basic structure and working principles of Magisk modules
- Shell script programming basics
- [AMMF Script Development](script.md)
- Git basic operations

## Quick Development with AMMF2-overlay

AMMF2-overlay is a rapid module development tool based on the AMMF2 framework that simplifies the development process.

### 1. Clone the Overlay Repository

```bash
git clone https://github.com/Aurora-Nasa-1/AMMF2-overlay.git
cd AMMF2-overlay
```

### 2. Development Process

1. Modify configuration files
2. Regular Magisk module development process
3. Customize WebUI (optional)
4. Commit code and create tags
5. Wait for GitHub Action to build automatically

## Best Practices

### Error Handling

- Always check for errors and provide meaningful error messages
- Use `Aurora_abort` for critical errors
- Use the logging system to record error details

### File Paths

- Use absolute paths with variables, such as `$MODPATH`
- Create temporary files in `$TMP_FOLDER`
- Check file existence before accessing

### User Interaction

- Provide clear instructions when requesting user input
- Use appropriate functions based on script type
- Log user choices to the log file

### Logging

- Set unique log file names for each script
- Use appropriate log levels (error, warn, info, debug)
- Use `flush_log` after critical operations to ensure logs are written

## Development with AMMF2 Framework

### 1. Get the Framework

```bash
# Method 1: Clone using Git
git clone https://github.com/Aurora-Nasa-1/AMMF2.git
cd AMMF2

# Method 2: Download ZIP archive
# Visit https://github.com/Aurora-Nasa-1/AMMF2/archive/refs/heads/main.zip
```

### 2. Configure Module Information

Edit `module_settings/config.sh` file and set the following basic information:

```bash
action_id="Module_ID"
action_name="Module Name"
action_author="Module Author"
action_description="Module Description"
# Github repository
Github_update_repo="your_name/your_repo"
updateJson="XXXX/update.json"
```

### 3. Develop Custom Scripts

Create your custom scripts in the `files/scripts/` directory:

- `install_custom_script.sh`: Script executed during installation
- `service_script.sh`: Background service script

### 4. Develop WebUI (Optional)

If you need a WebUI interface, create new page modules in the `webroot/pages/` directory.

### 5. Building the Module (with RMM)

This project now uses RootManageModuleModel (RMM) for managing and building the module.

**Prerequisites for Local Builds:**

1.  **Android NDK:** Ensure you have the Android NDK installed and the `ANDROID_NDK_HOME` environment variable is set to its location.
2.  **uv (Python Packager):** Install `uv` by running: `curl -LsSf https://astral.sh/uv/install.sh | sh`. Ensure `$HOME/.cargo/bin` is in your PATH.
3.  **RMM (pyrmm CLI):** Install RMM using uv: `uv tool install pyrmm`. Ensure `$HOME/.local/bin` is in your PATH.

**Build Command:**

Once prerequisites are met, you can build the module by navigating to the project root and running:
`rmm build`

This command utilizes the `custom_rmm_build.sh` script defined in `rmmproject.toml` to perform all necessary build steps, including C++ compilation and packaging.

**Automated Builds:**

Builds are also handled automatically via GitHub Actions workflows, which use the same RMM setup.

**Deprecated Build Scripts:**

The old build scripts (`build.sh`, `build_for_GITHUBACTION.sh`) are now deprecated and should no longer be used for building the module. Their functionality has been integrated into the RMM build process via `custom_rmm_build.sh`. It is recommended to remove them from your local repository.

## FAQ

### Q: How to debug modules?

A: Use AMMF2's logging system, check log files in the `/data/adb/modules/your_module_id/logs/` directory.

### Q: How to handle compatibility with different Android versions?

A: Use AMMF2's environment detection functions and write conditional logic for different versions.

### Q: How to add new settings options?

A: Add new settings in `module_settings/settings.json` and implement corresponding control interfaces in WebUI.

---

## Additional Resources

- [AMMF2 GitHub Repository](https://github.com/Aurora-Nasa-1/AMMF2)
- [Magisk Official Documentation](https://topjohnwu.github.io/Magisk/)
- [Shell Scripting Guide](https://github.com/dylanaraps/pure-bash-bible)

For questions or suggestions, please submit issues on GitHub or contact the development team.