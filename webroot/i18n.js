/**
 * AMMF WebUI 国际化模块
 * 提供多语言支持功能
 */

const I18n = {
    currentLang: 'zh',
    supportedLangs: ['zh', 'en', 'ru'],
    translations: {
        zh: {},
        en: {},
        ru: {}
    },

    async init() {
        try {
            console.log('开始初始化语言模块...');
            this.loadDefaultTranslations();
            await this.determineInitialLanguage();
            this.applyTranslations();
            this.initLanguageSelector();
            this.observeDOMChanges();
            console.log(`语言模块初始化完成: ${this.currentLang}`);
            return true;
        } catch (error) {
            console.error('初始化语言模块失败:', error);
            this.currentLang = 'zh';
            return false;
        }
    },

    loadDefaultTranslations() {
        // 加载翻译数据
        this.translations.zh = {
            NAV_STATUS: '状态',
            NAV_LOGS: '日志',
            NAV_SETTINGS: '设置',
            NAV_ABOUT: '关于',
            LOADING: '加载中...',
            REFRESH: '刷新',
            SAVE: '保存',
            CANCEL: '取消',
            CONFIRM: '确认',
            SUCCESS: '成功',
            ERROR: '错误',
            WARNING: '警告',
            SELECT_LANGUAGE: '选择语言',
            LANGUAGE_CHINESE: '中文',
            LANGUAGE_ENGLISH: 'English',
            LANGUAGE_RUSSIAN: 'Русский',
            MODULE_STATUS: '模块状态',
            RUNNING: '运行中',
            STOPPED: '已停止',
            ERROR: '错误',
            PAUSED: '已暂停',
            NORMAL_EXIT: '正常退出',
            UNKNOWN: '未知',
            DEVICE_INFO: '设备信息',
            STATUS_REFRESHED: '状态已刷新',
            STATUS_REFRESH_ERROR: '刷新状态失败',
            RUN_ACTION: '运行Action',
            NO_DEVICE_INFO: '无设备信息',
            DEVICE_MODEL: '设备型号',
            ANDROID_VERSION: 'Android版本',
            ANDROID_API: 'Android API',
            DEVICE_ABI: '设备架构',
            KERNEL_VERSION: '内核版本',
            MAGISK_VERSION: 'Magisk版本',
            KSU_VERSION: 'KernelSU版本',
            SAVE_SETTINGS: '保存设置',
            REFRESH_SETTINGS: '刷新设置',
            LOADING_SETTINGS: '加载设置中...',
            SETTINGS_REFRESHED: '设置已刷新',
            SETTINGS_REFRESH_ERROR: '刷新设置失败',
            SETTINGS_SAVED: '设置已保存',
            SETTINGS_SAVE_ERROR: '保存设置失败',
            NO_SETTINGS: '没有可用的设置',
            SETTING_DESCRIPTION: '设置描述',
            SETTING_VALUE: '设置值',
            MODULE_INFO: '模块信息',
            MODULE_ID: '模块ID',
            VERSION_DATE: '构建时间',
            MODULE_VERSION: '模块版本',
            VERSION: '版本',
            NO_INFO: '无可用信息',
            ABOUT_DESCRIPTION: 'AMMF模块管理界面',
            DEVELOPER: '开发者',
            LICENSE: '许可证',
            SUPPORT: '支持',
            GITHUB_REPO: 'GitHub仓库',
            OPEN_SOURCE: '开源项目',
            LOGS_DIR_NOT_FOUND: '日志目录不存在',
            LOGS_INIT_ERROR: '初始化日志页面失败',
            LOGS_DIR_CHECK_ERROR: '检查日志目录失败',
            LOGS_SCAN_ERROR: '扫描日志文件失败',
            LOGS_LOAD_ERROR: '加载日志失败',
            NO_LOG_SELECTED: '未选择日志文件',
            AUTO_REFRESH_STARTED: '自动刷新已启动',
            AUTO_REFRESH_STOPPED: '自动刷新已停止',
            LOG_FILE_NOT_FOUND: '日志文件不存在',
            CONFIRM_CLEAR_LOG: '确定要清除此日志文件吗？此操作不可撤销。',
            LOG_CLEARED: '日志已清除',
            LOG_CLEAR_ERROR: '清除日志失败',
            LOG_EXPORTED: '日志已导出到: {path}',
            LOG_EXPORT_ERROR: '导出日志失败',
            NO_LOGS_FILES: '没有找到日志文件',
            NO_LOGS: '没有可用的日志',
            REFRESH_LOGS: '刷新日志',
            EXPORT_LOGS: '导出日志',
            CLEAR_LOGS: '清除日志',
            LOGS_REFRESHED: '日志已刷新',
            LOGS_FILES_FOUND: '找到 {count} 个日志文件',
            LOG_FILE: '日志文件',
            LOG_LEVEL: '日志级别',
            LOG_LEVEL_ALL: '所有级别',
            LOG_LEVEL_ERROR: '错误',
            LOG_LEVEL_WARN: '警告',
            LOG_LEVEL_INFO: '信息',
            LOG_LEVEL_DEBUG: '调试',
            SEARCH_LOGS: '搜索日志...',
            DEVELOPER_INFO: '开发者信息',
            FRAMEWORK_DEVELOPER: '框架开发者',
            MODULE_DEVELOPER: '模块开发者',
            COPYRIGHT_INFO: 'Copyright (c) 2025 Aurora星空',
            AUTO_REFRESH: '自动刷新',
            SELECT_LOG_FILE: '选择日志文件',
            RESTORE: '还原',
            CONFIRM_REFRESH_UNSAVED: '有未保存的更改，确定要刷新吗？',
            UNSAVED_SETTINGS: '设置有未保存的更改',
            NO_SETTINGS_BACKUP: '没有可用的设置备份',
            SETTINGS_RESTORED: '设置已还原',
            SETTINGS_LOAD_ERROR: '加载设置失败',
            SETTINGS_INIT_ERROR: '设置页面初始化失败',
            ACTION_OUTPUT: 'Action输出',
            ACTION_STARTING: '正在启动Action...',
            RUNNING_ACTION: '正在运行Action...',
            ACTION_COMPLETED: 'Action运行完成',
            ACTION_ERROR: '运行Action失败',
            ROOT_IMPLEMENTATION: 'Root实现',
            HUE_VALUE: 'Hue值',
            APPLY: '应用',
            COLOR_PICKER: '颜色选择器',
            COLOR_CHANGED: '颜色已更改',
        };
        this.translations.en = {
            NAV_STATUS: 'Status',
            NAV_LOGS: 'Logs',
            NAV_SETTINGS: 'Settings',
            NAV_ABOUT: 'About',
            LOADING: 'Loading...',
            REFRESH: 'Refresh',
            SAVE: 'Save',
            CANCEL: 'Cancel',
            CONFIRM: 'Confirm',
            SUCCESS: 'Success',
            ERROR: 'Error',
            WARNING: 'Warning',
            SELECT_LANGUAGE: 'Select Language',
            LANGUAGE_CHINESE: '中文',
            LANGUAGE_ENGLISH: 'English',
            LANGUAGE_RUSSIAN: 'Русский',
            MODULE_STATUS: 'Module Status',
            RUNNING: 'Running',
            STOPPED: 'Stopped',
            ERROR: 'Error',
            PAUSED: 'Paused',
            NORMAL_EXIT: 'Normal Exit',
            UNKNOWN: 'Unknown',
            DEVICE_INFO: 'Device Info',
            STATUS_REFRESHED: 'Status Refreshed',
            STATUS_REFRESH_ERROR: 'Status Refresh Failed',
            RUN_ACTION: 'Run Action',
            NO_DEVICE_INFO: 'No device info',
            DEVICE_MODEL: 'Device model',
            ANDROID_VERSION: 'Android version',
            ANDROID_API: 'Android API',
            DEVICE_ABI: 'Device ABI',
            KERNEL_VERSION: 'Kernel version',
            MAGISK_VERSION: 'Magisk version',
            KSU_VERSION: 'KernelSU version',
            SAVE_SETTINGS: 'Save Settings',
            REFRESH_SETTINGS: 'Refresh Settings',
            LOADING_SETTINGS: 'Loading Settings...',
            SETTINGS_REFRESHED: 'Settings Refreshed',
            SETTINGS_REFRESH_ERROR: 'Settings Refresh Failed',
            SETTINGS_SAVED: 'Settings Saved',
            SETTINGS_SAVE_ERROR: 'Settings Save Failed',
            NO_SETTINGS: 'No Settings Available',
            SETTING_DESCRIPTION: 'Setting Description',
            SETTING_VALUE: 'Setting Value',
            MODULE_INFO: 'Module Info',
            MODULE_ID: 'Module ID',
            VERSION_DATE: 'Build Date',
            MODULE_VERSION: 'Module Version',
            VERSION: 'Version',
            NO_INFO: 'No Info Available',
            ABOUT_DESCRIPTION: 'AMMF Module Management Interface',
            DEVELOPER: 'Developer',
            LICENSE: 'License',
            SUPPORT: 'Support',
            GITHUB_REPO: 'GitHub Repository',
            OPEN_SOURCE: 'Open Source Project',
            LOGS_DIR_NOT_FOUND: 'Logs directory not found',
            LOGS_INIT_ERROR: 'Failed to initialize logs page',
            LOGS_DIR_CHECK_ERROR: 'Failed to check logs directory',
            LOGS_SCAN_ERROR: 'Failed to scan log files',
            LOGS_LOAD_ERROR: 'Failed to load logs',
            NO_LOG_SELECTED: 'No log file selected',
            AUTO_REFRESH_STARTED: 'Auto refresh started',
            AUTO_REFRESH_STOPPED: 'Auto refresh stopped',
            LOG_FILE_NOT_FOUND: 'Log file not found',
            CONFIRM_CLEAR_LOG: 'Are you sure you want to clear this log file? This action cannot be undone.',
            LOG_CLEARED: 'Log cleared',
            LOG_CLEAR_ERROR: 'Failed to clear log',
            LOG_EXPORTED: 'Log exported to: {path}',
            LOG_EXPORT_ERROR: 'Failed to export log',
            NO_LOGS_FILES: 'No log files found',
            NO_LOGS: 'No logs available',
            REFRESH_LOGS: 'Refresh logs',
            EXPORT_LOGS: 'Export logs',
            CLEAR_LOGS: 'Clear logs',
            LOGS_REFRESHED: 'Logs refreshed',
            LOGS_FILES_FOUND: 'Found {count} log files',
            LOG_FILE: 'Log File',
            LOG_LEVEL: 'Log Level',
            LOG_LEVEL_ALL: 'All Levels',
            LOG_LEVEL_ERROR: 'Error',
            LOG_LEVEL_WARN: 'Warning',
            LOG_LEVEL_INFO: 'Info',
            LOG_LEVEL_DEBUG: 'Debug',
            SEARCH_LOGS: 'Search logs...',
            DEVELOPER_INFO: 'Developer Info',
            FRAMEWORK_DEVELOPER: 'Framework Developer',
            MODULE_DEVELOPER: 'Module Developer',
            COPYRIGHT_INFO: 'Copyright (c) 2025 AuroraNasa',
            AUTO_REFRESH: 'Auto Refresh',
            SELECT_LOG_FILE: 'Select Log File',
            RESTORE: 'Restore',
            CONFIRM_REFRESH_UNSAVED: 'There are unsaved changes. Are you sure you want to refresh?',
            UNSAVED_SETTINGS: 'Settings have unsaved changes',
            NO_SETTINGS_BACKUP: 'No settings backup available',
            SETTINGS_RESTORED: 'Settings restored',
            SETTINGS_LOAD_ERROR: 'Failed to load settings',
            SETTINGS_INIT_ERROR: 'Failed to initialize settings page',
            ACTION_OUTPUT: 'Action Output',
            ACTION_STARTING: 'Starting Action...',
            RUNNING_ACTION: 'Running Action...',
            ACTION_COMPLETED: 'Action Completed',
            ACTION_ERROR: 'Action Failed',
            ROOT_IMPLEMENTATION: 'Root Implementation',
            HUE_VALUE: 'Hue value',
            APPLY: 'Apply',
            COLOR_PICKER: 'Color Picker',
            COLOR_CHANGED: 'Color changed',
            LOG_FILTER_PLACEHOLDER: 'Enter keywords to filter logs...',
            LOG_EMPTY: 'Log file is empty',
            LOG_LOADING: 'Loading logs...',
            LOG_SELECT_PROMPT: 'Please select a log file to view',
            LOG_LOAD_FAILED: 'Failed to load log, please check permissions or retry',
            LOG_FILTER_LEVEL: 'Filter by Level',
            LOG_FILTER_KEYWORD: 'Filter by Keyword',
            LOG_AUTO_SCROLL: 'Auto Scroll',
            LOG_WRAP_LINES: 'Wrap Lines',
            LOG_CLEAR_CONFIRM: 'Are you sure to clear the log? This action cannot be undone',
            LOG_EXPORT_SUCCESS: 'Log exported successfully',
            LOG_EXPORT_FAILED: 'Failed to export log',
            LOG_CLEAR_SUCCESS: 'Log cleared successfully',
            LOG_CLEAR_FAILED: 'Failed to clear log',
            UPDATE_CHECKING: 'Checking for updates...',
            UPDATE_AVAILABLE: 'New version available',
            UPDATE_NOT_AVAILABLE: 'Already up to date',
            UPDATE_ERROR: 'Failed to check updates',
            UPDATE_DOWNLOADING: 'Downloading update...',
            UPDATE_DOWNLOAD_SUCCESS: 'Update downloaded',
            UPDATE_DOWNLOAD_ERROR: 'Failed to download update',
            UPDATE_INSTALLING: 'Installing update...',
            UPDATE_INSTALL_SUCCESS: 'Update installed',
            UPDATE_INSTALL_ERROR: 'Failed to install update',
            UPDATE_RESTART_REQUIRED: 'Restart required to complete update'
        };
        this.translations.ru = {
            NAV_STATUS: 'Статус',
            NAV_LOGS: 'Журналы',
            NAV_SETTINGS: 'Настройки',
            NAV_ABOUT: 'О модуле',
            LOADING: 'Загрузка...',
            REFRESH: 'Обновить',
            SAVE: 'Сохранить',
            CANCEL: 'Отмена',
            CONFIRM: 'Подтвердить',
            SUCCESS: 'Успех',
            ERROR: 'Ошибка',
            WARNING: 'Предупреждение',
            SELECT_LANGUAGE: 'Выбрать язык',
            LANGUAGE_CHINESE: '中文',
            LANGUAGE_ENGLISH: 'English',
            LANGUAGE_RUSSIAN: 'Русский',
            MODULE_STATUS: 'Статус модуля',
            RUNNING: 'Работает',
            STOPPED: 'Остановлен',
            ERROR: 'Ошибка',
            PAUSED: 'Приостановлен',
            NORMAL_EXIT: 'Нормальный выход',
            UNKNOWN: 'Неизвестно',
            DEVICE_INFO: 'Информация об устройстве',
            STATUS_REFRESHED: 'Статус обновлен',
            STATUS_REFRESH_ERROR: 'Ошибка обновления статуса',
            RUN_ACTION: 'Выполнить действие',
            NO_DEVICE_INFO: 'Нет информации об устройстве',
            DEVICE_MODEL: 'Модель устройства',
            ANDROID_VERSION: 'Версия Android',
            ANDROID_API: 'Android API',
            DEVICE_ABI: 'Архитектура устройства',
            KERNEL_VERSION: 'Версия ядра',
            MAGISK_VERSION: 'Версия Magisk',
            KSU_VERSION: 'Версия KernelSU',
            SAVE_SETTINGS: 'Сохранить настройки',
            REFRESH_SETTINGS: 'Обновить настройки',
            LOADING_SETTINGS: 'Загрузка настроек...',
            SETTINGS_REFRESHED: 'Настройки обновлены',
            SETTINGS_REFRESH_ERROR: 'Ошибка обновления настроек',
            SETTINGS_SAVED: 'Настройки сохранены',
            SETTINGS_SAVE_ERROR: 'Ошибка сохранения настроек',
            NO_SETTINGS: 'Нет доступных настроек',
            SETTING_DESCRIPTION: 'Описание настройки',
            SETTING_VALUE: 'Значение настройки',
            MODULE_INFO: 'Информация о модуле',
            MODULE_ID: 'ID модуля',
            VERSION_DATE: 'Дата сборки',
            MODULE_VERSION: 'Версия модуля',
            VERSION: 'Версия',
            NO_INFO: 'Нет информации',
            ABOUT_DESCRIPTION: 'Интерфейс управления модулем AMMF',
            DEVELOPER: 'Разработчик',
            LICENSE: 'Лицензия',
            SUPPORT: 'Поддержка',
            GITHUB_REPO: 'Репозиторий GitHub',
            OPEN_SOURCE: 'Открытый проект',
            LOGS_DIR_NOT_FOUND: 'Каталог журналов не найден',
            LOGS_INIT_ERROR: 'Не удалось инициализировать страницу журналов',
            LOGS_DIR_CHECK_ERROR: 'Не удалось проверить каталог журналов',
            LOGS_SCAN_ERROR: 'Не удалось просканировать файлы журналов',
            LOGS_LOAD_ERROR: 'Не удалось загрузить журналы',
            NO_LOG_SELECTED: 'Файл журнала не выбран',
            AUTO_REFRESH_STARTED: 'Автообновление запущено',
            AUTO_REFRESH_STOPPED: 'Автообновление остановлено',
            LOG_FILE_NOT_FOUND: 'Файл журнала не найден',
            CONFIRM_CLEAR_LOG: 'Вы уверены, что хотите очистить этот файл журнала? Это действие нельзя отменить.',
            LOG_CLEARED: 'Журнал очищен',
            LOG_CLEAR_ERROR: 'Не удалось очистить журнал',
            LOG_EXPORTED: 'Журнал экспортирован в: {path}',
            LOG_EXPORT_ERROR: 'Не удалось экспортировать журнал',
            NO_LOGS_FILES: 'Файлы журналов не найдены',
            NO_LOGS: 'Нет доступных журналов',
            REFRESH_LOGS: 'Обновить журналы',
            EXPORT_LOGS: 'Экспортировать журналы',
            CLEAR_LOGS: 'Очистить журналы',
            LOGS_REFRESHED: 'Журналы обновлены',
            LOGS_FILES_FOUND: 'Найдено {count} файлов журналов',
            LOG_FILE: 'Файл журнала',
            LOG_LEVEL: 'Уровень журнала',
            LOG_LEVEL_ALL: 'Все уровни',
            LOG_LEVEL_ERROR: 'Ошибка',
            LOG_LEVEL_WARN: 'Предупреждение',
            LOG_LEVEL_INFO: 'Информация',
            LOG_LEVEL_DEBUG: 'Отладка',
            SEARCH_LOGS: 'Поиск в журналах...',
            DEVELOPER_INFO: 'Информация о разработчике',
            FRAMEWORK_DEVELOPER: 'Разработчик AMMF',
            MODULE_DEVELOPER: 'Разработчик модуля',
            COPYRIGHT_INFO: 'Copyright (c) 2025 AuroraNasa',
            AUTO_REFRESH: 'Автообновление',
            SELECT_LOG_FILE: 'Выбрать файл журнала',
            RESTORE: 'Восстановить',
            CONFIRM_REFRESH_UNSAVED: 'Есть несохраненные изменения. Вы уверены, что хотите обновить?',
            UNSAVED_SETTINGS: 'В настройках есть несохраненные изменения',
            NO_SETTINGS_BACKUP: 'Нет доступной резервной копии настроек',
            SETTINGS_RESTORED: 'Настройки восстановлены',
            SETTINGS_LOAD_ERROR: 'Не удалось загрузить настройки',
            SETTINGS_INIT_ERROR: 'Не удалось инициализировать страницу настроек',
            ACTION_OUTPUT: 'Вывод Action',
            ACTION_STARTING: 'Запуск Action...',
            RUNNING_ACTION: 'Выполнение Action...',
            ACTION_COMPLETED: 'Action завершен',
            ACTION_ERROR: 'Ошибка выполнения Action',
            ROOT_IMPLEMENTATION: 'Реализация Root',
            HUE_VALUE: 'Значение оттенка',
            APPLY: 'Применить',
            COLOR_PICKER: 'Выбор цвета',
            COLOR_CHANGED: 'Цвет изменен',
            LOG_FILTER_PLACEHOLDER: 'Введите ключевые слова для фильтрации журналов...',
            LOG_EMPTY: 'Файл журнала пуст',
            LOG_LOADING: 'Загрузка журналов...',
            LOG_SELECT_PROMPT: 'Выберите файл журнала для просмотра',
            LOG_LOAD_FAILED: 'Не удалось загрузить журнал, проверьте разрешения или повторите попытку',
            LOG_FILTER_LEVEL: 'Фильтр по уровню',
            LOG_FILTER_KEYWORD: 'Фильтр по ключевым словам',
            LOG_AUTO_SCROLL: 'Автопрокрутка',
            LOG_WRAP_LINES: 'Перенос строк',
            LOG_CLEAR_CONFIRM: 'Вы уверены, что хотите очистить журнал? Это действие нельзя отменить',
            LOG_EXPORT_SUCCESS: 'Журнал успешно экспортирован',
            LOG_EXPORT_FAILED: 'Не удалось экспортировать журнал',
            LOG_CLEAR_SUCCESS: 'Журнал успешно очищен',
            LOG_CLEAR_FAILED: 'Не удалось очистить журнал',
            UPDATE_CHECKING: 'Проверка обновлений...',
            UPDATE_AVAILABLE: 'Доступна новая версия',
            UPDATE_NOT_AVAILABLE: 'Установлена последняя версия',
            UPDATE_ERROR: 'Ошибка проверки обновлений',
            UPDATE_DOWNLOADING: 'Загрузка обновления...',
            UPDATE_DOWNLOAD_SUCCESS: 'Обновление загружено',
            UPDATE_DOWNLOAD_ERROR: 'Ошибка загрузки обновления',
            UPDATE_INSTALLING: 'Установка обновления...',
            UPDATE_INSTALL_SUCCESS: 'Обновление установлено',
            UPDATE_INSTALL_ERROR: 'Ошибка установки обновления',
            UPDATE_RESTART_REQUIRED: 'Требуется перезагрузка для завершения обновления'
        };
        console.log('默认翻译已加载');
    },

    async determineInitialLanguage() {
        try {
            const savedLang = localStorage.getItem('currentLanguage');
            if (savedLang && this.supportedLangs.includes(savedLang)) {
                this.currentLang = savedLang;
                return;
            }
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLangs.includes(browserLang)) {
                this.currentLang = browserLang;
                localStorage.setItem('currentLanguage', this.currentLang);
                return;
            }
            console.log(`使用默认语言: ${this.currentLang}`);
        } catch (error) {
            console.error('确定初始语言失败:', error);
        }
    },

    applyTranslations() {
        // 处理带有 data-i18n 属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.translate(key);
            if (translation) {
                el.textContent = translation;
            }
        });

        // 处理带有 data-i18n-placeholder 属性的元素
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.translate(key);
            if (translation) {
                el.setAttribute('placeholder', translation);
            }
        });

        // 处理带有 data-i18n-title 属性的元素
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = this.translate(key);
            if (translation) {
                el.setAttribute('title', translation);
            }
        });

        // 处理带有 data-i18n-label 属性的元素
        const labelElements = document.querySelectorAll('[data-i18n-label]');
        labelElements.forEach(el => {
            const key = el.getAttribute('data-i18n-label');
            const translation = this.translate(key);
            if (translation && el.querySelector('.switch-label')) {
                el.querySelector('.switch-label').textContent = translation;
            }
        });
    },

    translate(key, defaultText = '') {
        if (!key) return defaultText;
        
        // 支持参数替换，例如：translate('HELLO', '你好 {name}', {name: '张三'})
        if (arguments.length > 2 && typeof arguments[2] === 'object') {
            let text = this.translations[this.currentLang][key] || defaultText || key;
            const params = arguments[2];
            
            for (const param in params) {
                if (Object.prototype.hasOwnProperty.call(params, param)) {
                    text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
                }
            }
            
            return text;
        }
        
        return this.translations[this.currentLang][key] || defaultText || key;
    },

    initLanguageSelector() {
        const languageButton = document.getElementById('language-button');
        if (!languageButton) {
            console.error('找不到语言选择器按钮');
            return;
        }

        // 使用已有的语言选择器容器
        const languageSelector = document.getElementById('language-selector');
        if (!languageSelector) {
            console.error('找不到语言选择器容器');
            return;
        }

        // 设置语言按钮点击事件
        languageButton.addEventListener('click', () => {
            // 使用UI类的方法显示覆盖层
            if (window.UI && window.UI.showOverlay) {
                window.UI.showOverlay(languageSelector);
            } else {
                languageSelector.classList.add('active');
            }
        });

        // 添加点击遮罩关闭功能
        languageSelector.addEventListener('click', (event) => {
            // 如果点击的是语言选择器容器本身（即遮罩层），而不是其子元素
            if (event.target === languageSelector) {
                if (window.UI && window.UI.hideOverlay) {
                    window.UI.hideOverlay(languageSelector);
                } else {
                    languageSelector.classList.add('closing');
                    setTimeout(() => {
                        languageSelector.classList.remove('active');
                        languageSelector.classList.remove('closing');
                        languageSelector.style.display = 'none';
                        setTimeout(() => {
                            languageSelector.style.display = '';
                        }, 50);
                    }, 200);
                }
            }
        });

        // 设置取消按钮点击事件
        const cancelButton = document.getElementById('cancel-language');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                // 使用UI类的方法隐藏覆盖层
                if (window.UI && window.UI.hideOverlay) {
                    window.UI.hideOverlay(languageSelector);
                } else {
                    languageSelector.classList.remove('active');
                }
            });
        }
        
        // 更新语言选项
        this.updateLanguageSelector();
    },

    updateLanguageSelector() {
        const languageOptions = document.getElementById('language-options');
        if (!languageOptions) return;
        
        languageOptions.innerHTML = '';
        
        this.supportedLangs.forEach(lang => {
            const option = document.createElement('div');
            option.className = `language-option ${lang === this.currentLang ? 'selected' : ''}`;
            option.setAttribute('data-lang', lang);
            
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'language';
            radioInput.id = `lang-${lang}`;
            radioInput.value = lang;
            radioInput.checked = lang === this.currentLang;
            radioInput.className = 'md-radio';
            
            const label = document.createElement('label');
            label.htmlFor = `lang-${lang}`;
            label.textContent = this.getLanguageDisplayName(lang);
            
            option.appendChild(radioInput);
            option.appendChild(label);
            
            option.addEventListener('click', async () => {
                // 先关闭语言选择器，然后再切换语言
                const languageSelector = document.getElementById('language-selector');
                if (languageSelector) {
                    // 使用UI类的方法隐藏覆盖层
                    if (window.UI && window.UI.hideOverlay) {
                        window.UI.hideOverlay(languageSelector);
                    } else {
                        // 添加关闭动画类
                        languageSelector.classList.add('closing');
                        
                        // 确保动画完成后移除所有相关类
                        setTimeout(() => {
                            languageSelector.classList.remove('active');
                            languageSelector.classList.remove('closing');
                            languageSelector.style.display = 'none'; // 强制隐藏
                            
                            // 重置后恢复正常显示设置，但保持隐藏状态
                            setTimeout(() => {
                                languageSelector.style.display = '';
                            }, 50);
                        }, 200); // 与CSS动画时间匹配
                    }
                }
                
                // 切换语言
                if (lang !== this.currentLang) {
                    await this.setLanguage(lang);
                    this.updateLanguageSelector();
                }
            });
            
            languageOptions.appendChild(option);
        });
    },

    async setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.warn(`不支持的语言: ${lang}`);
            return false;
        }
        if (this.currentLang === lang) {
            console.log(`已经是当前语言: ${lang}`);
            return true;
        }
        this.currentLang = lang;
        localStorage.setItem('currentLanguage', lang);
        this.applyTranslations();
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
        console.log(`语言已切换为: ${lang}`);
        return true;
    },

    getLanguageDisplayName(lang) {
        switch (lang) {
            case 'zh': return this.translate('LANGUAGE_CHINESE', '中文');
            case 'en': return this.translate('LANGUAGE_ENGLISH', 'English');
            case 'ru': return this.translate('LANGUAGE_RUSSIAN', 'Русский');
            default: return lang.toUpperCase();
        }
    },

    observeDOMChanges() {
        // 使用 MutationObserver 监听 DOM 变化
        const observer = new MutationObserver((mutations) => {
            let shouldApply = false;
            
            // 检查是否有新增的需要翻译的元素
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查新增元素或其子元素是否包含需要翻译的属性
                            if (
                                node.hasAttribute && (
                                    node.hasAttribute('data-i18n') || 
                                    node.hasAttribute('data-i18n-placeholder') || 
                                    node.hasAttribute('data-i18n-title') ||
                                    node.hasAttribute('data-i18n-label') ||
                                    node.querySelector('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-label]')
                                )
                            ) {
                                shouldApply = true;
                                break;
                            }
                        }
                    }
                }
                
                if (shouldApply) break;
            }
            
            // 如果有需要翻译的元素，应用翻译
            if (shouldApply) {
                this.applyTranslations();
            }
        });
        
        // 配置观察选项
        const config = { 
            childList: true, 
            subtree: true 
        };
        
        // 开始观察 document.body
        observer.observe(document.body, config);
        
        // 监听页面变化事件
        document.addEventListener('pageChanged', () => {
            // 使用 requestAnimationFrame 确保在下一帧渲染前应用翻译
            requestAnimationFrame(() => this.applyTranslations());
        });
        
        // 监听语言变化事件
        document.addEventListener('languageChanged', () => {
            this.applyTranslations();
        });
    }
};

// 导出 I18n 模块
window.I18n = I18n;
