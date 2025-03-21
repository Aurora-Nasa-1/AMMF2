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
    # WebUI相关
    # Web界面翻译
    WEBUI_TITLE="AMMF Settings"
    WEBUI_SAVE="Save"
    WEBUI_LOADING="Loading settings..."
    WEBUI_SAVE_SUCCESS="Settings saved successfully!"
    WEBUI_BOOLEAN_TRUE="Enabled"
    WEBUI_BOOLEAN_FALSE="Disabled"
    WEBUI_LOADING_DESCRIPTIONS="Loading descriptions..."
    WEBUI_LOADING_EXCLUSIONS="Loading exclusions..."
    WEBUI_LOADING_OPTIONS="Loading options..."
    WEBUI_SELECT="Select"
    WEBUI_LANGUAGE_SELECT="Select Language"
    WEBUI_CONFIG_SH_TITLE="Module Configuration"
    WEBUI_SETTINGS_SH_TITLE="Module Settings"
    WEBUI_SYSTEM_PROP_TITLE="System Properties"
    WEBUI_SETTINGS_TITLE="Module Settings"
    WEBUI_SETTINGS_DESCRIPTION="Configure AMMF module parameters"
    WEBUI_SYSTEM_PROP_DESCRIPTION="Edit system properties in system.prop file"
    WEBUI_LOGS_TITLE="Logs"
    WEBUI_LOGS_DESCRIPTION="View module logs"
    WEBUI_ABOUT_TITLE="About"
    WEBUI_ABOUT_DESCRIPTION="View module information and version"
    WEBUI_BACK="Back"
    WEBUI_CONFIG_FILE="Config File:"
    WEBUI_ABOUT_INFO="AMMF Module - A Magisk/KernelSU Module Framework"
    WEBUI_NO_PROPERTIES="No system properties"
    WEBUI_ADD_PROPERTY_HINT="Click the \"Add Property\" button below to add new system properties"
    WEBUI_PROPERTY_NAME="Property Name"
    WEBUI_PROPERTY_VALUE="Property Value"
    WEBUI_ADD_PROPERTY="Add Property"
    WEBUI_STATUS_TITLE="Module Status"
    WEBUI_STATUS_LABEL="Current Status:"
    WEBUI_UPTIME_LABEL="Uptime:"
    WEBUI_REFRESH_STATUS="Refresh"
    WEBUI_RESTART_MODULE="Restart Module"
    WEBUI_REFRESH_LOGS="Refresh Logs"
    WEBUI_CLEAR_LOGS="Clear Logs"
    WEBUI_FILTER_LOGS="Filter Logs"
    WEBUI_NO_LOGS="No logs available"
    WEBUI_CONFIRM_CLEAR_LOGS="Are you sure you want to clear all logs?"
    WEBUI_LOGS_CLEARED="Logs cleared successfully"
    WEBUI_SYSTEM_PROP_NOT_FOUND="system.prop file not found"
    WEBUI_CREATE_SYSTEM_PROP_HINT="You can create a new system.prop file to add system properties"
    WEBUI_CREATE_SYSTEM_PROP="Create system.prop"
    WEBUI_CREATING_SYSTEM_PROP="Creating system.prop file..."
    WEBUI_SYSTEM_PROP_CREATED="system.prop file created"
    WEBUI_CREATE_SYSTEM_PROP_FAILED="Failed to create system.prop file"
    WEBUI_CONFIRM_RESTART="Settings saved successfully. Do you want to restart the module to apply changes?"
    WEBUI_LANGUAGE_TITLE="Available Languages"
    WEBUI_LANGUAGE_NAME="English"
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
        # Service脚本相关
    SERVICE_STARTED="服务启动"
    SERVICE_PAUSED="进入暂停模式，监控文件"
    SERVICE_NORMAL_EXIT="服务正常退出"
    SERVICE_STATUS_UPDATE="状态更新"
    SERVICE_LOADING_MAIN="加载 main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="加载 service_script.sh"
    SERVICE_FILE_NOT_FOUND="未找到文件"
    SERVICE_LOG_ROTATED="日志已轮换"
    # 输入相关
    PROMPT_ENTER_NUMBER="请输入一个数字"
    ERROR_INVALID_INPUT="输入无效！"
    ERROR_OUT_OF_RANGE="超出范围！"
    RESULT_TITLE="选择结果："
    
    # WebUI相关
    WEBUI_TITLE="AMMF设置"
    WEBUI_SAVE="保存"
    WEBUI_LOADING="加载设置中..."
    WEBUI_SAVE_SUCCESS="设置保存成功！"
    WEBUI_BOOLEAN_TRUE="已启用"
    WEBUI_BOOLEAN_FALSE="已禁用"
    WEBUI_LOADING_DESCRIPTIONS="加载描述中..."
    WEBUI_LOADING_EXCLUSIONS="加载排除项中..."
    WEBUI_LOADING_OPTIONS="加载选项中..."
    WEBUI_SELECT="选择"
    WEBUI_LANGUAGE_SELECT="选择语言"
    WEBUI_CONFIG_SH_TITLE="模块配置"
    WEBUI_SETTINGS_SH_TITLE="模块设置"
    WEBUI_SYSTEM_PROP_TITLE="系统属性"
    WEBUI_SETTINGS_TITLE="模块设置"
    WEBUI_SETTINGS_DESCRIPTION="配置AMMF模块的各项参数"
    WEBUI_SYSTEM_PROP_DESCRIPTION="编辑system.prop文件中的系统属性"
    WEBUI_LOGS_TITLE="运行日志"
    WEBUI_LOGS_DESCRIPTION="查看模块运行日志"
    WEBUI_ABOUT_TITLE="关于"
    WEBUI_ABOUT_DESCRIPTION="查看模块信息和版本"
    WEBUI_BACK="返回"
    WEBUI_CONFIG_FILE="配置文件:"
    WEBUI_ABOUT_INFO="AMMF模块 - 一个Magisk/KernelSU模块框架"
    WEBUI_NO_PROPERTIES="暂无系统属性"
    WEBUI_ADD_PROPERTY_HINT="点击下方的"添加属性"按钮添加新的系统属性"
    WEBUI_PROPERTY_NAME="属性名"
    WEBUI_PROPERTY_VALUE="属性值"
    WEBUI_ADD_PROPERTY="添加属性"
    WEBUI_STATUS_TITLE="模块状态"
    WEBUI_STATUS_LABEL="当前状态:"
    WEBUI_UPTIME_LABEL="运行时间:"
    WEBUI_REFRESH_STATUS="刷新"
    WEBUI_RESTART_MODULE="重启模块"
    WEBUI_REFRESH_LOGS="刷新日志"
    WEBUI_CLEAR_LOGS="清空日志"
    WEBUI_FILTER_LOGS="筛选日志"
    WEBUI_NO_LOGS="暂无日志"
    WEBUI_CONFIRM_CLEAR_LOGS="确定要清空所有日志吗？"
    WEBUI_LOGS_CLEARED="日志已清空"
    WEBUI_SYSTEM_PROP_NOT_FOUND="system.prop文件不存在"
    WEBUI_CREATE_SYSTEM_PROP_HINT="您可以创建一个新的system.prop文件来添加系统属性"
    WEBUI_CREATE_SYSTEM_PROP="创建system.prop"
    WEBUI_CREATING_SYSTEM_PROP="正在创建system.prop文件..."
    WEBUI_SYSTEM_PROP_CREATED="system.prop文件已创建"
    WEBUI_CREATE_SYSTEM_PROP_FAILED="创建system.prop文件失败"
    WEBUI_CONFIRM_RESTART="保存成功，是否立即重启模块以应用更改？"
    WEBUI_LANGUAGE_TITLE="可用语言"
    WEBUI_LANGUAGE_NAME="简体中文"
}

# 日语
lang_jp() {
    # 系统消息
    ERROR_TEXT="エラー"
    ERROR_CODE_TEXT="エラーコード"
    ERROR_UNSUPPORTED_VERSION="サポートされていないバージョン"
    ERROR_VERSION_NUMBER="バージョン番号"
    ERROR_UPGRADE_ROOT_SCHEME="ルートスキームをアップグレードするか、ルートスキームを変更してください"
    ERROR_INVALID_LOCAL_VALUE="値が無効です。trueまたはfalseである必要があります。"
    KEY_VOLUME="音量キー"
    
    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="CustomScriptは無効になっています。カスタムスクリプトは実行されません。"
    CUSTOM_SCRIPT_ENABLED="CustomScriptが有効になっています。カスタムスクリプトを実行しています。"
    
    # 网络相关
    INTERNET_CONNET="ネットワークが利用可能"
    DOWNLOAD_SUCCEEDED="ファイルがダウンロードされました"
    DOWNLOAD_FAILED="ダウンロードに失敗しました"
    RETRY_DOWNLOAD="再試行"
    SKIP_DOWNLOAD="スキップ"
    CHECK_NETWORK="ネットワーク接続がありません ネットワーク接続を確認してください"
    PRESS_VOLUME_RETRY="再試行を続ける"
    PRESS_VOLUME_SKIP="スキップ"
    DOWNLOADING="ダウンロード中"
    FAILED_TO_GET_FILE_SIZE="ファイルサイズの取得に失敗しました"
    
    # 命令相关
    COMMAND_FAILED="コマンドが失敗しました"
    NOTFOUND_URL="一致するダウンロードURLが見つかりません"
    OUTPUT="出力"
    END="インストール終了"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== グループ選択 ========"
    MENU_TITLE_CHAR="======== 文字選択 ========"
    MENU_CURRENT_CANDIDATES="現在の候補文字："
    MENU_CURRENT_GROUP="現在のグループ："
    MENU_INSTRUCTIONS="VOL+選択 | VOL-切り替え"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="数字を入力してください"
    ERROR_INVALID_INPUT="無効な入力です！"
    ERROR_OUT_OF_RANGE="範囲外です！"
    RESULT_TITLE="選択結果："
     # Service脚本相关
    SERVICE_STARTED="サービス開始"
    SERVICE_PAUSED="一時停止モードに入り、ファイルを監視しています"
    SERVICE_NORMAL_EXIT="サービスが正常に終了しました"
    SERVICE_STATUS_UPDATE="ステータス更新"
    SERVICE_LOADING_MAIN="main.shを読み込んでいます"
    SERVICE_LOADING_SERVICE_SCRIPT="service_script.shを読み込んでいます"
    SERVICE_FILE_NOT_FOUND="ファイルが見つかりません"
    SERVICE_LOG_ROTATED="ログがローテーションされました"
    # WebUI相关
    WEBUI_TITLE="AMMF設定"
    WEBUI_SAVE="保存"
    WEBUI_LOADING="設定を読み込んでいます..."
    WEBUI_SAVE_SUCCESS="設定が正常に保存されました！"
    WEBUI_BOOLEAN_TRUE="有効"
    WEBUI_BOOLEAN_FALSE="無効"
    WEBUI_LOADING_DESCRIPTIONS="説明を読み込んでいます..."
    WEBUI_LOADING_EXCLUSIONS="除外項目を読み込んでいます..."
    WEBUI_LOADING_OPTIONS="オプションを読み込んでいます..."
    WEBUI_SELECT="選択"
    WEBUI_LANGUAGE_SELECT="言語を選択"
    WEBUI_CONFIG_SH_TITLE="モジュール構成"
    WEBUI_SETTINGS_SH_TITLE="モジュール設定"
    WEBUI_SYSTEM_PROP_TITLE="システムプロパティ"
    WEBUI_SETTINGS_TITLE="モジュール設定"
    WEBUI_SETTINGS_DESCRIPTION="AMMFモジュールのパラメータを設定する"
    WEBUI_SYSTEM_PROP_DESCRIPTION="system.propファイルのシステムプロパティを編集する"
    WEBUI_LOGS_TITLE="ログ"
    WEBUI_LOGS_DESCRIPTION="モジュールログを表示"
    WEBUI_ABOUT_TITLE="について"
    WEBUI_ABOUT_DESCRIPTION="モジュール情報とバージョンを表示"
    WEBUI_BACK="戻る"
    WEBUI_CONFIG_FILE="設定ファイル:"
    WEBUI_ABOUT_INFO="AMMFモジュール - Magisk/KernelSUモジュールフレームワーク"
    WEBUI_LANGUAGE_NAME="日本語"
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
    # Service脚本相关
    SERVICE_STARTED="Служба запущена"
    SERVICE_PAUSED="Вход в режим паузы, мониторинг файла"
    SERVICE_NORMAL_EXIT="Служба завершена нормально"
    SERVICE_STATUS_UPDATE="Статус обновлен"
    SERVICE_LOADING_MAIN="Загрузка main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="Загрузка service_script.sh"
    SERVICE_FILE_NOT_FOUND="Файл не найден"
    SERVICE_LOG_ROTATED="Журнал ротирован"
    # 输入相关
    PROMPT_ENTER_NUMBER="Пожалуйста, введите число"
    ERROR_INVALID_INPUT="Неверный ввод!"
    ERROR_OUT_OF_RANGE="Вне диапазона!"
    RESULT_TITLE="Результат выбора:"
    
    # WebUI相关
    WEBUI_TITLE="Настройки AMMF"
    WEBUI_SAVE="Сохранить"
    WEBUI_LOADING="Загрузка настроек..."
    WEBUI_SAVE_SUCCESS="Настройки успешно сохранены!"
    WEBUI_SAVE_ERROR="Ошибка сохранения настроек"
    WEBUI_BOOLEAN_TRUE="Включено"
    WEBUI_BOOLEAN_FALSE="Отключено"
    WEBUI_LOADING_DESCRIPTIONS="Загрузка описаний..."
    WEBUI_LOADING_EXCLUSIONS="Загрузка исключений..."
    WEBUI_LOADING_OPTIONS="Загрузка опций..."
    WEBUI_SELECT="Выбрать"
    WEBUI_LANGUAGE_SELECT="Выбрать язык"
    WEBUI_LANGUAGE_TITLE="Доступные языки"
    WEBUI_LANGUAGE_NAME="Русский"
}

# 法语
lang_fr() {
    # 系统消息
    ERROR_TEXT="Erreur"
    ERROR_CODE_TEXT="Code d'erreur"
    ERROR_UNSUPPORTED_VERSION="Version non prise en charge"
    ERROR_VERSION_NUMBER="Numéro de version"
    ERROR_UPGRADE_ROOT_SCHEME="Veuillez mettre à niveau le schéma root ou changer de schéma root"
    ERROR_INVALID_LOCAL_VALUE="La valeur est invalide, doit être true ou false."
    KEY_VOLUME="Touche de volume"
    
    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="CustomScript est désactivé. Les scripts personnalisés ne seront pas exécutés."
    CUSTOM_SCRIPT_ENABLED="CustomScript est activé. Exécution des scripts personnalisés."
    
    # 网络相关
    INTERNET_CONNET="Réseau disponible"
    DOWNLOAD_SUCCEEDED="Fichier téléchargé"
    DOWNLOAD_FAILED="Échec du téléchargement"
    RETRY_DOWNLOAD="Réessayer"
    SKIP_DOWNLOAD="Ignorer"
    CHECK_NETWORK="Pas de connexion réseau. Veuillez vérifier la connexion réseau"
    PRESS_VOLUME_RETRY="Continuer à réessayer"
    PRESS_VOLUME_SKIP="Ignorer"
    DOWNLOADING="Téléchargement en cours"
    FAILED_TO_GET_FILE_SIZE="Impossible d'obtenir la taille du fichier"
    
    # 命令相关
    COMMAND_FAILED="Échec de la commande"
    NOTFOUND_URL="Aucune URL de téléchargement correspondante trouvée"
    OUTPUT="Sortie"
    END="Fin de l'installation"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== Sélection de groupe ========"
    MENU_TITLE_CHAR="======== Sélection de caractère ========"
    MENU_CURRENT_CANDIDATES="Caractères candidats actuels:"
    MENU_CURRENT_GROUP="Groupe actuel:"
    MENU_INSTRUCTIONS="VOL+ sélectionner | VOL- changer"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="Veuillez entrer un nombre"
    ERROR_INVALID_INPUT="Entrée invalide!"
    ERROR_OUT_OF_RANGE="Hors de portée!"
    RESULT_TITLE="Résultat de la sélection:"
    # Service脚本相关
    SERVICE_STARTED="Service démarré"
    SERVICE_PAUSED="Entré en mode pause, surveillance du fichier"
    SERVICE_NORMAL_EXIT="Service terminé normalement"
    SERVICE_STATUS_UPDATE="Statut mis à jour"
    SERVICE_LOADING_MAIN="Chargement de main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="Chargement de service_script.sh"
    SERVICE_FILE_NOT_FOUND="Fichier non trouvé"
    SERVICE_LOG_ROTATED="Journal pivoté"
    # WebUI相关
    WEBUI_TITLE="Paramètres AMMF"
    WEBUI_SAVE="Enregistrer"
    WEBUI_LOADING="Chargement des paramètres..."
    WEBUI_SAVE_SUCCESS="Paramètres enregistrés avec succès!"
    WEBUI_BOOLEAN_TRUE="Activé"
    WEBUI_BOOLEAN_FALSE="Désactivé"
    WEBUI_LOADING_DESCRIPTIONS="Chargement des descriptions..."
    WEBUI_LOADING_EXCLUSIONS="Chargement des exclusions..."
    WEBUI_LOADING_OPTIONS="Chargement des options..."
    WEBUI_SELECT="Sélectionner"
    WEBUI_LANGUAGE_SELECT="Sélectionner la langue"
    WEBUI_CONFIG_SH_TITLE="Configuration du module"
    WEBUI_SETTINGS_SH_TITLE="Paramètres du module"
    WEBUI_SYSTEM_PROP_TITLE="Propriétés système"
    WEBUI_SETTINGS_TITLE="Paramètres du module"
    WEBUI_SETTINGS_DESCRIPTION="Configurer les paramètres du module AMMF"
    WEBUI_SYSTEM_PROP_DESCRIPTION="Modifier les propriétés système dans le fichier system.prop"
    WEBUI_LOGS_TITLE="Journaux"
    WEBUI_LOGS_DESCRIPTION="Voir les journaux du module"
    WEBUI_ABOUT_TITLE="À propos"
    WEBUI_ABOUT_DESCRIPTION="Voir les informations et la version du module"
    WEBUI_BACK="Retour"
    WEBUI_CONFIG_FILE="Fichier de configuration:"
    WEBUI_ABOUT_INFO="Module AMMF - Un framework de module Magisk/KernelSU"
    WEBUI_NO_PROPERTIES="Aucune propriété système"
    WEBUI_ADD_PROPERTY_HINT="Cliquez sur le bouton \"Ajouter une propriété\" ci-dessous pour ajouter de nouvelles propriétés système"
    WEBUI_PROPERTY_NAME="Nom de la propriété"
    WEBUI_PROPERTY_VALUE="Valeur de la propriété"
    WEBUI_ADD_PROPERTY="Ajouter une propriété"
    WEBUI_STATUS_TITLE="État du module"
    WEBUI_STATUS_LABEL="État actuel:"
    WEBUI_UPTIME_LABEL="Temps de fonctionnement:"
    WEBUI_REFRESH_STATUS="Actualiser"
    WEBUI_RESTART_MODULE="Redémarrer le module"
    WEBUI_REFRESH_LOGS="Actualiser les journaux"
    WEBUI_CLEAR_LOGS="Effacer les journaux"
    WEBUI_FILTER_LOGS="Filtrer les journaux"
    WEBUI_NO_LOGS="Aucun journal disponible"
    WEBUI_CONFIRM_CLEAR_LOGS="Êtes-vous sûr de vouloir effacer tous les journaux?"
    WEBUI_LOGS_CLEARED="Journaux effacés avec succès"
    WEBUI_SYSTEM_PROP_NOT_FOUND="Fichier system.prop introuvable"
    WEBUI_CREATE_SYSTEM_PROP_HINT="Vous pouvez créer un nouveau fichier system.prop pour ajouter des propriétés système"
    WEBUI_CREATE_SYSTEM_PROP="Créer system.prop"
    WEBUI_CREATING_SYSTEM_PROP="Création du fichier system.prop..."
    WEBUI_SYSTEM_PROP_CREATED="Fichier system.prop créé"
    WEBUI_CREATE_SYSTEM_PROP_FAILED="Échec de la création du fichier system.prop"
    WEBUI_CONFIRM_RESTART="Paramètres enregistrés avec succès. Voulez-vous redémarrer le module pour appliquer les modifications?"
    WEBUI_LANGUAGE_TITLE="Langues disponibles"
    WEBUI_LANGUAGE_NAME="Français"
}

