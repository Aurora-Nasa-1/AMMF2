#!/bin/bash

# 全局变量定义
restart_ovo=0
IS_WINDOWS=0
[[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]] && IS_WINDOWS=1
readonly IS_WINDOWS

# 获取CPU核心数
get_cpu_cores() {
    local cores=4
    if [ $IS_WINDOWS -eq 1 ]; then
        cores=$(powershell.exe -NoProfile -NonInteractive -Command "Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty NumberOfLogicalProcessors" 2>/dev/null || echo 4)
    elif command -v nproc >/dev/null 2>&1; then
        cores=$(nproc 2>/dev/null || echo 4)
    elif [ -f /proc/cpuinfo ]; then
        cores=$(grep -c ^processor /proc/cpuinfo 2>/dev/null || echo 4)
    fi
    echo "$cores"
}

declare -r PARALLEL_JOBS=$(get_cpu_cores)
ORIGINAL_DIR=$(pwd)
TEMP_BUILD_DIR=""
TEMP_NDK_DIR=""
USE_BUSYBOX=0

# 日志函数
log_info() { echo "[INFO] $1"; }
log_error() { echo "[ERROR] $1" >&2; }
log_warn() { echo "[WARN] $1"; }

# 清理函数
cleanup() {
    [ -n "$TEMP_BUILD_DIR" ] && rm -rf "$TEMP_BUILD_DIR"
    [ -n "$TEMP_NDK_DIR" ] && rm -rf "$TEMP_NDK_DIR"
}

# 错误处理
handle_error() {
    log_error "$1"
    cleanup
    sleep 6
    exit 1
}

# 工具检查和安装
# 检查 busybox
check_busybox() {
    if command -v busybox &>/dev/null; then
        log_info "Found busybox, using it for basic tools"
        USE_BUSYBOX=1
        log_info "Please run this script again after installation."
        exit 1
    fi
    return 1
}

# 修改工具检查函数
check_and_install_tools() {
    # 首先尝试使用 busybox
    if ! check_busybox; then
        local tools=(unzip git cp find sed trap)
        [ $IS_WINDOWS -eq 1 ] || tools+=(wget)
        for tool in "${tools[@]}"; do
            if ! command -v $tool &>/dev/null; then
                if [ $IS_WINDOWS -eq 1 ]; then
                    install_windows_tool "$tool"
                else
                    install_unix_tool "$tool"
                fi
            fi
        done
    fi
}

install_windows_tool() {
    local tool=$1
    log_info "Installing $tool on Windows..."

    # 首先尝试使用 winget
    if command -v winget &>/dev/null; then
        case $tool in
        unzip) winget install -e --id GnuWin32.UnZip && return ;;
        git) winget install -e --id Git.Git && return ;;
        cp | find | sed) winget install -e --id GnuWin32.CoreUtils && return ;;
        esac
    fi

    # 如果 winget 失败，使用 PowerShell
    local temp_dir=$(mktemp -d)
    local temp_dir_win=$(cygpath -w "$temp_dir" | sed 's/\\/\\\\/g')

    case $tool in
    unzip)
        powershell.exe -Command "\$ProgressPreference='SilentlyContinue'; 
                Invoke-WebRequest -Uri 'https://downloads.sourceforge.net/gnuwin32/unzip-5.51-1-bin.zip' \
                -OutFile '${temp_dir_win}\\unzip.zip'; 
                Expand-Archive '${temp_dir_win}\\unzip.zip' '${temp_dir_win}\\unzip'"
        ;;
    git)
        powershell.exe -Command "\$ProgressPreference='SilentlyContinue';
                Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' \
                -OutFile '${temp_dir_win}\\git.exe';
                Start-Process -Wait '${temp_dir_win}\\git.exe' -ArgumentList '/VERYSILENT','/NORESTART'"
        ;;
    cp | find | sed)
        powershell.exe -Command "\$ProgressPreference='SilentlyContinue';
                Invoke-WebRequest -Uri 'https://downloads.sourceforge.net/gnuwin32/coreutils-5.3.0-bin.zip' \
                -OutFile '${temp_dir_win}\\coreutils.zip';
                Expand-Archive '${temp_dir_win}\\coreutils.zip' '${temp_dir_win}\\coreutils'"
        ;;
    esac

    rm -rf "$temp_dir"
}

install_unix_tool() {
    local tool=$1
    if command -v apt-get &>/dev/null; then
        sudo apt-get install -y "$tool"
    elif command -v brew &>/dev/null; then
        brew install "$tool"
    elif command -v yum &>/dev/null; then
        sudo yum install -y "$tool"
    else
        handle_error "Unable to install $tool. Please install manually."
    fi
}

check_ndk() {
    # 首先检查环境变量
    if [ -n "$ANDROID_NDK_HOME" ] && [ -d "$ANDROID_NDK_HOME" ]; then
        local platform=$([ $IS_WINDOWS -eq 1 ] && echo "windows" || echo "linux")
        local test_tool="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/${platform}-x86_64/bin/aarch64-linux-android21-clang++"
        [ -f "$test_tool" ] && return 0
    fi

    # 检查常见安装路径
    local common_paths=(
        "$HOME/android-ndk-r27c"
        "$LOCALAPPDATA/Android/Sdk/ndk/27.2.8937393"
        "/c/Users/$USER/AppData/Local/Android/Sdk/ndk/27.2.8937393"
    )

    for path in "${common_paths[@]}"; do
        if [ -d "$path" ]; then
            export ANDROID_NDK_HOME="$path"
            return 0
        fi
    done

    return 1
}

setup_ndk() {
    if check_ndk; then
        return 0
    fi

    log_warn "Android NDK not found. Please choose an option:"
    echo "1) Install NDK automatically"
    echo "2) Enter NDK path manually"
    echo "3) Cancel"
    read -r choice

    case $choice in
    1)
        install_ndk
        ;;
    2)
        if [ $IS_WINDOWS -eq 1 ]; then
            log_info "Windows: /c/folder/ or /d/folder/"
            log_info "Please enter NDK path:"
        else
            log_info "Please enter NDK path:"
        fi
        read -r ndk_path
        if [ -d "$ndk_path" ]; then
            export ANDROID_NDK_HOME="$ndk_path"
            if [ $IS_WINDOWS -eq 1 ]; then
                # 添加到 Windows 系统环境变量
                local win_path=$(convert_path "$ndk_path")
                powershell.exe -NoProfile -NonInteractive -Command "
                    [System.Environment]::SetEnvironmentVariable(
                        'ANDROID_NDK_HOME',
                        '$win_path',
                        [System.EnvironmentVariableTarget]::User
                    )
                    \$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'User')
                    if (-not \$env:Path.Contains('$win_path')) {
                        [System.Environment]::SetEnvironmentVariable(
                            'Path',
                            \$env:Path + ';$win_path',
                            [System.EnvironmentVariableTarget]::User
                        )
                    }
                "
            else
                # 添加到 .bashrc
                echo "export ANDROID_NDK_HOME=\"$ndk_path\"" >>~/.bashrc
                echo "export PATH=\"\$ANDROID_NDK_HOME:\$PATH\"" >>~/.bashrc
            fi
            check_ndk || handle_error "Invalid NDK path"
        else
            handle_error "Invalid NDK path: directory does not exist"
        fi
        ;;
    3)
        return 1
        ;;
    *)
        handle_error "Invalid choice"
        ;;
    esac
}

# 优化解压函数
extract_archive() {
    local archive=$1
    local dest=$2

    if [ $USE_BUSYBOX -eq 1 ]; then
        busybox unzip -q "$archive" -d "$dest"
    elif command -v 7z &>/dev/null; then
        7z x -y -o"$dest" "$archive" >/dev/null
    else
        unzip -q -o "$archive" -d "$dest"
    fi
}

# 修改路径转换函数
convert_path() {
    if [ $IS_WINDOWS -eq 1 ]; then
        cygpath -w "$1"
    else
        echo "$1"
    fi
}

# 修改 NDK 安装函数中的相关部分
install_ndk() {
    TEMP_NDK_DIR=$(mktemp -d)
    local ndk_platform
    local ndk_suffix

    if [ $IS_WINDOWS -eq 1 ]; then
        ndk_platform="windows"
        ndk_suffix="zip"
    else
        ndk_platform="linux"
        ndk_suffix="tar.gz"
    fi

    local ndk_url="https://dl.google.com/android/repository/android-ndk-r27c-${ndk_platform}.${ndk_suffix}"
    local ndk_archive="$TEMP_NDK_DIR/ndk.${ndk_suffix}"

    log_info "Downloading NDK for ${ndk_platform}..."
    if [ $IS_WINDOWS -eq 1 ]; then
        powershell.exe -NoProfile -NonInteractive -Command "
            \$ProgressPreference='SilentlyContinue'
            Invoke-WebRequest -Uri '${ndk_url}' -OutFile '$(convert_path "$ndk_archive")' -UseBasicParsing
        "
    else
        wget -q "$ndk_url" -O "$ndk_archive"
    fi

    log_info "Extracting NDK..."
    if [ $IS_WINDOWS -eq 1 ]; then
        extract_archive "$ndk_archive" "$TEMP_NDK_DIR"
    else
        tar xf "$ndk_archive" -C "$TEMP_NDK_DIR"
    fi

    log_info "Choose installation type:"
    echo "1) Install to default location"
    echo "2) Install to custom location"
    echo "3) Use temporary location"
    read -r install_type

    case $install_type in
    1)
        local install_dir="/c/$USER/android-ndk-r27c"
        [ $IS_WINDOWS -eq 1 ] || install_dir="$HOME/android-ndk-r27c"
        ;;
    2)
        if [ $IS_WINDOWS -eq 1 ]; then
            log_info "Windows: /c/folder/ or /d/folder/"
            log_info "Please enter installation path: ([Input Path]/android-ndk-r27c)"
        else
            log_info "Please enter installation path: ([Input Path]/android-ndk-r27c)"
        fi
        read -r custom_path
        if [ ! -d "$custom_path" ]; then
            log_info "Directory does not exist. Create it? [Y/n]"
            read -r create_dir
            if [[ "$create_dir" =~ ^[Yy]$ ]] || [[ -z "$create_dir" ]]; then
                mkdir -p "$custom_path" || handle_error "Failed to create directory"
            else
                handle_error "Installation cancelled"
            fi
        fi
        install_dir="$custom_path/android-ndk-r27c"
        ;;
    3)
        export ANDROID_NDK_HOME="$TEMP_NDK_DIR/android-ndk-r27c"
        return 0
        ;;
    *)
        handle_error "Invalid choice"
        ;;
    esac
    log_info "Installing NDK to $install_dir..."
    if [ "$install_type" != "3" ]; then
        mv "$TEMP_NDK_DIR/android-ndk-r27c" "$install_dir" || handle_error "Failed to move NDK"

        if [ $IS_WINDOWS -eq 1 ]; then
            # Windows下设置永久环境变量
            local win_path=$(convert_path "$install_dir")
            powershell.exe -NoProfile -NonInteractive -Command "
                [System.Environment]::SetEnvironmentVariable(
                    'ANDROID_NDK_HOME',
                    '$win_path',
                    [System.EnvironmentVariableTarget]::User
                )
                \$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'User')
                if (-not \$env:Path.Contains('$win_path')) {
                    [System.Environment]::SetEnvironmentVariable(
                        'Path',
                        \$env:Path + ';$win_path',
                        [System.EnvironmentVariableTarget]::User
                    )
                }
            "
            log_info "NDK installed to: $win_path"
            log_info "Environment variables added to Windows User Environment"
            restart_ovo=1
        else
            # Unix系统下设置环境变量
            local shell_rc="$HOME/.bashrc"
            [ -f "$HOME/.zshrc" ] && shell_rc="$HOME/.zshrc"
            {
                echo "export ANDROID_NDK_HOME=\"$install_dir\""
                echo "export PATH=\"\$ANDROID_NDK_HOME:\$PATH\""
            } >>"$shell_rc"
            log_info "NDK installed to: $install_dir"
            log_info "Environment variables added to: $shell_rc"
            restart_ovo=1
        fi

        export ANDROID_NDK_HOME="$install_dir"
    fi

    check_ndk || handle_error "NDK installation failed"
}

# 修改打包函数
package_module() {
    local version=$1
    local output_file="${action_name}_${version}.zip"
    log_info "Packaging module..."
    if [ $IS_WINDOWS -eq 1 ]; then
        # 使用 PowerShell 的改进版本
        powershell.exe -NoProfile -NonInteractive -Command "
            \$ProgressPreference='SilentlyContinue'
            \$exclude = @(
                '.git*',
                'requirements.txt',
                'build.sh'
            )
            \$items = Get-ChildItem -Exclude \$exclude
            Compress-Archive -Path \$items -DestinationPath '$(convert_path "$output_file")' -CompressionLevel Optimal -Force
        " || handle_error "Failed to create zip file"
    else
        zip -r -9 "$output_file" . -x "*.git*" -x "build.sh" -x "requirements.txt" || handle_error "Failed to create zip file"
    fi

    cp "$output_file" "$ORIGINAL_DIR/" || handle_error "Failed to copy zip file"
}

# 编译函数
compile_binaries() {
    local prebuilt_path="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/$([ $IS_WINDOWS -eq 1 ] && echo 'windows' || echo 'linux')-x86_64/bin"
    local targets=(aarch64 x86_64)
    local sources=(filewatch logmonitor)

    mkdir -p bin

    # 使用并行编译
    local pids=()
    for source in "${sources[@]}"; do
        for target in "${targets[@]}"; do
            (
                log_info "Compiling $source for $target..."
                local output="bin/$source-$target"
                local cpp_file="src/$source.cpp"

                $prebuilt_path/${target}-linux-android21-clang++ \
                    -O2 -Wall -Wextra -std=c++11 -static-libstdc++ \
                    -o "$output" "$cpp_file" || exit 1

                $prebuilt_path/llvm-strip "$output" || log_warn "Failed to strip $output"
            ) &
            pids+=($!)

            # 控制并行数量
            if [ ${#pids[@]} -ge $PARALLEL_JOBS ]; then
                wait "${pids[0]}"
                pids=("${pids[@]:1}")
            fi
        done
    done

    # 等待所有编译完成
    wait || handle_error "Compilation failed"
}

# 主函数
main() {
    trap cleanup EXIT
    check_and_install_tools
    setup_ndk || handle_error "NDK setup failed"

    TEMP_BUILD_DIR=$(mktemp -d)
    cp -r . "$TEMP_BUILD_DIR" || handle_error "Failed to copy files"
    cd "$TEMP_BUILD_DIR" || handle_error "Failed to change directory"

    # 获取版本信息
    local version
    version=$(git describe --tags $(git rev-list --tags --max-count=1))
    if [[ "$version" != "v"* ]]; then
        log_info "Please input version:"
        read -r version
    fi
    . ./module_settings/config.sh
    log_info "Building module: ${action_name} settings from module_settings/config.sh"
    {
        echo "id=${action_id}"
        echo "name=${action_name}"
        echo "version=${version}"
        echo "versionCode=$(date +'%Y%m%d')"
        echo "author=${action_author}"
        echo "description=${action_description}"
    } >module.prop

    # 替换标识符
    find files webroot -type f -name "*.sh" -o -name "*.js" -exec sed -i "s/AMMF/${action_id}/g" {} +
    find src -name "*.cpp" -exec sed -i "s/AMMF2/${action_id}/g" {} +
    sed -i "s/AMMF/${action_id}/g" webroot/index.html
    compile_binaries
    rm -rf src
    package_module "$version"
    log_info "Build completed successfully!"
    if [ "$restart_ovo" -eq 1 ]; then
        if [ $IS_WINDOWS -eq 1 ]; then
            log_info "Windows requires a full system restart to apply Android NDK environment variables"
        else
            log_info "Please restart your terminal to apply Android NDK environment variables"
        fi
    fi
}

main "$@"
