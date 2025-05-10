#!/system/bin/sh
# shellcheck disable=SC2034
# shellcheck disable=SC2154
# shellcheck disable=SC3043
# shellcheck disable=SC2155
# shellcheck disable=SC2046
# shellcheck disable=SC3045
start_script() {
    if [ -z "$MODPATH" ]; then
        MODPATH="$1"
    fi
    if [ -z "$NOW_PATH" ]; then
        NOW_PATH="$MODPATH"
        SH_ON_MAGISK=true
    fi

    # 加载日志系统

    if [ -z "$NOW_PATH" ]; then
        MODPATH="$1"
    fi
    if [ -z "$NOW_PATH" ]; then
        NOW_PATH="$MODPATH"
        SH_ON_MAGISK=true
    fi
    TMP_FOLDER="$NOW_PATH/TEMP"
    mkdir -p "$TMP_FOLDER"
    SDCARD="/storage/emulated/0"
    download_destination="/$SDCARD/Download/AMMF/"

    if [ ! -f "$NOW_PATH/module_settings/config.sh" ]; then
        abort "${FILE_NOT_FOUND:-文件未找到}!!!($NOW_PATH/module_settings/config.sh)"
    else
        # shellcheck source=/dev/null
        . "$NOW_PATH/module_settings/config.sh"
    fi
    if [ ! -f "$NOW_PATH/files/languages.sh" ]; then
        abort "${FILE_NOT_FOUND:-文件未找到}!!!($NOW_PATH/files/languages.sh)"
    else
        # shellcheck source=/dev/null
        . "$NOW_PATH/files/languages.sh"
        eval "lang_$print_languages"
    fi
    if [ -f "$NOW_PATH/files/scripts/default_scripts/logger.sh" ]; then
        . "$NOW_PATH/files/scripts/default_scripts/logger.sh"
        # 设置main脚本的日志文件
        set_log_file "main"
        init_logger
        log_info "${SCRIPT_INIT_COMPLETE:-开始执行脚本 - 初始化完成}"
    else
        echo "${LOGGER_NOT_LOADED:-警告: 日志系统未加载}" >&2
    fi
}
key_select() {
    key_pressed=""
    while true; do
        local output=$(/system/bin/getevent -qlc 1)
        local key_event=$(echo "$output" | awk '{ print $3 }' | grep 'KEY_')
        local key_status=$(echo "$output" | awk '{ print $4 }')
        if echo "$key_event" | grep -q 'KEY_' && [ "$key_status" = "DOWN" ]; then
            key_pressed="$key_event"
            break
        fi
    done
    while true; do
        local output=$(/system/bin/getevent -qlc 1)
        local key_event=$(echo "$output" | awk '{ print $3 }' | grep 'KEY_')
        local key_status=$(echo "$output" | awk '{ print $4 }')
        if [ "$key_event" = "$key_pressed" ] && [ "$key_status" = "UP" ]; then
            break
        fi
    done
}
# 修改 Aurora_ui_print 函数
Aurora_ui_print() {
    sleep 0.02
    # 使用日志系统
    log_info "$1"
    echo "[${OUTPUT}] $1"
}

# 修改 Aurora_abort 函数
Aurora_abort() {
    # 使用日志系统
    log_error "$1"
    # 确保日志被写入
    stop_logger
    echo "[${ERROR_TEXT}] $1"
    abort "$ERROR_CODE_TEXT: $2"
}

# 修改 ui_print 函数
ui_print() {
    if [ "$1" = "- Setting permissions" ] ||
        [ "$1" = "- Extracting module files" ] ||
        [ "$1" = "- Current boot slot: $SLOT" ] ||
        [ "$1" = "- Device is system-as-root" ] ||
        [ "$1" = "- Done" ] ||
        [ "$(echo "$1" | grep -c '^ - Mounting ')" -gt 0 ]; then
        return
    fi

    # 使用日志系统
    log_info "$1"
    echo "$1"
}
Aurora_test_input() {
    if [ -z "$3" ]; then
        Aurora_ui_print "$1 ( $2 ) $WARN_MISSING_PARAMETERS"
    fi
}

print_title() {
    if [ -n "$2" ]; then
        Aurora_ui_print "$1 $2"
    fi
}

#About_the_custom_script
###############
check_network() {
    ping -c 1 www.baidu.com >/dev/null 2>&1
    local baidu_status=$?
    ping -c 1 github.com >/dev/null 2>&1
    local github_status=$?
    ping -c 1 google.com >/dev/null 2>&1
    local google_status=$?
    if [ $google_status -eq 0 ]; then
        Aurora_ui_print "$INTERNET_CONNET (Google)"
        Internet_CONN=3
    elif [ $github_status -eq 0 ]; then
        Aurora_ui_print "$INTERNET_CONNET (GitHub)"
        Internet_CONN=2
    elif [ $baidu_status -eq 0 ]; then
        Aurora_ui_print "$INTERNET_CONNET (Baidu.com)"
        Internet_CONN=1
    else
        Internet_CONN=
    fi
}
download_file() {
    Aurora_test_input "download_file" "1" "$1"
    local max_retries=3
    local link="$1"
    local filename=$(wget --spider -S "$link" 2>&1 | grep -o -E 'filename="[^"]*"' | sed -e 's/^filename="//' -e 's/"$//')
    local local_path="$download_destination/$filename"
    local retry_count=0
    local wget_file="$TMP_FOLDER/wget_file"
    mkdir -p "$download_destination"

    wget -S --spider "$link" 2>&1 | grep 'Content-Length:' | awk '{print $2}' >"$wget_file"
    file_size_bytes=$(cat "$wget_file")
    if [ -z "$file_size_bytes" ]; then
        Aurora_ui_print "$FAILED_TO_GET_FILE_SIZE $link"
    fi
    local file_size_mb=$(echo "scale=2; $file_size_bytes / 1048576" | bc)
    Aurora_ui_print "$DOWNLOADING $filename $file_size_mb MB"
    while [ $retry_count -lt "$max_retries" ]; do
        wget --output-document="$local_path.tmp" "$link"
        if [ -s "$local_path.tmp" ]; then
            mv "$local_path.tmp" "$local_path"
            Aurora_ui_print "$DOWNLOAD_SUCCEEDED $local_path"
            return 0
        else
            retry_count=$((retry_count + 1))
            rm -f "$local_path.tmp"
            Aurora_ui_print "$RETRY_DOWNLOAD $retry_count/$max_retries... $DOWNLOAD_FAILED $filename"
        fi
    done

    Aurora_ui_print "$DOWNLOAD_FAILED $link"
    Aurora_ui_print "${KEY_VOLUME}+${PRESS_VOLUME_RETRY}"
    Aurora_ui_print "${KEY_VOLUME}-${PRESS_VOLUME_SKIP}"
    key_select
    if [ "$key_pressed" = "KEY_VOLUMEUP" ]; then
        download_file "$link"
    fi
    return 1
}
#!/bin/sh

# 文件列表
select_on_magisk() {
    # 初始化文件列表和位置
    CURRENT_FILES="$TMP_FOLDER/current_files.tmp"
    CHAR_POS=1

    # 初始化当前文件列表
    cp "$1" "$CURRENT_FILES"
    filtered_files="$TMP_FOLDER/filtered.tmp"
    filtered="$TMP_FOLDER/filtered.tmp"
    current_chars="$TMP_FOLDER/current_chars.tmp"
    group_chars="$TMP_FOLDER/group_chars.tmp"
    # 主循环处理每个字符位置
    while [ "$(wc -l <"$CURRENT_FILES")" -gt 1 ]; do
        # 处理第N个字符
        cut -c "$CHAR_POS" "$CURRENT_FILES" | tr '[:lower:]' '[:upper:]' | sort -u >"$current_chars"

        CHAR_COUNT=$(wc -l <"$current_chars")
        CHARS=$(tr '\n' ' ' <"$current_chars")

        if [ "$CHAR_COUNT" -eq 1 ]; then
            # 自动选择唯一字符
            SELECTED_CHAR=$(head -1 "$current_chars")
            show_menu "Auto Select $CHAR_POS " "--> $SELECTED_CHAR"
            sleep 1
        else
            # 显示分组选择
            GROUP_ORDER="A-G H-M N-T U-Z Other"
            AVAILABLE_GROUPS=""

            # 生成可用分组列表
            for GROUP in $GROUP_ORDER; do
                case $GROUP in
                "A-G") PATTERN="[A-G]" ;;
                "H-M") PATTERN="[H-M]" ;;
                "N-T") PATTERN="[N-T]" ;;
                "U-Z") PATTERN="[U-Z]" ;;
                "Other") PATTERN="[^A-Z]" ;;
                esac
                grep -q -E "$PATTERN" "$current_chars" && AVAILABLE_GROUPS="$AVAILABLE_GROUPS $GROUP"
            done

            # 分组选择交互
            GROUP_INDEX=0
            AVAILABLE_GROUPS=$(echo "$AVAILABLE_GROUPS" | sed 's/^ //')
            NUM_GROUPS=$(echo "$AVAILABLE_GROUPS" | wc -w)

            while true; do
                CURRENT_GROUP=$(echo "$AVAILABLE_GROUPS" | cut -d ' ' -f $((GROUP_INDEX + 1)))

                # 显示分组菜单
                show_menu "$CHAR_POS" "group" "$AVAILABLE_GROUPS" $((GROUP_INDEX + 1))

                key_select
                case "$key_pressed" in
                KEY_VOLUMEUP) break ;;
                KEY_VOLUMEDOWN)
                    GROUP_INDEX=$(((GROUP_INDEX + 1) % NUM_GROUPS))
                    ;;
                esac
            done

            # 处理分组内字符选择
            case "$CURRENT_GROUP" in
            "A-G") PATTERN="[A-G]" ;;
            "H-M") PATTERN="[H-M]" ;;
            "N-T") PATTERN="[N-T]" ;;
            "U-Z") PATTERN="[U-Z]" ;;
            "Other") PATTERN="[^A-Z]" ;;
            esac

            grep -E "$PATTERN" "$current_chars" >"$group_chars"
            GROUP_CHARS=$(tr '\n' ' ' <"$group_chars")
            NUM_CHARS=$(wc -w <"$group_chars")

            # 字符选择交互
            CHAR_INDEX=0
            while true; do
                CURRENT_CHAR=$(echo "$GROUP_CHARS" | cut -d ' ' -f $((CHAR_INDEX + 1)))

                # 显示字符菜单
                show_menu "$CHAR_POS" "char" "$GROUP_CHARS" $((CHAR_INDEX + 1))

                key_select
                case "$key_pressed" in
                KEY_VOLUMEUP)
                    SELECTED_CHAR="$CURRENT_CHAR"
                    break
                    ;;
                KEY_VOLUMEDOWN)
                    CHAR_INDEX=$(((CHAR_INDEX + 1) % NUM_CHARS))
                    ;;
                esac
            done
        fi

        # 过滤文件
        awk -v pos="$CHAR_POS" -v char="$SELECTED_CHAR" '
        BEGIN { FS="" }
        {
            current = toupper(substr($0, pos, 1))
            if (current == toupper(char)) print
        }
    ' "$CURRENT_FILES" >"$filtered"

        mv "$filtered" "$CURRENT_FILES"
        CHAR_POS=$((CHAR_POS + 1))
    done

    SELECT_OUTPUT=$(cat "$CURRENT_FILES")
    Aurora_ui_print "$RESULT_TITLE $SELECT_OUTPUT"
    rm -f $TMP_FOLDER/*.tmp 2>/dev/null
}
show_menu() {
    local clear_command="1"
    while [ "${clear_command}" -le 5 ]; do
        printf "\n                                        \n"
        clear_command=$((clear_command + 1))
    done
    clear
    case "$2" in
    "group")
        echo "$MENU_TITLE_GROUP"
        echo "$MENU_CURRENT_CANDIDATES $CHARS"
        echo "--------------------------"
        ;;
    "char")
        echo "$MENU_TITLE_CHAR"
        echo "$MENU_CURRENT_GROUP $CURRENT_GROUP"
        echo "--------------------------"
        ;;
    esac

    # 显示选项（仅修改此处循环）
    counter=0
    for item in $3; do
        counter=$((counter + 1))
        if [ $counter -eq "$4" ]; then
            echo "> $item"
        else
            echo "  $item"
        fi
    done
    echo "========================"
    echo "$MENU_INSTRUCTIONS"

    local clear_command="1"
    while [ "${clear_command}" -le 5 ]; do
        printf "\n                                        \n"
        clear_command=$((clear_command + 1))
    done
}

# 数字选择函数
number_select() {
    CURRENT_FILES="$TMP_FOLDER/current_files.tmp"
    # 初始化文件列表
    cp "$1" "$CURRENT_FILES"
    selected="$TMP_FOLDER/selected.tmp"
    clear
    cat -n "$CURRENT_FILES"
    sed -i -e '$a\' "$CURRENT_FILES"

    # 获取有效数字范围
    total=$(wc -l <"$CURRENT_FILES")
    max_digits=${#total}

    # 数字输入处理
    while true; do
        printf "%s" "$PROMPT_ENTER_NUMBER"
        printf "(1-%d): " "$total"
        read num

        # 去除前导零
        num=$(echo "$num" | sed 's/^0*//')

        # 验证输入有效性
        if [ -z "$num" ] || ! [ "$num" -eq "$num" ] 2>/dev/null; then
            echo "$ERROR_OUT_OF_RANGE"
            continue
        fi

        if [ "$num" -ge 1 ] && [ "$num" -le "$total" ]; then
            # 提取选择结果
            awk -v line="$num" 'NR == line' "$CURRENT_FILES" >"$selected"
            mv "$selected" "$CURRENT_FILES"
            SELECT_OUTPUT=$(cat "$CURRENT_FILES")
            Aurora_ui_print "$RESULT_TITLE $SELECT_OUTPUT"
            return 0
        else
            echo "$ERROR_OUT_OF_RANGE"
        fi
    done
}
# 列表选择函数
list_select() {
    local list_file="$1"
    local title="${2:-$LIST_SELECT_TITLE}"
    
    # 初始化临时文件
    local temp_list="$TMP_FOLDER/list_select.tmp"
    cp "$list_file" "$temp_list"
    
    # 获取列表总数
    local total_items=$(wc -l < "$temp_list")
    
    # 当前选择的索引
    local current_index=1
    local current_item=$(sed -n "${current_index}p" "$temp_list")
    
    # 显示列表并处理选择
    while true; do
        clear
        echo "$title"
        echo "--------------------------"
        echo "$CURRENT_SELECTION: $current_item"
        echo "--------------------------"
        
        # 显示列表项
        local item_num=1
        while IFS= read -r line; do
            if [ "$item_num" -eq "$current_index" ]; then
                echo "> $line"
            else
                echo "  $line"
            fi
            item_num=$((item_num + 1))
        done < "$temp_list"
        
        echo "========================"
        echo "${KEY_VOLUME}+ ${PRESS_VOLUME_SELECT}"
        echo "${KEY_VOLUME}- ${PRESS_VOLUME_NEXT}"
        
        # 获取按键输入
        key_select
        
        case "$key_pressed" in
            KEY_VOLUMEUP)
                # 选择当前项
                SELECT_OUTPUT="$current_item"
                Aurora_ui_print "$RESULT_TITLE $SELECT_OUTPUT"
                rm -f "$temp_list" 2>/dev/null
                return 0
                ;;
            KEY_VOLUMEDOWN)
                # 移动到下一项
                current_index=$((current_index + 1))
                # 如果超出范围，回到第一项
                if [ "$current_index" -gt "$total_items" ]; then
                    current_index=1
                fi
                # 更新当前选中项
                current_item=$(sed -n "${current_index}p" "$temp_list")
                # 显示当前选择的提示
                Aurora_ui_print "$MOVED_TO_ITEM $current_item"
                ;;
        esac
    done
}