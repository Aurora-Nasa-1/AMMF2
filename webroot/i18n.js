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
            DEVELOPER_INFO: '开发者信息',
            FRAMEWORK_DEVELOPER: '框架开发者',
            MODULE_DEVELOPER: '模块开发者',
            COPYRIGHT_INFO: 'Copyright (c) 2025 Aurora星空',
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
            DEVELOPER_INFO: 'Developer Info',
            FRAMEWORK_DEVELOPER: 'Framework Developer',
            MODULE_DEVELOPER: 'Module Developer',
            COPYRIGHT_INFO: 'Copyright (c) 2025 AuroraNasa',
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
            DEVELOPER_INFO: 'Информация о разработчике',
            FRAMEWORK_DEVELOPER: 'Разработчик AMMF',
            MODULE_DEVELOPER: 'Разработчик модуля',
            COPYRIGHT_INFO: 'Copyright (c) 2025 AuroraNasa',
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
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.translate(key);
            if (translation) {
                el.textContent = translation;
            }
        });
    },

    translate(key, defaultText = '') {
        return this.translations[this.currentLang][key] || defaultText || key;
    },

    initLanguageSelector() {
        const languageButton = document.getElementById('language-button');
        const languageSelector = document.getElementById('language-selector');
        const languageOptions = document.getElementById('language-options');
        const cancelButton = document.getElementById('cancel-language');

        if (!languageButton || !languageSelector || !languageOptions) {
            console.error('找不到语言选择器必要的DOM元素');
            return;
        }

        this.updateLanguageSelector();

        languageButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.updateLanguageSelector();
            languageSelector.classList.add('show');
        });

        cancelButton.addEventListener('click', () => {
            languageSelector.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (languageSelector.classList.contains('show') && !languageSelector.contains(e.target) && e.target !== languageButton) {
                languageSelector.classList.remove('show');
            }
        });
    },

    updateLanguageSelector() {
        const languageOptions = document.getElementById('language-options');
        languageOptions.innerHTML = '';
        this.supportedLangs.forEach(lang => {
            const option = document.createElement('div');
            option.className = `language-option ${lang === this.currentLang ? 'active' : ''}`;
            option.setAttribute('data-lang', lang);
            option.textContent = this.getLanguageDisplayName(lang);
            option.addEventListener('click', async () => {
                if (lang !== this.currentLang) {
                    await this.setLanguage(lang);
                }
                document.getElementById('language-selector')?.classList.remove('show');
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
        const observer = new MutationObserver(() => {
            this.applyTranslations();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        document.addEventListener('pageChanged', () => {
            setTimeout(() => this.applyTranslations(), 100);
        });
        document.addEventListener('languageChanged', () => {
            this.applyTranslations();
        });
    }
};

// 导出国际化模块
window.I18n = I18n;
