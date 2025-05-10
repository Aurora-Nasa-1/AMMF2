#!/system/bin/sh
# shellcheck disable=SC2034
# shellcheck disable=SC2154
# shellcheck disable=SC3043
# shellcheck disable=SC2155
# shellcheck disable=SC2046
# shellcheck disable=SC3045

# 初始化日志目录
LOG_DIR="$MODPATH/logs"
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
    arm|x86)
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
    if [ "$ARCH" = "arm64" ]; then
        rm -f "$MODPATH/bin/filewatch-${MODID}-x86_64"
        mv "$MODPATH/bin/filewatch-${MODID}-aarch64" "$MODPATH/bin/filewatch-${MODID}"
        log_info "Architecture: arm64, using aarch64 binary"
    fi
    if [ "$ARCH" = "x64" ]; then
        rm -f "$MODPATH/bin/filewatch-${MODID}-aarch64"
        mv "$MODPATH/bin/filewatch-${MODID}-x86_64" "$MODPATH/bin/filewatch-${MODID}"
        log_info "Architecture: x64, using x86_64 binary"
    fi

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
