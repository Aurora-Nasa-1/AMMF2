/**
 * AMMF WebUI 状态页面模块
 * 显示模块运行状态和基本信息
 */

const StatusPage = {
    // 模块状态
    moduleStatus: 'UNKNOWN',

    // 自动刷新定时器
    refreshTimer: null,

    // 设备信息
    deviceInfo: {},

    // 版本信息
    currentVersion: 'v114514',
    GitHubRepo: 'Aurora-Nasa-1/AMMF',
    latestVersion: null,
    updateAvailable: false,
    updateChecking: false,
    logCount: 0,
    // 测试模式配置
    testMode: {
        enabled: false,
        mockVersion: null
    },

    async checkUpdate() {
        if (this.updateChecking) return; // 避免重复检查
        this.updateChecking = true;
    
        try {
            if (this.testMode.enabled) {
                this.latestVersion = this.testMode.mockVersion;
            } else {
                this.latestVersion = await this.getLatestVersion();
            }
            
            if (this.latestVersion) {
                const currentVersionParsed = this.parseVersion(this.currentVersion);
                if (!currentVersionParsed) {
                    throw new Error(`当前版本号格式无效: ${this.currentVersion}`);
                }
                this.updateAvailable = this.compareVersions(this.latestVersion, this.currentVersion) > 0;
                this.updateError = null; // 清除之前的错误
            } else {
                this.updateAvailable = false;
                this.updateError = null; // 不显示错误，因为可能是没有发布版本
            }
    
            // 修改这里：不直接操作 DOM，而是触发一个自定义事件
            const event = new CustomEvent('updateCheckComplete', {
                detail: {
                    available: this.updateAvailable,
                    version: this.latestVersion
                }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.warn('检查更新失败:', error);
            this.updateAvailable = false;
            this.updateError = error.message;
        } finally {
            this.updateChecking = false;
        }
    },

    renderUpdateBanner() {
        if (this.updateChecking) {
            return `
                <div class="update-banner checking">
                    <div class="update-info">
                        <div class="update-icon">
                            <span class="material-symbols-rounded">sync</span>
                        </div>
                        <div class="update-text">
                            <span>${I18n.translate('CHECKING_UPDATE', '正在检查更新...')}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        if (this.updateError) {
            return `
                <div class="update-banner error">
                    <div class="update-info">
                        <div class="update-icon">
                            <span class="material-symbols-rounded">error</span>
                        </div>
                        <div class="update-text">
                            <span>${this.updateError}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        if (this.updateAvailable) {
            return `
                <div class="update-banner">
                    <div class="update-info">
                        <div class="update-icon">
                            <span class="material-symbols-rounded">system_update</span>
                        </div>
                        <div class="update-text">
                            <span>${I18n.translate('UPDATE_AVAILABLE', '有新版本可用')}: ${this.latestVersion}</span>
                        </div>
                    </div>
                    <button class="update-button md3-button" onclick="window.open('https://github.com/${this.GitHubRepo}/releases/latest', '_blank')">
                        <span class="material-symbols-rounded">open_in_new</span>
                        <span>${I18n.translate('VIEW_UPDATE', '查看更新')}</span>
                    </button>
                </div>
            `;
        }

        return '';
    },

    // 版本检查相关方法
    parseVersion(versionStr) {
        // 支持四段式版本号和带有后缀的版本号，包括下划线和连字符分隔
        const cleanVersion = versionStr.replace(/^v/, '').replace(/[_-]/g, '-');
        const match = cleanVersion.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?(?:[-.]?([A-Za-z]+\d*)?)?$/);
        if (!match) return null;

        return {
            major: parseInt(match[1] || '0'),
            minor: parseInt(match[2] || '0'),
            patch: parseInt(match[3] || '0'),
            build: parseInt(match[4] || '0'),
            suffix: match[5] || null  // 版本后缀（如FIX）
        };
    },

    compareVersions(v1, v2) {
        const v1Parts = this.parseVersion(v1);
        const v2Parts = this.parseVersion(v2);

        if (!v1Parts || !v2Parts) return 0;

        // 比较主版本号
        if (v1Parts.major !== v2Parts.major) {
            return v1Parts.major - v2Parts.major;
        }

        // 比较次版本号
        if (v1Parts.minor !== v2Parts.minor) {
            return v1Parts.minor - v2Parts.minor;
        }

        // 比较修订号
        if (v1Parts.patch !== v2Parts.patch) {
            return v1Parts.patch - v2Parts.patch;
        }

        // 比较构建号（第四段版本号）
        if (v1Parts.build !== v2Parts.build) {
            return v1Parts.build - v2Parts.build;
        }

        // 处理版本后缀
        if (!v1Parts.suffix && !v2Parts.suffix) return 0;
        if (!v1Parts.suffix) return 1;
        if (!v2Parts.suffix) return -1;

        // 对特殊后缀进行优先级排序
        const suffixPriority = {
            'RELEASE': 3,
            'FIX': 2,
            'BETA': 1,
            'ALPHA': 0
        };

        const v1Priority = suffixPriority[v1Parts.suffix.toUpperCase()] ?? -1;
        const v2Priority = suffixPriority[v2Parts.suffix.toUpperCase()] ?? -1;

        if (v1Priority !== v2Priority) {
            return v1Priority - v2Priority;
        }

        // 如果优先级相同，按字母顺序比较
        return v1Parts.suffix.localeCompare(v2Parts.suffix);
    },

    async getLatestVersion() {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                // 使用GitHub API获取最新发布版本
                const response = await fetch(`https://api.github.com/repos/${this.GitHubRepo}/releases/latest`);

                if (!response.ok) {
                    throw new Error(`GitHub API请求失败: ${response.status}`);
                }

                const data = await response.json();
                // 从tag_name中提取版本号（移除'v'前缀如果存在）
                const version = data.tag_name.replace(/^v/, '');

                if (!this.parseVersion(version)) {
                    throw new Error(`无效的版本号格式: ${version}`);
                }

                return version;
            } catch (error) {
                console.error(`获取最新版本失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
                retryCount++;

                if (retryCount === maxRetries) {
                    console.error('达到最大重试次数，版本检查失败');
                    return null;
                }

                // 等待一段时间后重试（使用指数退避）
                await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)));
            }
        }

        return null;
    },

    renderUpdateBanner() {
        return `
            <div class="update-banner">
                <div class="update-info">
                    <div class="update-icon">
                        <span class="material-symbols-rounded">system_update</span>
                    </div>
                    <div class="update-text">
                        <span>${I18n.translate('UPDATE_AVAILABLE', '有新版本可用')}: ${this.latestVersion}</span>
                    </div>
                </div>
                <button class="update-button md3-button" onclick="window.open('https://github.com/${this.GitHubRepo}/releases/latest', '_blank')">
                    <span class="material-symbols-rounded">open_in_new</span>
                    <span>${I18n.translate('VIEW_UPDATE', '查看更新')}</span>
                </button>
            </div>
        `;
    },

    // 初始化
    // 添加版本信息相关属性
    moduleInfo: {},
    version: null,
    
    // 在 init 方法中添加版本信息获取
    async init() {
        try {
            await this.loadModuleInfo();
            await this.loadModuleStatus();
            await this.loadDeviceInfo();
            await this.getLogCount();
            this.startAutoRefresh();
            this.checkUpdate();
            return true;
        } catch (error) {
            console.error('初始化状态页面失败:', error);
            return false;
        }
    },
    
    // 添加加载模块信息的方法
    async loadModuleInfo() {
        try {
            // 检查是否有缓存的模块信息
            const cachedInfo = sessionStorage.getItem('moduleInfo');
            if (cachedInfo) {
                this.moduleInfo = JSON.parse(cachedInfo);
                this.version = this.moduleInfo.version || 'Unknown';
                return;
            }
            
            // 尝试从配置文件获取模块信息
            const configOutput = await Core.execCommand(`cat "${Core.MODULE_PATH}module.prop"`);
            
            if (configOutput) {
                // 解析配置文件
                const lines = configOutput.split('\n');
                const config = {};
                
                lines.forEach(line => {
                    const parts = line.split('=');
                    if (parts.length >= 2) {
                        const key = parts[0].trim();
                        const value = parts.slice(1).join('=').trim();
                        config[key] = value;
                    }
                });
                
                this.moduleInfo = config;
                this.version = config.version || 'Unknown';
                // 缓存模块信息
                sessionStorage.setItem('moduleInfo', JSON.stringify(config));
            } else {
                console.warn('无法读取模块配置文件');
                this.moduleInfo = {};
                this.version = 'Unknown';
            }
        } catch (error) {
            console.error('加载模块信息失败:', error);
            this.moduleInfo = {};
            this.version = 'Unknown';
        }
    },
    async getLogCount() {
        try {
            const result = await Core.execCommand('find "' + Core.MODULE_PATH + 'logs/" -type f -name "*.log" | wc -l 2>/dev/null || echo "0"');
            this.logCount = parseInt(result.trim()) || 0;
        } catch (error) {
            console.error('获取日志数量失败:', error);
            this.logCount = 0;
        }
    },

    // 修改渲染方法中的状态卡片部分
    render() {
        // 设置页面标题
        document.getElementById('page-title').textContent = I18n.translate('NAV_STATUS', '状态');

        const pageActions = document.getElementById('page-actions');
        pageActions.innerHTML = `
        <button id="refresh-status" class="icon-button" title="${I18n.translate('REFRESH', '刷新')}">
            <span class="material-symbols-rounded">refresh</span>
        </button>
        <button id="run-action" class="icon-button" title="${I18n.translate('RUN_ACTION', '运行Action')}">
            <span class="material-symbols-rounded">play_arrow</span>
        </button>
    `;

        // 渲染页面内容
        return `
        <div class="status-page">
            <div class="update-banner-container">
                ${this.updateAvailable ? this.renderUpdateBanner() : ''}
            </div>
            <!-- 模块状态卡片 -->
            <div class="status-card module-status-card ${this.getStatusClass()}">
                <div class="status-card-content">
                    <div class="status-icon-container">
                            <span class="material-symbols-rounded">${this.getStatusIcon()}</span>
                    </div>
                    <div class="status-info-container">
                        <div class="status-title-row">
                            <span class="status-value" data-i18n="${this.getStatusI18nKey()}">${this.getStatusText()}</span>
                        </div>
                        <div class="status-details">
                            <div class="status-detail-row">${I18n.translate('VERSION', '版本')}: ${this.version}</div>
                            <div class="status-detail-row">${I18n.translate('UPDATE_TIME', '最后更新时间')}: ${new Date().toLocaleTimeString()}</div>
                            <div class="status-detail-row">${I18n.translate('LOG_COUNT', '日志数')}: ${this.logCount}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 设备信息卡片 -->
            <div class="status-card device-info-card">
                <div class="device-info-grid">
                    ${this.renderDeviceInfo()}
                </div>
            </div>
        </div>
    `;
    },

    async refreshStatus(showToast = false) {
        try {
            const oldStatus = this.moduleStatus;
            const oldDeviceInfo = JSON.stringify(this.deviceInfo);

            await this.loadModuleStatus();
            await this.loadDeviceInfo();

            // 只在状态发生变化时更新UI
            const newDeviceInfo = JSON.stringify(this.deviceInfo);
            if (oldStatus !== this.moduleStatus || oldDeviceInfo !== newDeviceInfo) {
                // 更新UI
                const statusPage = document.querySelector('.status-page');
                if (statusPage) {
                    statusPage.innerHTML = this.render();
                    this.afterRender();
                }
            }

            if (showToast) {
                Core.showToast(I18n.translate('STATUS_REFRESHED', '状态已刷新'));
            }
        } catch (error) {
            console.error('刷新状态失败:', error);
            if (showToast) {
                Core.showToast(I18n.translate('STATUS_REFRESH_ERROR', '刷新状态失败'), 'error');
            }
        }
    },

    // 渲染后的回调
    afterRender() {
        // 确保只绑定一次事件
        const refreshBtn = document.getElementById('refresh-status');
        const actionBtn = document.getElementById('run-action');

        if (refreshBtn && !refreshBtn.dataset.bound) {
            refreshBtn.addEventListener('click', () => {
                this.refreshStatus(true);
            });
            refreshBtn.dataset.bound = 'true';
        }

        if (actionBtn && !actionBtn.dataset.bound) {
            actionBtn.addEventListener('click', () => {
                this.runAction();
            });
            actionBtn.dataset.bound = 'true';
        }
        // 绑定快捷按钮事件
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', async () => {
                const command = button.dataset.command;
                try {
                    await Core.execCommand(command);
                    Core.showToast(`${button.textContent.trim()}`);
                } catch (error) {
                    Core.showToast(`${button.textContent.trim()}`, 'error');
                }
            });
        });
    },

    // 运行Action脚本
    async runAction() {
        try {
            // 创建输出容器
            const outputContainer = document.createElement('div');
            outputContainer.className = 'card action-output-container';
            outputContainer.innerHTML = `
                <div class="action-output-header">
                    <h3>${I18n.translate('ACTION_OUTPUT', 'Action输出')}</h3>
                    <button class="icon-button close-output" title="${I18n.translate('CLOSE', '关闭')}">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
                <div class="action-output-content"></div>
            `;

            document.body.appendChild(outputContainer);
            const outputContent = outputContainer.querySelector('.action-output-content');

            // 修复关闭按钮的事件监听
            const closeButton = outputContainer.querySelector('.close-output');
            closeButton.addEventListener('click', () => {
                outputContainer.remove();
            });

            Core.showToast(I18n.translate('RUNNING_ACTION', '正在运行Action...'));
            outputContent.textContent = I18n.translate('ACTION_STARTING', '正在启动Action...\n');

            outputContainer.querySelector('.close-output').addEventListener('click', () => {
                outputContainer.remove();
            });

            await Core.execCommand(`busybox sh ${Core.MODULE_PATH}action.sh`, {
                onStdout: (data) => {
                    outputContent.textContent += data + '\n';
                    outputContent.scrollTop = outputContent.scrollHeight;
                },
                onStderr: (data) => {
                    const errorText = document.createElement('span');
                    errorText.className = 'error';
                    errorText.textContent = '[ERROR] ' + data + '\n';
                    outputContent.appendChild(errorText);
                    outputContent.scrollTop = outputContent.scrollHeight;
                }
            });

            outputContent.textContent += '\n' + I18n.translate('ACTION_COMPLETED', 'Action运行完成');
            Core.showToast(I18n.translate('ACTION_COMPLETED', 'Action运行完成'));
        } catch (error) {
            console.error('运行Action失败:', error);
            Core.showToast(I18n.translate('ACTION_ERROR', '运行Action失败'), 'error');
        }
    },

    // 加载模块状态
    async loadModuleStatus() {
        try {
            // 检查状态文件是否存在
            const statusPath = `${Core.MODULE_PATH}status.txt`;
            const fileExistsResult = await Core.execCommand(`[ -f "${statusPath}" ] && echo "true" || echo "false"`);

            if (fileExistsResult.trim() !== "true") {
                console.error(`状态文件不存在: ${statusPath}`);
                this.moduleStatus = 'UNKNOWN';
                return;
            }

            // 读取状态文件
            const status = await Core.execCommand(`cat "${statusPath}"`);
            if (!status) {
                console.error(`无法读取状态文件: ${statusPath}`);
                this.moduleStatus = 'UNKNOWN';
                return;
            }

            // 检查服务进程是否运行
            const isRunning = await this.isServiceRunning();

            // 如果状态文件显示运行中，但进程检查显示没有运行，则返回STOPPED
            if (status.trim() === 'RUNNING' && !isRunning) {
                console.warn('状态文件显示运行中，但服务进程未检测到');
                this.moduleStatus = 'STOPPED';
                return;
            }

            this.moduleStatus = status.trim() || 'UNKNOWN';
        } catch (error) {
            console.error('获取模块状态失败:', error);
            this.moduleStatus = 'ERROR';
        }
    },

    async isServiceRunning() {
        try {
            // 使用ps命令检查service.sh进程
            const result = await Core.execCommand(`ps -ef | grep "${Core.MODULE_PATH}service.sh" | grep -v grep | wc -l`);
            return parseInt(result.trim()) > 0;
        } catch (error) {
            console.error('检查服务运行状态失败:', error);
            return false;
        }
    },

    async loadDeviceInfo() {
        try {
            // 获取设备信息
            this.deviceInfo = {
                model: await this.getDeviceModel(),
                android: await this.getAndroidVersion(),
                kernel: await this.getKernelVersion(),
                root: await this.getRootImplementation(),
                device_abi: await this.getDeviceABI()
            };

            console.log('设备信息加载完成:', this.deviceInfo);
        } catch (error) {
            console.error('加载设备信息失败:', error);
        }
    },

    async getDeviceModel() {
        try {
            const result = await Core.execCommand('getprop ro.product.model');
            return result.trim() || 'Unknown';
        } catch (error) {
            console.error('获取设备型号失败:', error);
            return 'Unknown';
        }
    },

    async getAndroidVersion() {
        try {
            const result = await Core.execCommand('getprop ro.build.version.release');
            return result.trim() || 'Unknown';
        } catch (error) {
            console.error('获取Android版本失败:', error);
            return 'Unknown';
        }
    },

    async getDeviceABI() {
        try {
            const result = await Core.execCommand('getprop ro.product.cpu.abi');
            return result.trim() || 'Unknown';
        } catch (error) {
            console.error('获取设备架构失败:', error);
            return 'Unknown';
        }
    },

    async getKernelVersion() {
        try {
            const result = await Core.execCommand('uname -r');
            return result.trim() || 'Unknown';
        } catch (error) {
            console.error('获取内核版本失败:', error);
            return 'Unknown';
        }
    },

    async getRootImplementation() {
        try {
            // 检查Magisk是否安装
            const magiskPath = '/data/adb/magisk';
            const magiskExists = await Core.execCommand(`[ -f "${magiskPath}" ] && echo "true" || echo "false"`);

            if (magiskExists.trim() === "true") {
                const version = await Core.execCommand(`cat "${magiskPath}"`);
                if (version && version.trim()) {
                    return `Magisk ${version.trim()}`;
                }
            }

            // 尝试通过magisk命令获取版本
            const magiskResult = await Core.execCommand('magisk -v');
            if (magiskResult && !magiskResult.includes('not found')) {
                const magiskVersion = magiskResult.trim().split(':')[0];
                if (magiskVersion) {
                    return `Magisk ${magiskVersion}`;
                }
            }

            // 检查KernelSU是否安装
            const ksuResult = await Core.execCommand('ksud -V');
            if (ksuResult && !ksuResult.includes('not found')) {
                return `KernelSU ${ksuResult.trim()}`;
            }

            // 检查APatch是否安装
            const apatchResult = await Core.execCommand('apd -V');
            if (apatchResult && !apatchResult.includes('not found')) {
                return `APatch ${apatchResult.trim()}`;
            }

            return 'No Root';
        } catch (error) {
            console.error('获取ROOT实现失败:', error);
            return 'Unknown';
        }
    },

    getStatusI18nKey() {
        switch (this.moduleStatus) {
            case 'RUNNING':
                return 'RUNNING';
            case 'STOPPED':
                return 'STOPPED';
            case 'ERROR':
                return 'ERROR';
            case 'PAUSED':
                return 'PAUSED';
            case 'NORMAL_EXIT':
                return 'NORMAL_EXIT';
            default:
                return 'UNKNOWN';
        }
    },

    // 渲染设备信息
    renderDeviceInfo() {
        if (!this.deviceInfo || Object.keys(this.deviceInfo).length === 0) {
            return `<div class="no-info" data-i18n="NO_DEVICE_INFO">无设备信息</div>`;
        }

        // 设备信息项映射
        const infoItems = [
            { key: 'model', label: 'DEVICE_MODEL', icon: 'smartphone' },
            { key: 'android', label: 'ANDROID_VERSION', icon: 'android' },
            { key: 'device_abi', label: 'DEVICE_ABI', icon: 'architecture' },
            { key: 'kernel', label: 'KERNEL_VERSION', icon: 'terminal' },
            { key: 'root', label: 'ROOT_IMPLEMENTATION', icon: 'security' }
        ];

        let html = '';

        infoItems.forEach(item => {
            if (this.deviceInfo[item.key]) {
                html += `
                    <div class="device-info-item">
                        <div class="device-info-icon">
                            <span class="material-symbols-rounded">${item.icon}</span>
                        </div>
                        <div class="device-info-content">
                            <div class="device-info-label" data-i18n="${item.label}">${I18n.translate(item.label, item.key)}</div>
                            <div class="device-info-value">${this.deviceInfo[item.key]}</div>
                        </div>
                    </div>
                `;
            }
        });

        return html || `<div class="no-info" data-i18n="NO_DEVICE_INFO">无设备信息</div>`;
    },


    // 启动自动刷新
    startAutoRefresh() {
        // 每60秒刷新一次
        this.refreshTimer = setInterval(() => {
            this.refreshStatus();
        }, 60000);
    },

    // 停止自动刷新
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    },

    // 获取状态类名
    getStatusClass() {
        switch (this.moduleStatus) {
            case 'RUNNING': return 'status-running';
            case 'STOPPED': return 'status-stopped';
            case 'ERROR': return 'status-error';
            case 'PAUSED': return 'status-paused';
            case 'NORMAL_EXIT': return 'status-normal-exit';
            default: return 'status-unknown';
        }
    },

    // 获取状态图标
    getStatusIcon() {
        switch (this.moduleStatus) {
            case 'RUNNING': return 'check_circle';
            case 'STOPPED': return 'cancel';
            case 'ERROR': return 'error';
            case 'PAUSED': return 'pause_circle';
            case 'NORMAL_EXIT': return 'task_alt';
            default: return 'help';
        }
    },

    // 获取状态文本
    getStatusText() {
        switch (this.moduleStatus) {
            case 'RUNNING': return I18n.translate('RUNNING', '运行中');
            case 'STOPPED': return I18n.translate('STOPPED', '已停止');
            case 'ERROR': return I18n.translate('ERROR', '错误');
            case 'PAUSED': return I18n.translate('PAUSED', '已暂停');
            case 'NORMAL_EXIT': return I18n.translate('NORMAL_EXIT', '正常退出');
            default: return I18n.translate('UNKNOWN', '未知');
        }
    },
    // 页面激活时的回调
    onActivate() {
        console.log('状态页面已激活');
        // 如果没有状态数据才进行刷新
        if (!this.moduleStatus || !this.deviceInfo) {
            this.refreshStatus();
        }
        // 启动自动刷新
        this.startAutoRefresh();
    },

    onDeactivate() {
        console.log('状态页面已停用');
        // 停止自动刷新但保留状态数据
        this.stopAutoRefresh();
    }
};

// 导出状态页面模块
window.StatusPage = StatusPage;
