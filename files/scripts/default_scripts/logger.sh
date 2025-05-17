#!/system/bin/sh
# 高性能日志系统 - 与C++日志组件集成
# 版本: 2.2.1

# ============================
# Global Variables
# ============================
LOGGER_VERSION="2.2.1"
LOGGER_INITIALIZED=0
LOG_FILE_NAME="main"
LOGMONITOR_PID=""
LOGMONITOR_BIN="${MODPATH}/bin/logmonitor-AMMF"
LOG_LEVEL=3  # 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
LOW_POWER_MODE=0  # Default: Low power mode off

# ============================
# Core Functions
# ============================

# Initialize logger system
init_logger() {
    [ "$LOGGER_INITIALIZED" = "1" ] && return 0
    LOG_DIR="${MODPATH}/logs"
    mkdir -p "$LOG_DIR" 2>/dev/null
    if [ -f "$LOGMONITOR_BIN" ]; then
        LOGMONITOR_PID=$(pgrep -f "^$LOGMONITOR_BIN.*daemon" 2>/dev/null)
        if [ -z "$LOGMONITOR_PID" ]; then
            if [ "$LOW_POWER_MODE" = "1" ]; then
                "$LOGMONITOR_BIN" -c daemon -d "$LOG_DIR" -l "$LOG_LEVEL" -p >/dev/null 2>&1 &
            else
                "$LOGMONITOR_BIN" -c daemon -d "$LOG_DIR" -l "$LOG_LEVEL" >/dev/null 2>&1 &
            fi
            LOGMONITOR_PID=$!
            sleep 0.1
        fi
    else
        Aurora_ui_print "$FILE_NOT_FOUND logmonitor" >&2
        return 1
    fi
    LOGGER_INITIALIZED=1
    return 0
}

# Log a message with specified level
log() {
    local level="$1"
    local message="$2"
    [ -z "$level" ] && return 1
    [ -z "$message" ] && return 1
    [ "$level" -gt "$LOG_LEVEL" ] && return 0
    [ "$LOGGER_INITIALIZED" != "1" ] && init_logger
    if [ "$LOW_POWER_MODE" = "1" ]; then
        "$LOGMONITOR_BIN" -c write -n "$LOG_FILE_NAME" -m "$message" -l "$level" -p
    else
        "$LOGMONITOR_BIN" -c write -n "$LOG_FILE_NAME" -m "$message" -l "$level"
    fi
}

log_error() { log 1 "$1"; }
log_warn()  { log 2 "$1"; }
log_info()  { log 3 "$1"; }
log_debug() { log 4 "$1"; }

# Batch log from file
batch_log() {
    local batch_file="$1"
    [ -z "$batch_file" ] && return 1
    [ ! -f "$batch_file" ] && return 1
    [ "$LOGGER_INITIALIZED" != "1" ] && init_logger
    if [ "$LOW_POWER_MODE" = "1" ]; then
        "$LOGMONITOR_BIN" -c batch -n "$LOG_FILE_NAME" -b "$batch_file" -p
    else
        "$LOGMONITOR_BIN" -c batch -n "$LOG_FILE_NAME" -b "$batch_file"
    fi
    return $?
}

# Set log file name
set_log_file() {
    [ -z "$1" ] && return 1
    LOG_FILE_NAME="$1"
    return 0
}

# Set log level
set_log_level() {
    [ -z "$1" ] && return 1
    LOG_LEVEL="$1"
    return 0
}

# Enable/disable low power mode
set_low_power_mode() {
    case "$1" in
        1|true|on) LOW_POWER_MODE=1 ;;
        *) LOW_POWER_MODE=0 ;;
    esac
    if [ "$LOGGER_INITIALIZED" = "1" ]; then
        stop_logger
        init_logger
    fi
    return 0
}

# Flush logs
flush_logs() {
    [ "$LOGGER_INITIALIZED" = "1" ] && "$LOGMONITOR_BIN" -c flush
}

# Clean logs
clean_logs() {
    [ "$LOGGER_INITIALIZED" = "1" ] && "$LOGMONITOR_BIN" -c clean
}

# Stop logger system
stop_logger() {
    if [ "$LOGGER_INITIALIZED" = "1" ] && [ -n "$LOGMONITOR_PID" ]; then
        "$LOGMONITOR_BIN" -c flush
        sleep 0.5
        kill -TERM "$LOGMONITOR_PID" 2>/dev/null
        wait "$LOGMONITOR_PID" 2>/dev/null
        LOGGER_INITIALIZED=0
    fi
}

