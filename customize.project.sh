#!/system/bin/sh
# shellcheck disable=SC2034
# shellcheck disable=SC2154
# shellcheck disable=SC3043
# shellcheck disable=SC2155
# shellcheck disable=SC2046
# shellcheck disable=SC3045
# shellcheck disable=SC1017
# 初始化日志目录
LOG_DIR="$MODPATH/logs"
BIN_DIR="$MODPATH/bin"
mkdir -p "$LOG_DIR"
case "$ARCH" in
arm64)
    rm -f "$MODPATH/bin/logmonitor-${MODID}-x86_64" 2>/dev/null
    mv "$MODPATH/bin/logmonitor-${MODID}-aarch64" "$MODPATH/bin/logmonitor-${MODID}"
    ;;
x64)
    rm -f "$MODPATH/bin/logmonitor-${MODID}-aarch64" 2>/dev/null
    mv "$MODPATH/bin/logmonitor-${MODID}-x86_64" "$MODPATH/bin/logmonitor-${MODID}"
    ;;
arm | x86)
    abort "Unsupported architecture: $ARCH"
    ;;
*)
    abort "Unknown architecture: $ARCH"
    ;;
esac

main() {

    if [ ! -f "$MODPATH/files/scripts/default_scripts/main.sh" ]; then
        abort "Notfound File!!!($MODPATH/files/scripts/default_scripts/main.sh)"
    else
        . "$MODPATH/files/scripts/default_scripts/main.sh"
    fi

    start_script
    set_log_file "install"
    version_check

    # 遍历bin目录中的所有文件
    for file in "$BIN_DIR"/*; do
        if [ -f "$file" ]; then # 检查是否为常规文件
            filename=$(basename "$file")
            
            # 添加调试日志
            log_info "处理文件: $filename"
            
            # 检查是否为arm64架构文件
            if [[ "$filename" == *"-aarch64" ]]; then
                # 这是arm64二进制文件
                if [ "$ARCH" = "arm64" ]; then
                    # 保留arm64二进制文件，重命名它
                    new_filename=${filename%-aarch64}
                    log_info "重命名 $filename 为 $new_filename"
                    mv "$file" "$BIN_DIR/$new_filename"
                else
                    # 如果当前架构不是arm64，则删除arm64二进制文件
                    log_info "删除 $filename (非 $ARCH 架构)"
                    rm -f "$file"
                fi
            # 检查是否为x86_64架构文件
            elif [[ "$filename" == *"-x86_64" ]]; then
                # 这是x86_64二进制文件
                if [ "$ARCH" = "x64" ]; then
                    # 保留x86_64二进制文件，重命名它
                    new_filename=${filename%-x86_64}
                    log_info "重命名 $filename 为 $new_filename"
                    mv "$file" "$BIN_DIR/$new_filename"
                else
                    # 如果当前架构不是x64，则删除x86_64二进制文件
                    log_info "删除 $filename (非 $ARCH 架构)"
                    rm -f "$file"
                fi
            else
                log_info "跳过 $filename (未找到架构后缀)"
            fi
        fi
    done
    if [ ! -f "$MODPATH/files/scripts/install_custom_script.sh" ]; then
        log_error "Notfound File!!!($MODPATH/files/scripts/install_custom_script.sh)"
        abort "Notfound File!!!($MODPATH/files/scripts/install_custom_script.sh)"
    else
        log_info "Loading install_custom_script.sh"
        . "$MODPATH/files/scripts/install_custom_script.sh"
    fi
    chmod -R 755 "$MODPATH/bin/"
}
#######################################################
version_check() {
    if [ -n "$KSU_VER_CODE" ] && [ "$KSU_VER_CODE" -lt "$ksu_min_version" ] || [ "$KSU_KERNEL_VER_CODE" -lt "$ksu_min_kernel_version" ]; then
        Aurora_abort "KernelSU: $ERROR_UNSUPPORTED_VERSION $KSU_VER_CODE ($ERROR_VERSION_NUMBER >= $ksu_min_version or kernelVersionCode >= $ksu_min_kernel_version)" 1
    elif [ -z "$APATCH" ] && [ -z "$KSU" ] && [ -n "$MAGISK_VER_CODE" ] && [ "$MAGISK_VER_CODE" -le "$magisk_min_version" ]; then
        Aurora_abort "Magisk: $ERROR_UNSUPPORTED_VERSION $MAGISK_VER_CODE ($ERROR_VERSION_NUMBER > $magisk_min_version)" 1
    elif [ -n "$APATCH_VER_CODE" ] && [ "$APATCH_VER_CODE" -lt "$apatch_min_version" ]; then
        Aurora_abort "APatch: $ERROR_UNSUPPORTED_VERSION $APATCH_VER_CODE ($ERROR_VERSION_NUMBER >= $apatch_min_version)" 1
    elif [ "$API" -lt "$ANDROID_API" ]; then
        Aurora_abort "Android API: $ERROR_UNSUPPORTED_VERSION $API ($ERROR_VERSION_NUMBER >= $ANDROID_API)" 2
    fi
}
# 保留replace_module_id函数以防某些文件未在构建时替换
replace_module_id() {
    if [ -f "$1" ] && [ -n "$MODID" ]; then
        Aurora_ui_print "Setting $2 ..."
        sed -i "s/AMMF/$MODID/g" "$1"
    fi
}
###############
##########################################################
if [ -n "$MODID" ]; then
    main
fi
Aurora_ui_print "$END"

stop_logger
