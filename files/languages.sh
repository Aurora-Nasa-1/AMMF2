# AMMF多语言配置文件
# 格式: lang_[语言代码]() { ... }
# 支持的语言代码: en(英语), zh(中文), jp(日语), ru(俄语), fr(法语)
# 添加新语言时，只需按照相同格式添加新的语言函数

# 英语
lang_en() {
    # 系统消息
    ERROR_TEXT="Error"
    ERROR_CODE_TEXT="Error code"
    ERROR_UNSUPPORTED_VERSION="Unsupported version"
    ERROR_VERSION_NUMBER="Version number"
    ERROR_UPGRADE_ROOT_SCHEME="Please upgrade the root scheme or change the root scheme"
    ERROR_INVALID_LOCAL_VALUE="The value is invalid, must be true or false."
    KEY_VOLUME="Volume key"
    
    # 日志系统相关
    WARN_TEXT="Warning"
    INFO_TEXT="Info"
    DEBUG_TEXT="Debug"
    LOG_INITIALIZED="Log system initialized"
    LOG_FILE_SET="Log file set to"
    LOG_FLUSHED="Log flushed"
    LOG_CLEANED="Logs cleaned"
    ERROR_INVALID_DIR="Cannot create log directory"
    LOG_FALLBACK="Will use simplified logging"
    
    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="CustomScript is disabled. Custom scripts will not be executed."
    CUSTOM_SCRIPT_ENABLED="CustomScript is enabled. Executing custom scripts."
    
    # 网络相关
    INTERNET_CONNET="Network available"
    DOWNLOAD_SUCCEEDED="File downloaded"
    DOWNLOAD_FAILED="Download failed"
    RETRY_DOWNLOAD="Retry"
    SKIP_DOWNLOAD="Skip"
    CHECK_NETWORK="No network connection Please check the network connection"
    PRESS_VOLUME_RETRY="Continue retry"
    PRESS_VOLUME_SKIP="Skip"
    DOWNLOADING="Downloading"
    FAILED_TO_GET_FILE_SIZE="Failed to get file size"
    
    # 命令相关
    COMMAND_FAILED="Command failed"
    NOTFOUND_URL="No matching download URL found"
    OUTPUT="Output"
    END="Installation end"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== Group selection ========"
    MENU_TITLE_CHAR="======== Character selection ========"
    MENU_CURRENT_CANDIDATES="Current candidate characters:"
    MENU_CURRENT_GROUP="Current group:"
    MENU_INSTRUCTIONS="VOL+ select | VOL- switch"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="Please enter a number"
    ERROR_INVALID_INPUT="Invalid input!"
    ERROR_OUT_OF_RANGE="Out of range!"
    RESULT_TITLE="Selection result:"

    # Service脚本相关
    SERVICE_STARTED="Service started"
    SERVICE_PAUSED="Entered pause mode, monitoring file"
    SERVICE_NORMAL_EXIT="Service exited normally"
    SERVICE_STATUS_UPDATE="Status updated"
    SERVICE_LOADING_MAIN="Loading main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="Loading service_script.sh"
    SERVICE_FILE_NOT_FOUND="File not found"
    SERVICE_LOG_ROTATED="Log rotated"
    
    # main.sh 相关
    SCRIPT_INIT_COMPLETE="Script initialization complete"
    LOGGER_NOT_LOADED="Warning: Logger system not loaded"
    FILE_NOT_FOUND="File not found"
    WARN_MISSING_PARAMETERS="Missing parameters"
    LIST_SELECT_TITLE="Please select the list to install:"
    PRESS_VOLUME_SELECT="Press VOL+ to select"
    PRESS_VOLUME_NEXT="Press VOL- to next"
    CURRENT_SELECTION="Current selection:"
    MOVED_TO_ITEM="Moved to item"
}

# 中文
lang_zh() {
    # 系统消息
    ERROR_TEXT="错误"
    ERROR_CODE_TEXT="错误代码"
    ERROR_UNSUPPORTED_VERSION="不支持的版本"
    ERROR_VERSION_NUMBER="版本号"
    ERROR_UPGRADE_ROOT_SCHEME="请升级root方案或更换root方案"
    ERROR_INVALID_LOCAL_VALUE="的值无效，必须为true或false。"
    KEY_VOLUME="音量键"
    
    # 日志系统相关
    WARN_TEXT="警告"
    INFO_TEXT="信息"
    DEBUG_TEXT="调试"
    LOG_INITIALIZED="日志系统已初始化"
    LOG_FILE_SET="日志文件已设置为"
    LOG_FLUSHED="日志已刷新"
    LOG_CLEANED="日志已清理"
    ERROR_INVALID_DIR="无法创建日志目录"
    LOG_FALLBACK="将使用简化的日志功能"

    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="已禁用CustomScript。将不执行自定义脚本。"
    CUSTOM_SCRIPT_ENABLED="已启用CustomScript。正在执行自定义脚本。"
    
    # 网络相关
    INTERNET_CONNET="网络可用"
    DOWNLOAD_SUCCEEDED="已下载文件"
    DOWNLOAD_FAILED="下载失败"
    RETRY_DOWNLOAD="重试"
    SKIP_DOWNLOAD="跳过"
    CHECK_NETWORK="没有网络连接 请检查网络连接"
    PRESS_VOLUME_RETRY="继续重试"
    PRESS_VOLUME_SKIP="跳过"
    DOWNLOADING="下载中"
    FAILED_TO_GET_FILE_SIZE="无法获取文件大小"
    
    # 命令相关
    COMMAND_FAILED="命令失败"
    NOTFOUND_URL="找不到匹配的下载URL"
    OUTPUT="输出"
    END="安装结束"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== 组选择 ========"
    MENU_TITLE_CHAR="======== 字符选择 ========"
    MENU_CURRENT_CANDIDATES="当前候选字符："
    MENU_CURRENT_GROUP="当前组："
    MENU_INSTRUCTIONS="音量+选择 | 音量-切换"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="请输入一个数字"
    ERROR_INVALID_INPUT="输入无效！"
    ERROR_OUT_OF_RANGE="超出范围！"
    RESULT_TITLE="选择结果："
    
    # Service脚本相关
    SERVICE_STARTED="服务启动"
    SERVICE_PAUSED="进入暂停模式，监控文件"
    SERVICE_NORMAL_EXIT="服务正常退出"
    SERVICE_STATUS_UPDATE="状态更新"
    SERVICE_LOADING_MAIN="加载 main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="加载 service_script.sh"
    SERVICE_FILE_NOT_FOUND="未找到文件"
    SERVICE_LOG_ROTATED="日志已轮换"
    
    # main.sh 相关
    SCRIPT_INIT_COMPLETE="脚本初始化完成"
    LOGGER_NOT_LOADED="警告: 日志系统未加载"
    FILE_NOT_FOUND="文件未找到"
    WARN_MISSING_PARAMETERS="缺少参数"
    LIST_SELECT_TITLE="请选择要安装的列表："
    PRESS_VOLUME_SELECT="音量+选择"
    PRESS_VOLUME_NEXT="音量-下一个"
    CURRENT_SELECTION="当前选择："
    MOVED_TO_ITEM="已移动到项"
}

# 俄语
lang_ru() {
    # 系统消息
    ERROR_TEXT="Ошибка"
    ERROR_CODE_TEXT="Код ошибки"
    ERROR_UNSUPPORTED_VERSION="Неподдерживаемая версия"
    ERROR_VERSION_NUMBER="Номер версии"
    ERROR_UPGRADE_ROOT_SCHEME="Пожалуйста, обновите схему root или измените схему root"
    ERROR_INVALID_LOCAL_VALUE="Значение недействительно, должно быть true или false."
    KEY_VOLUME="Клавиша громкости"
    
    # 日志系统相关
    WARN_TEXT="Предупреждение"
    INFO_TEXT="Информация"
    DEBUG_TEXT="Отладка"
    LOG_INITIALIZED="Система журналирования инициализирована"
    LOG_FILE_SET="Файл журнала установлен на"
    LOG_FLUSHED="Журнал сброшен"
    LOG_CLEANED="Журналы очищены"
    ERROR_INVALID_DIR="Не удалось создать каталог журнала"
    LOG_FALLBACK="Будет использоваться упрощенное ведение журнала"

    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="CustomScript отключен. Пользовательские скрипты не будут выполняться."
    CUSTOM_SCRIPT_ENABLED="CustomScript включен. Выполнение пользовательских скриптов."
    
    # 网络相关
    INTERNET_CONNET="Сеть доступна"
    DOWNLOAD_SUCCEEDED="Файл загружен"
    DOWNLOAD_FAILED="Ошибка загрузки"
    RETRY_DOWNLOAD="Повторить"
    SKIP_DOWNLOAD="Пропустить"
    CHECK_NETWORK="Нет подключения к сети. Пожалуйста, проверьте подключение к сети"
    PRESS_VOLUME_RETRY="Продолжить повторные попытки"
    PRESS_VOLUME_SKIP="Пропустить"
    DOWNLOADING="Загрузка"
    FAILED_TO_GET_FILE_SIZE="Не удалось получить размер файла"
    
    # 命令相关
    COMMAND_FAILED="Команда не выполнена"
    NOTFOUND_URL="Соответствующий URL для загрузки не найден"
    OUTPUT="Вывод"
    END="Конец установки"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== Выбор группы ========"
    MENU_TITLE_CHAR="======== Выбор символа ========"
    MENU_CURRENT_CANDIDATES="Текущие символы-кандидаты:"
    MENU_CURRENT_GROUP="Текущая группа:"
    MENU_INSTRUCTIONS="VOL+ выбрать | VOL- переключить"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="Пожалуйста, введите число"
    ERROR_INVALID_INPUT="Неверный ввод!"
    ERROR_OUT_OF_RANGE="Вне диапазона!"
    RESULT_TITLE="Результат выбора:"
    
    # Service脚本相关
    SERVICE_STARTED="Служба запущена"
    SERVICE_PAUSED="Вход в режим паузы, мониторинг файла"
    SERVICE_NORMAL_EXIT="Служба завершена нормально"
    SERVICE_STATUS_UPDATE="Статус обновлен"
    SERVICE_LOADING_MAIN="Загрузка main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="Загрузка service_script.sh"
    SERVICE_FILE_NOT_FOUND="Файл не найден"
    SERVICE_LOG_ROTATED="Журнал ротирован"
    # main.sh 相关
    SCRIPT_INIT_COMPLETE="Запуск скрипта - инициализация завершена"
    LOGGER_NOT_LOADED="Предупреждение: Система журналирования не загружена"
    FILE_NOT_FOUND="Файл не найден"
    WARN_MISSING_PARAMETERS="Отсутствуют параметры"
    LIST_SELECT_TITLE="Пожалуйста, выберите список для установки:"
    PRESS_VOLUME_SELECT="Нажмите VOL+ для выбора"
    PRESS_VOLUME_NEXT="Нажмите VOL- для следующего"
    CURRENT_SELECTION="Текущая выборка:"
    MOVED_TO_ITEM="Перемещено в элемент"
}