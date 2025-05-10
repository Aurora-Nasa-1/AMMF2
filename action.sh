#!/system/bin/sh
MODDIR=${0%/*}
MODPATH="$MODDIR"
MODID=$(basename "$MODDIR")
# 初始化日志目录
LOG_DIR="$MODPATH/logs"

if [ ! -f "$MODPATH/files/scripts/default_scripts/main.sh" ]; then
    echo "File not found: $MODPATH/files/scripts/default_scripts/main.sh" >> "$LOG_DIR/error.log"
    exit 1
else
    . "$MODPATH/files/scripts/default_scripts/main.sh"
    # 记录action.sh被调用
    start_script
    set_log_file "action"
fi
# 在这里添加您的自定义脚本逻辑
# -----------------
# This script extends the functionality of the default and setup scripts, allowing direct use of their variables and functions.
# SCRIPT_EN.md

# 定义清理进程函数
stop_logger