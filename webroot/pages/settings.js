/**
 * AMMF WebUI 设置页面模块
 * 管理模块配置设置
 */

const SettingsPage = {
    // 核心数据
    settings: {},
    settingsBackup: {},
    hasUnsavedChanges: false,
    tempFormState: {},

    // 元数据
    excludedSettings: [],
    settingsDescriptions: {},
    settingsOptions: {},

    // 状态标志
    isLoading: false,
    isCancelled: false,

    // 预加载数据
    async preloadData() {
        try {
            const [settingsData, settingsMetadata] = await Promise.all([
                this.loadSettingsData(),
                this.loadSettingsMetadata()
            ]);
            return { settingsData, settingsMetadata };
        } catch (error) {
            console.error('预加载设置数据失败:', error);
            return null;
        }
    },

    // 使用预加载的数据初始化
    async init(preloadedData) {
        try {
            this.isCancelled = false;
            this.registerActions();
            
            // 注册语言切换处理器
            I18n.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));
            
            // 如果有临时表单状态且有未保存的更改，优先使用临时状态
            if (this.tempFormState && Object.keys(this.tempFormState).length > 0 && this.hasUnsavedChanges) {
                console.log('恢复未保存的设置更改');
                if (!this.settingsDescriptions) {
                    await this.loadSettingsMetadata();
                }
                this.settings = { ...this.tempFormState };
                return true;
            }

            this.hasUnsavedChanges = false;
            // 使用预加载的数据或重新加载
            if (preloadedData) {
                this.settings = preloadedData.settingsData;
                this.settingsDescriptions = preloadedData.settingsMetadata.descriptions;
                this.settingsOptions = preloadedData.settingsMetadata.options;
                this.excludedSettings = preloadedData.settingsMetadata.excluded;
            } else {
                await this.loadSettingsData();
                await this.loadSettingsMetadata();
            }

            // 创建设置备份
            this.createSettingsBackup();

            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            return false;
        }
    },

    // 添加语言切换处理方法
    onLanguageChanged() {
        const settingsContainer = document.getElementById('settings-container');
        if (settingsContainer) {
            settingsContainer.innerHTML = this.renderSettings();
            // 使用 requestAnimationFrame 延迟 afterRender 的执行，确保在浏览器完成 DOM 更新后执行
            requestAnimationFrame(() => {
                this.afterRender();
            });
        }
    },

    // 修改 registerActions 方法，添加禁用状态控制
    registerActions() {
        UI.registerPageActions('settings', [
            {
                id: 'save-settings',
                icon: 'save',
                title: I18n.translate('SAVE_SETTINGS', '保存设置'),
                onClick: 'saveSettings',
            },
            {
                id: 'restore-settings',
                icon: 'restore',
                title: I18n.translate('RESTORE_SETTINGS', '还原设置'),
                onClick: 'restoreSettings',
            }
        ]);
    },

    // 创建设置备份
    createSettingsBackup() {
        // 创建深拷贝，但排除内部使用的属性
        const cleanSettings = {};
        for (const key in this.settings) {
            if (!key.startsWith('_')) {
                cleanSettings[key] = this.settings[key];
            }
        }
        this.settingsBackup = JSON.parse(JSON.stringify(cleanSettings));
    },

    // 渲染页面
    render() {
        return `
            <div class="settings-content">
                <div id="settings-container">
                    <div class="loading-placeholder">
                        ${I18n.translate('LOADING_SETTINGS', '正在加载设置...')}
                    </div>
                </div>
                <div id="settings-loading" class="loading-overlay">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
    },
    isExcluded(key) {
        return this.excludedSettings.some(pattern => {
            // 如果模式包含通配符
            if (pattern.includes('*')) {
                // 将通配符转换为正则表达式
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(key);
            }
            // 无通配符时直接比较
            return pattern === key;
        });
    },
    // 渲染设置项
    renderSettings() {
        if (!this.settings || Object.keys(this.settings).filter(key => !key.startsWith('_')).length === 0) {
            this.settings = this.getTestSettings();
            this.createSettingsBackup();
        }

        let html = '';

        // 修改排序和过滤逻辑
        const sortedSettings = Object.keys(this.settings)
            .filter(key => {
                // 跳过内部属性
                if (key.startsWith('_')) return false;

                // 检查是否匹配任何排除规则
                return !this.isExcluded(key);
            })
            .sort();

        for (const key of sortedSettings) {
            const value = this.settings[key];
            const description = this.getSettingDescription(key);

            html += `
                <div class="setting-item" data-key="${key}">
                    ${this.renderSettingControl(key, value, description)}
                </div>
            `;
        }

        return html;
    },

    // 获取测试设置数据 - 简化版
    getTestSettings() {
        return {
            // 布尔值设置
            ENABLE_FEATURE_A: true,
            ENABLE_FEATURE_B: false,
            
            // 数字设置
            SERVER_PORT: 8080,
            
            // 文本设置
            API_KEY: "test_api_key_12345",
            
            // 选择项设置
            LOG_LEVEL: "info",
            THEME: "auto",
            
            // 数字滑条设置
            VOLUME: 75,
            BRIGHTNESS: 80,
            
            // 添加测试排除项
            APP_TEST_1: "should_be_excluded",
            APP_TEST_2: "should_be_excluded",
            SYSTEM_TEMP: "should_be_excluded",
            ACTION_TEST: "should_be_excluded"
        };
    },

    // 渲染设置控件
    renderSettingControl(key, value, description) {
        // 检查是否有预定义选项
        if (this.settingsOptions[key]) {
            return this.renderSelectControl(key, value, description);
        }

        // 根据值类型渲染不同控件
        if (typeof value === 'boolean') {
            return this.renderBooleanControl(key, value, description);
        } else if (typeof value === 'number') {
            return this.renderNumberControl(key, value, description);
        } else {
            return this.renderTextControl(key, value, description);
        }
    },

    // 渲染布尔值控件
    renderBooleanControl(key, value, description) {
        return `
            <div class="switches">
                <label>
                    ${description}
                    <input type="checkbox" id="setting-${key}" ${value ? 'checked' : ''}>
                </label>
            </div>
        `;
    },

    // 渲染数字控件
    renderNumberControl(key, value, description) {
        // 使用 MD3 数字输入框
        return `
            <label>
                <span>${description}</span>
                <input type="number" id="setting-${key}" value="${value}" class="md3-input">
            </label>
        `;
    },

    // 渲染文本控件
    renderTextControl(key, value, description) {
        // 确保值是字符串并进行HTML转义
        const safeValue = typeof value === 'string'
            ? this.escapeHtml(value)
            : value;

        return `
            <label>
                <span>${description}</span>
                <input type="text" id="setting-${key}" value="${safeValue}">
            </label>
        `;
    },

    // HTML转义函数，防止XSS
    escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // 渲染选择控件
    renderSelectControl(key, value, description) {
        const options = this.settingsOptions[key]?.options || [];
        if (options.length === 0) {
            return this.renderTextControl(key, value, description);
        }

        let html = `
            <label>
                <span>${description}</span>
                <select id="setting-${key}">`;

        for (const option of options) {
            const optionValue = option.value;
            // 获取当前语言的标签，如果没有则使用值本身
            const label = option.label ? (option.label[I18n.currentLang] || option.label.en || optionValue) : optionValue;

            html += `<option value="${optionValue}" ${optionValue === value ? 'selected' : ''}>${label}</option>`;
        }

        html += `
                </select>
            </label>
        `;
        return html;
    },

    // 获取设置描述
    getSettingDescription(key) {
        if (this.settingsDescriptions[key]) {
            // 获取当前语言的描述，如果没有则使用英文描述
            return this.settingsDescriptions[key][I18n.currentLang] ||
                this.settingsDescriptions[key].en ||
                key;
        }
        return key;
    },

    // 加载设置数据
    async loadSettingsData() {
        try {
            this.showLoading();

            // 如果已经有缓存的设置数据,直接使用
            if (this.settings && Object.keys(this.settings).filter(key => !key.startsWith('_')).length > 0) {
                return;
            }

            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;

            // 检查是否已取消
            if (this.isCancelled) return;

            // 添加超时控制
            const configContent = await Promise.race([
                Core.execCommand(`cat "${configPath}"`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('加载超时')), 5000))
            ]);

            // 再次检查是否已取消
            if (this.isCancelled) return;

            if (!configContent) {
                console.warn('配置文件为空或不存在');
                return;
            }

            this.settings = this.parseConfigFile(configContent);
        } catch (error) {
            console.error('加载设置数据失败:', error);
            Core.showToast(I18n.translate('SETTINGS_LOAD_ERROR', '加载设置失败'), 'error');
        } finally {
            this.hideLoading();
        }
    },

    // 解析配置文件
    parseConfigFile(content) {
        const settings = {};
        const lines = content.split('\n');

        // 存储原始配置信息，用于保存时恢复格式
        settings._configInfo = {
            lines: lines,
            formats: {}
        };

        for (const line of lines) {
            // 跳过空行
            if (line.trim() === '') continue;

            // 提取注释之前的实际内容
            const commentIndex = line.indexOf('#');
            const effectiveLine = commentIndex !== -1 ? line.substring(0, commentIndex) : line;
            const comment = commentIndex !== -1 ? line.substring(commentIndex) : '';
            const commentSpacing = commentIndex !== -1 ? line.substring(0, commentIndex).match(/\s*$/)[0] : '';

            // 如果去除注释后是空行则跳过
            if (effectiveLine.trim() === '') continue;

            // 匹配变量赋值，保留原始值格式
            const match = effectiveLine.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
            if (match) {
                const key = match[1];
                const originalValue = match[2].trim();
                let value = originalValue;

                // 记录格式信息
                settings._configInfo.formats[key] = {
                    comment,
                    commentSpacing,
                    hasDoubleQuotes: value.startsWith('"') && value.endsWith('"'),
                    hasSingleQuotes: value.startsWith("'") && value.endsWith("'")
                };

                // 如果值带有引号，去除引号用于内部处理
                if (settings._configInfo.formats[key].hasDoubleQuotes ||
                    settings._configInfo.formats[key].hasSingleQuotes) {
                    value = value.substring(1, value.length - 1);
                }

                // 转换布尔值
                const lowerValue = value.toLowerCase();
                if (lowerValue === 'true' || lowerValue === 'false') {
                    settings[key] = lowerValue === 'true';
                }
                // 转换数字
                else if (!isNaN(value) && value.trim() !== '' && !isNaN(parseFloat(value))) {
                    settings[key] = Number(value);
                }
                // 保留字符串
                else {
                    settings[key] = value;
                }
            }
        }

        return settings;
    },

    // 加载设置元数据
    async loadSettingsMetadata() {
        try {
            const metadataPath = `${Core.MODULE_PATH}module_settings/settings.json`;

            // 检查是否已取消
            if (this.isCancelled) return;

            const metadataContent = await Core.execCommand(`cat "${metadataPath}"`);

            // 再次检查是否已取消
            if (this.isCancelled) return;

            if (!metadataContent) {
                console.warn('设置元数据文件为空或不存在');
                this.setupTestMetadata();
                return;
            }

            const metadata = JSON.parse(metadataContent);

            // 设置排除项
            this.excludedSettings = metadata.excluded || [];

            // 设置描述
            this.settingsDescriptions = metadata.descriptions || {};

            // 设置选项
            this.settingsOptions = metadata.options || {};
        } catch (error) {
            console.error('加载设置元数据失败:', error);
            this.setupTestMetadata();
        }
    },

    // 设置测试元数据
    setupTestMetadata() {
        // 设置描述
        this.settingsDescriptions = {
            ENABLE_FEATURE_A: { zh: "启用功能A", en: "Enable Feature A" },
            ENABLE_FEATURE_B: { zh: "启用功能B", en: "Enable Feature B" },
            SERVER_PORT: { zh: "服务器端口", en: "Server Port" },
            API_KEY: { zh: "API密钥", en: "API Key" },
            LOG_LEVEL: { zh: "日志级别", en: "Log Level" },
            THEME: { zh: "主题", en: "Theme" },
            VOLUME: { zh: "音量", en: "Volume" },
            BRIGHTNESS: { zh: "亮度", en: "Brightness" }
        };
    
        // 设置选项配置
        this.settingsOptions = {
            LOG_LEVEL: {
                options: [
                    { value: "debug", label: { zh: "调试", en: "Debug" } },
                    { value: "info", label: { zh: "信息", en: "Info" } },
                    { value: "warn", label: { zh: "警告", en: "Warning" } },
                    { value: "error", label: { zh: "错误", en: "Error" } }
                ]
            },
            THEME: {
                options: [
                    { value: "auto", label: { zh: "自动", en: "Auto" } },
                    { value: "light", label: { zh: "浅色", en: "Light" } },
                    { value: "dark", label: { zh: "深色", en: "Dark" } }
                ]
            }
        };
    
        // 添加测试排除规则
        this.excludedSettings = [
            "APP_*",      // 排除所有以APP_开头的设置项
            "SYSTEM_TEMP", // 精确排除SYSTEM_TEMP
            "ACTION_*"    // 排除所有以ACTION_开头的设置项
        ];
    },

    // 保存设置
    async saveSettings() {
        try {
            this.showLoading();

            // 收集表单数据
            const updatedSettings = {};
            for (const key in this.settings) {
                // 跳过内部属性和排除项
                if (key.startsWith('_') || this.excludedSettings.includes(key)) continue;

                const element = document.getElementById(`setting-${key}`);
                if (!element) continue;

                if (element.type === 'checkbox') {
                    updatedSettings[key] = element.checked;
                } else if (element.type === 'number' || element.type === 'range') {
                    updatedSettings[key] = Number(element.value);
                } else {
                    updatedSettings[key] = element.value;
                }
            }

            // 获取配置文件路径
            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;

            // 检查是否有配置信息
            if (!this.settings._configInfo) {
                // 如果没有配置信息，先读取原始配置
                const originalConfig = await Core.execCommand(`cat "${configPath}"`);
                if (originalConfig) {
                    // 解析原始配置以获取格式信息
                    const tempSettings = this.parseConfigFile(originalConfig);
                    this.settings._configInfo = tempSettings._configInfo;
                } else {
                    // 如果无法读取原始配置，创建一个空的配置信息
                    this.settings._configInfo = {
                        lines: [],
                        formats: {}
                    };
                }
            }

            // 生成新的配置文件内容
            let configContent = '';

            // 首先处理排除项，保持它们原样
            const excludedLines = new Set();
            if (this.settings._configInfo.lines) {
                for (const line of this.settings._configInfo.lines) {
                    const match = line.match(/^([A-Za-z0-9_]+)\s*=/);
                    if (match && this.excludedSettings.includes(match[1])) {
                        configContent += line + '\n';
                        excludedLines.add(line);
                    }
                }
            }

            // 然后处理更新的设置项
            for (const key in updatedSettings) {
                let value = updatedSettings[key];
                const format = this.settings._configInfo.formats[key] || {};

                // 根据原始格式和设置类型处理值
                if (typeof value === 'string') {
                    // 如果是预定义选项的设置项，强制使用双引号
                    if (this.settingsOptions[key]) {
                        value = `"${value}"`;
                    }
                    // 否则按原有格式处理
                    else if (format.hasDoubleQuotes) {
                        value = `"${value}"`;
                    } else if (format.hasSingleQuotes) {
                        value = `'${value}'`;
                    } else if (value.includes(' ') || value === '') {
                        value = `"${value}"`;
                    }
                } else if (typeof value === 'boolean') {
                    value = value ? 'true' : 'false';
                }

                // 添加注释
                configContent += `${key}=${value}${format.comment ? `${format.commentSpacing || ' '}${format.comment}` : ''}\n`;
            }

            // 检查是否已取消
            if (this.isCancelled) return;

            // 保存配置文件
            await Core.execCommand(`echo '${configContent.replace(/'/g, "'\\''")}' > "${configPath}"`);

            // 再次检查是否已取消
            if (this.isCancelled) return;

            // 更新本地设置
            const configInfo = this.settings._configInfo;

            // 更新设置对象，保留内部属性
            for (const key in this.settings) {
                if (!key.startsWith('_')) {
                    delete this.settings[key];
                }
            }

            // 添加更新后的设置
            for (const key in updatedSettings) {
                this.settings[key] = updatedSettings[key];
            }

            // 保留配置信息
            this.settings._configInfo = configInfo;

            // 更新备份
            this.createSettingsBackup();

            // 重置未保存更改标志
            this.hasUnsavedChanges = false;

            // 清除临时表单状态
            this.tempFormState = {};

            // 显示成功消息
            Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'));
        } catch (error) {
            console.error('保存设置失败:', error);
            if (!this.isCancelled) {
                Core.showToast(I18n.translate('SETTINGS_SAVE_ERROR', '保存设置失败'), 'error');
            }
        } finally {
            if (!this.isCancelled) {
                this.hideLoading();
            }
        }
    },

    // 还原设置
    restoreSettings() {
        if (!this.settingsBackup || Object.keys(this.settingsBackup).length === 0) {
            Core.showToast(I18n.translate('NO_SETTINGS_BACKUP', '没有可用的设置备份'), 'error');
            return;
        }

        // 保存配置信息
        const configInfo = this.settings._configInfo;

        // 恢复设置
        this.settings = JSON.parse(JSON.stringify(this.settingsBackup));

        // 恢复配置信息
        if (configInfo) {
            this.settings._configInfo = configInfo;
        }

        // 更新设置显示
        this.updateSettingsDisplay();

        // 重置未保存更改标志
        this.hasUnsavedChanges = false;

        // 清除临时表单状态
        this.tempFormState = {};

        // 显示成功消息
        Core.showToast(I18n.translate('SETTINGS_RESTORED', '设置已还原'));
    },

    // 检查是否有未保存的更改
    checkForUnsavedChanges() {
        if (!this.settings || !this.settingsBackup) return false;

        // 收集当前表单数据
        const currentSettings = {};
        for (const key in this.settings) {
            // 跳过内部属性和排除项
            if (key.startsWith('_') || this.excludedSettings.includes(key)) continue;

            const element = document.getElementById(`setting-${key}`);
            if (!element) continue;

            if (element.type === 'checkbox') {
                currentSettings[key] = element.checked;
            } else if (element.type === 'number' || element.type === 'range') {
                currentSettings[key] = Number(element.value);
            } else {
                currentSettings[key] = element.value;
            }
        }

        // 比较当前设置和备份
        for (const key in currentSettings) {
            if (this.excludedSettings.includes(key)) continue;

            // 检查类型和值是否相同
            const currentValue = currentSettings[key];
            const backupValue = this.settingsBackup[key];

            if (typeof currentValue !== typeof backupValue) {
                return true;
            }

            if (typeof currentValue === 'object') {
                if (JSON.stringify(currentValue) !== JSON.stringify(backupValue)) {
                    return true;
                }
            } else if (currentValue !== backupValue) {
                return true;
            }
        }

        return false;
    },

    // 刷新设置
    async refreshSettings() {
        try {
            // 检查是否有未保存的更改
            if (this.checkForUnsavedChanges()) {
                const confirmRefresh = confirm(I18n.translate('CONFIRM_REFRESH_UNSAVED', '有未保存的更改，确定要刷新吗？'));
                if (!confirmRefresh) return;
            }

            // 清空设置数据，强制重新加载
            this.settings = {};

            await this.loadSettingsData();
            await this.loadSettingsMetadata();

            // 更新设置显示
            this.updateSettingsDisplay();

            // 创建新的备份
            this.createSettingsBackup();

            // 重置未保存更改标志
            this.hasUnsavedChanges = false;

            Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
        } catch (error) {
            console.error('刷新设置失败:', error);
            Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置失败'), 'error');
        }
    },

    // 更新设置显示
    updateSettingsDisplay() {
        const settingsContainer = document.getElementById('settings-container');
        if (settingsContainer) {
            settingsContainer.innerHTML = this.renderSettings();
            // 重新绑定事件
            this.bindSettingEvents();
        }
    },

    // 显示加载中
    showLoading() {
        if (this.isLoading) return;

        this.isLoading = true;
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
            loadingElement.style.visibility = 'visible';
            loadingElement.style.opacity = '1';
        }
    },

    // 隐藏加载中
    hideLoading() {
        if (!this.isLoading) return;

        this.isLoading = false;
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            loadingElement.style.visibility = 'hidden';

            setTimeout(() => {
                if (!this.isLoading) {
                    loadingElement.style.display = 'none';
                }
            }, 300);
        }
    },

    // 保存临时表单状态
    saveTemporaryFormState() {
        if (!this.hasUnsavedChanges) return;

        // 收集当前表单数据
        const tempSettings = { ...this.settings };

        for (const key in this.settings) {
            // 跳过内部属性和排除项
            if (key.startsWith('_') || this.excludedSettings.includes(key)) continue;

            const element = document.getElementById(`setting-${key}`);
            if (!element) continue;

            if (element.type === 'checkbox') {
                tempSettings[key] = element.checked;
            } else if (element.type === 'number' || element.type === 'range') {
                tempSettings[key] = Number(element.value);
            } else {
                tempSettings[key] = element.value;
            }
        }

        // 保存临时状态
        this.tempFormState = tempSettings;
    },

    // 渲染后的回调
    async afterRender() {
        try {
            // 显示加载状态
            this.showLoading();

            // 等待设置数据加载完成
            await this.init();

            // 更新设置显示
            this.updateSettingsDisplay();
            // 绑定设置项事件
            this.bindSettingEvents();
        } catch (error) {
            console.error('设置页面初始化失败:', error);
            Core.showToast(I18n.translate('SETTINGS_INIT_ERROR', '设置页面初始化失败'), 'error');
        } finally {
            this.hideLoading();
        }
    },

    // 绑定设置项事件
    bindSettingEvents() {
        // 使用事件委托替代单独绑定
        const container = document.getElementById('settings-container');
        if (container) {
            // 监听输入变化
            container.addEventListener('change', (e) => {
                const target = e.target;
                if (target.tagName === 'SELECT' || target.tagName === 'INPUT') {
                    // 标记有未保存的更改
                    this.hasUnsavedChanges = this.checkForUnsavedChanges();

                    // 保存临时表单状态
                    this.saveTemporaryFormState();
                }
            });

            // 监听输入事件，实时更新滑动条值显示
            container.addEventListener('input', (e) => {
                const target = e.target;
                if (target.type === 'range') {
                    const output = target.nextElementSibling;
                    if (output && output.tagName === 'OUTPUT') {
                        output.textContent = target.value;
                    }

                    // 标记有未保存的更改
                    this.hasUnsavedChanges = this.checkForUnsavedChanges();

                    // 保存临时表单状态
                    this.saveTemporaryFormState();
                }
            });
        }
    },

    // 页面激活时的回调
    onActivate() {
        // 重置取消标志
        this.isCancelled = false;
    },

    // 页面停用时的回调
    onDeactivate() {
        // 检查是否有未保存的更改
        if (this.hasUnsavedChanges || this.checkForUnsavedChanges()) {
            Core.showToast(I18n.translate('UNSAVED_SETTINGS', '设置有未保存的更改'), 'warning');
        }
        // 注销语言切换处理器
        I18n.unregisterLanguageChangeHandler(this.onLanguageChanged.bind(this));
        // 清理页面操作按钮
        UI.clearPageActions();
        // 设置取消标志，用于中断正在进行的异步操作
        this.isCancelled = true;
        // 清理资源
        this.cleanupResources();
    },

    // 清理资源
    cleanupResources() {
        // 移除可能存在的事件监听器
        const container = document.getElementById('settings-container');
        if (container) {
            // 使用克隆节点的方式移除所有事件监听器
            const newContainer = container.cloneNode(true);
            container.parentNode.replaceChild(newContainer, container);
        }

        // 移除页面操作按钮的事件监听器
        const restoreButton = document.getElementById('restore-settings');
        if (restoreButton) {
            restoreButton.replaceWith(restoreButton.cloneNode(true));
        }

        const refreshButton = document.getElementById('refresh-settings');
        if (refreshButton) {
            refreshButton.replaceWith(refreshButton.cloneNode(true));
        }

        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.replaceWith(saveButton.cloneNode(true));
        }
    }
};

// 导出设置页面模块
window.SettingsPage = SettingsPage;