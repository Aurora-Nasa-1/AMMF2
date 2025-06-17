#!/bin/bash

# --- Attempt File Organization ---
# Create native directory or use current directory as fallback
if mkdir -p native; then
    NATIVE_DIR="native"
    echo "[INFO] Using native/ directory for C++ sources."
else
    NATIVE_DIR="."
    echo "[WARN] Failed to create native/ directory. C++ sources will be expected in ./src/ or ./"
fi

# Create module directory or use current directory as fallback
if mkdir -p module; then
    MODULE_DIR="module"
    MODULE_PATH_PREFIX="module/"
    echo "[INFO] Using module/ directory for module components."
else
    MODULE_DIR="."
    MODULE_PATH_PREFIX=""
    echo "[WARN] Failed to create module/ directory. Module components will be expected at the root."
fi

# Copy C++ sources
if [ -d "src" ]; then
    if [ "$NATIVE_DIR" == "native" ]; then
        cp src/filewatch.cpp native/filewatch.cpp 2>/dev/null || echo "[WARN] Could not copy src/filewatch.cpp to native/"
        cp src/logmonitor.cpp native/logmonitor.cpp 2>/dev/null || echo "[WARN] Could not copy src/logmonitor.cpp to native/"
    else # Fallback: if native dir failed, try to ensure they are at root if src/ exists
        cp src/filewatch.cpp ./filewatch.cpp 2>/dev/null || echo "[WARN] Could not copy src/filewatch.cpp to ./"
        cp src/logmonitor.cpp ./logmonitor.cpp 2>/dev/null || echo "[WARN] Could not copy src/logmonitor.cpp to ./"
    fi
else
    echo "[INFO] src/ directory not found, assuming C++ sources are already in $NATIVE_DIR or at root."
fi


# Copy other module files
if [ "$MODULE_DIR" == "module" ]; then
    cp -r files module/files 2>/dev/null || echo "[WARN] Could not copy files/ to module/"
    cp -r webroot module/webroot 2>/dev/null || echo "[WARN] Could not copy webroot/ to module/"
    cp service.sh module/service.sh 2>/dev/null || echo "[WARN] Could not copy service.sh to module/"
    # The original customize.sh for the project, renamed earlier
    cp customize.project.sh module/customize.project.sh 2>/dev/null || echo "[WARN] Could not copy customize.project.sh to module/"
    cp -r module_settings module/module_settings 2>/dev/null || echo "[WARN] Could not copy module_settings/ to module/"
else
    echo "[INFO] Not moving module components as module/ directory creation failed or was skipped."
fi

# --- Source build_config.sh ---
CONFIG_BUILD_CONFIG_PATH="${MODULE_PATH_PREFIX}module_settings/build_config.sh"
if [ -f "$CONFIG_BUILD_CONFIG_PATH" ]; then
    # shellcheck source=module_settings/build_config.sh
    source "$CONFIG_BUILD_CONFIG_PATH"
    echo "[INFO] Sourced $CONFIG_BUILD_CONFIG_PATH"
elif [ -f "module_settings/build_config.sh" ]; then # Fallback if module_settings wasn't moved
    # shellcheck source=module_settings/build_config.sh
    source "module_settings/build_config.sh"
    echo "[INFO] Sourced module_settings/build_config.sh (fallback path)"
else
    echo "[ERROR] build_config.sh not found!"
    exit 1
fi

# --- module.prop Generation ---
# Use LATEST_TAG placeholder or a default for version
MODULE_VERSION="0.1" # Placeholder for LATEST_TAG
CURRENT_VERSION_CODE=$(date +'%Y%m%d')

MODULE_PROP_PATH="${MODULE_PATH_PREFIX}module.prop"

echo "[INFO] Generating $MODULE_PROP_PATH..."
{
    echo "id=${action_id}"
    echo "name=${action_name}"
    echo "version=${MODULE_VERSION}"
    echo "versionCode=${CURRENT_VERSION_CODE}"
    echo "author=${action_author}"
    echo "description=${action_description}"
    echo "updateJson=https://github.com/${Github_update_repo}/releases/latest/download/update.json" # Construct from Github_update_repo
    echo "minMagisk=${magisk_min_version}"
    echo "minKernelSU=${ksu_min_version}"
    echo "minAPatch=${apatch_min_version}"
} > "$MODULE_PROP_PATH"
echo "[INFO] $MODULE_PROP_PATH generated."

# --- Placeholder Replacements (sed commands) ---
echo "[INFO] Applying sed replacements..."
CURRENT_TIME_SED=$(date +'%Y%m%d') # For the specific 20240503 replacement

WEBROOT_SED_PATH="${MODULE_PATH_PREFIX}webroot"
FILES_SED_PATH="${MODULE_PATH_PREFIX}files"
NATIVE_SED_PATH_CPP="${NATIVE_DIR}"

[ ! -d "$WEBROOT_SED_PATH" ] && WEBROOT_SED_PATH="webroot"
[ ! -d "$FILES_SED_PATH" ] && FILES_SED_PATH="files"

if [ -d "$WEBROOT_SED_PATH/pages" ]; then
    find "$WEBROOT_SED_PATH/pages" -name "status.js" -exec sed -i "s/20240503/${CURRENT_TIME_SED}/g" {} \;
    find "$WEBROOT_SED_PATH/pages" -name "status.js" -exec sed -i "s#Aurora-Nasa-1/AMMF#${Github_update_repo}#g" {} \;
else
    echo "[WARN] $WEBROOT_SED_PATH/pages not found for status.js sed."
fi

if [ -d "$FILES_SED_PATH" ]; then
    find "$FILES_SED_PATH" -name "*.sh" -exec sed -i "s/AMMF/${action_id}/g" {} \;
else
    echo "[WARN] $FILES_SED_PATH not found for .sh sed."
fi

if [ -d "$WEBROOT_SED_PATH" ]; then
    find "$WEBROOT_SED_PATH" -name "*.js" -exec sed -i "s/AMMF/${action_id}/g" {} \;
    sed -i "s/AMMF/${action_id}/g" "$WEBROOT_SED_PATH/index.html" 2>/dev/null || echo "[WARN] $WEBROOT_SED_PATH/index.html not found for sed."
else
    echo "[WARN] $WEBROOT_SED_PATH not found for .js and index.html sed."
fi

if [ -d "$WEBROOT_SED_PATH/translations" ]; then
    find "$WEBROOT_SED_PATH/translations" -name "*.json" -exec sed -i "s/AMMF/${action_name}/g" {} \;
else
    echo "[WARN] $WEBROOT_SED_PATH/translations not found for .json sed."
fi

CPP_TARGET_LOCATIONS=()
[ -f "${NATIVE_SED_PATH_CPP}/filewatch.cpp" ] && CPP_TARGET_LOCATIONS+=("${NATIVE_SED_PATH_CPP}/filewatch.cpp")
[ -f "${NATIVE_SED_PATH_CPP}/logmonitor.cpp" ] && CPP_TARGET_LOCATIONS+=("${NATIVE_SED_PATH_CPP}/logmonitor.cpp")
[ "$NATIVE_DIR" == "." ] && [ -f "src/filewatch.cpp" ] && CPP_TARGET_LOCATIONS+=("src/filewatch.cpp")
[ "$NATIVE_DIR" == "." ] && [ -f "src/logmonitor.cpp" ] && CPP_TARGET_LOCATIONS+=("src/logmonitor.cpp")

if [ ${#CPP_TARGET_LOCATIONS[@]} -gt 0 ]; then
    for cpp_file in "${CPP_TARGET_LOCATIONS[@]}"; do
        sed -i "s/AMMF2/${action_id}/g" "$cpp_file"
    done
else
    echo "[WARN] No .cpp files found in expected locations ($NATIVE_SED_PATH_CPP or ./src) for sed."
fi
echo "[INFO] Sed replacements attempted."

# --- C++ Compilation ---
echo "[INFO] Starting C++ compilation..."
if [ -z "$ANDROID_NDK_HOME" ]; then
    echo "[ERROR] ANDROID_NDK_HOME is not set. Cannot compile C++ sources."
else
    PREBUILT_PATH="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/$(uname -s | tr '[:upper:]' '[:lower:]')-x86_64/bin"
    # Adjust for potential windows git bash uname output (MINGW or MSYS)
    if [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* ]]; then
        PREBUILT_PATH="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/windows-x86_64/bin"
    fi

    if [ ! -d "$PREBUILT_PATH" ]; then
        echo "[ERROR] NDK prebuilt path not found: $PREBUILT_PATH. Checked ANDROID_NDK_HOME: $ANDROID_NDK_HOME"
    else
        TARGETS=(aarch64 x86_64)
        SOURCES=(filewatch logmonitor) # Base names

        export CFLAGS="-O3 -flto"
        export CXXFLAGS="-O3 -flto -std=c++20"

        # Preferred output directory for binaries
        COMPILED_BIN_DIR_PREFERRED="${MODULE_PATH_PREFIX}system/bin"
        # Fallback output directory
        COMPILED_BIN_DIR_FALLBACK="bin"

        FINAL_BIN_DIR=""

        if mkdir -p "$COMPILED_BIN_DIR_PREFERRED"; then
            FINAL_BIN_DIR="$COMPILED_BIN_DIR_PREFERRED"
            echo "[INFO] Compiled binaries will be placed in $FINAL_BIN_DIR"
        elif mkdir -p "$COMPILED_BIN_DIR_FALLBACK"; then
            FINAL_BIN_DIR="$COMPILED_BIN_DIR_FALLBACK"
            echo "[WARN] Failed to create $COMPILED_BIN_DIR_PREFERRED. Using fallback $FINAL_BIN_DIR"
        else
            echo "[ERROR] Failed to create any binary output directory. Compilation aborted."
        fi

        if [ -n "$FINAL_BIN_DIR" ]; then
            for source_base in "${SOURCES[@]}"; do
                for target_arch in "${TARGETS[@]}"; do
                    echo "[INFO] Compiling $source_base for $target_arch..."

                    SOURCE_FILE_PATH=""
                    if [ -f "${NATIVE_DIR}/${source_base}.cpp" ]; then
                        SOURCE_FILE_PATH="${NATIVE_DIR}/${source_base}.cpp"
                    elif [ "$NATIVE_DIR" == "." ] && [ -f "src/${source_base}.cpp" ]; then # Check original src if native failed and src exists
                        SOURCE_FILE_PATH="src/${source_base}.cpp"
                    elif [ -f "./${source_base}.cpp" ]; # Check root if native failed and src also not there
                        SOURCE_FILE_PATH="./${source_base}.cpp"
                    else
                        echo "[ERROR] Source file $source_base.cpp not found in ${NATIVE_DIR}/, ./src/, or ./"
                        continue # Skip to next iteration
                    fi

                    OUTPUT_BINARY="${FINAL_BIN_DIR}/${action_id}_${source_base}-${target_arch}"

                    echo "[INFO] Compiler: $PREBUILT_PATH/${target_arch}-linux-android21-clang++"
                    echo "[INFO] Source: $SOURCE_FILE_PATH, Output: $OUTPUT_BINARY"
                    echo "[INFO] CXXFLAGS: $CXXFLAGS"
                    # Broader include paths: native/, src/ (if exists), and root
                    INCLUDE_PATHS="-I${NATIVE_DIR} -I. "
                    [ -d "src" ] && INCLUDE_PATHS+="-Isrc "


                    "$PREBUILT_PATH/${target_arch}-linux-android21-clang++" \
                        $CXXFLAGS -Wall -Wextra -static-libstdc++ \
                        $INCLUDE_PATHS \
                        -o "$OUTPUT_BINARY" "$SOURCE_FILE_PATH" || {
                            echo "[ERROR] Compilation FAILED for $source_base - $target_arch";
                            continue; # Skip to next iteration
                        }

                    "$PREBUILT_PATH/llvm-strip" "$OUTPUT_BINARY" || echo "[WARN] Failed to strip $OUTPUT_BINARY"
                    echo "[INFO] Successfully compiled and stripped $OUTPUT_BINARY"
                done
            done
        fi
    fi
fi
echo "[INFO] C++ compilation phase finished."

# --- Call RMM Build ---
echo "[INFO] Calling rmm build..."
# Ensure rmm is in PATH if not already inherited
export PATH="\$HOME/.local/bin:\$PATH"
rmm build

echo "[INFO] Custom RMM build script finished."
