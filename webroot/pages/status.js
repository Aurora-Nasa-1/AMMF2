/**
 * AMMF WebUI 状态页面模块
 * 显示模块运行状态和基本信息
 */

const StatusPage = {
    // 模块状态
    moduleStatus: 'UNKNOWN',
    refreshTimer: null,
    deviceInfo: {},

    // 版本信息
    currentVersion: '20240503',
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
        if (this.updateChecking) return;
        this.updateChecking = true;
    
        try {
            const versionInfo = await this.getLatestVersion();
            
            if (versionInfo) {
                this.latestVersion = versionInfo;
                // 比较发布日期
                this.updateAvailable = parseInt(versionInfo.formattedDate) > parseInt(this.currentVersion);
                this.updateError = null;
            } else {
                this.updateAvailable = false;
                this.updateError = null;
            }
    
            window.dispatchEvent(new CustomEvent('updateCheckComplete', {
                detail: {
                    available: this.updateAvailable,
                    version: this.latestVersion
                }
            }));
        } catch (error) {
            console.warn('检查更新失败:', error);
            this.updateAvailable = false;
            this.updateError = error.message;
        } finally {
            this.updateChecking = false;
            
            const updateBannerContainer = document.querySelector('.update-banner-container');
            if (updateBannerContainer) {
                updateBannerContainer.innerHTML = this.renderUpdateBanner();
            }
        }
    },

    renderUpdateBanner() {
        if (this.updateChecking) {
            return `
                <div class="update-banner checking">
                    <div class="update-info">
                        <div class="update-icon">
                            <span class="material-symbols-rounded rotating">sync</span>
                        </div>
                        <div class="update-text">
                            <div class="update-title">${I18n.translate('CHECKING_UPDATE', '正在检查更新...')}</div>
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
                            <div class="update-title">${I18n.translate('UPDATE_CHECK_FAILED', '检查更新失败')}</div>
                            <div class="update-subtitle">${this.updateError}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (this.updateAvailable) {
            return `
                <div class="update-banner available">
                    <div class="update-info">
                        <div class="update-icon">
                            <span class="material-symbols-rounded">system_update</span>
                        </div>
                        <div class="update-text">
                            <div class="update-title">${I18n.translate('UPDATE_AVAILABLE', '有新版本可用')}</div>
                            <div class="update-version">
                                <span class="version-tag">${this.latestVersion.tagName}</span>
                                <span class="version-date">${this.formatDate(this.latestVersion.formattedDate)}</span>
                            </div>
                        </div>
                    </div>
                    <button class="update-button md3-button" onclick="app.OpenUrl('https://github.com/${this.GitHubRepo}/releases/latest', '_blank')">
                        <span class="material-symbols-rounded">open_in_new</span>
                        <span>${I18n.translate('VIEW_UPDATE', '查看更新')}</span>
                    </button>
                </div>
            `;
        }

        return '';
    },

    // 添加日期格式化方法
    formatDate(dateString) {
        if (!dateString || dateString.length !== 8) return dateString;
        const year = dateString.substring(2, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return `${year}/${month}/${day}`;
    },

    async getLatestVersion() {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const response = await fetch(`https://api.github.com/repos/${this.GitHubRepo}/releases/latest`);

                if (!response.ok) {
                    throw new Error(`GitHub API请求失败: ${response.status}`);
                }

                const data = await response.json();
                // 获取 tag 名称和发布日期
                const tagName = data.tag_name;
                const publishDate = new Date(data.published_at);
                const formattedDate = publishDate.getFullYear() +
                    String(publishDate.getMonth() + 1).padStart(2, '0') +
                    String(publishDate.getDate()).padStart(2, '0');
                return { tagName, formattedDate };
            } catch (error) {
                console.error(`获取最新版本失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
                retryCount++;

                if (retryCount === maxRetries) {
                    console.error('达到最大重试次数，版本检查失败');
                    return null;
                }

                await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)));
            }
        }

        return null;
    },

    // 初始化
    // 添加版本信息相关属性
    moduleInfo: {},
    version: null,

    async preloadData() {
        try {
            const tasks = [
                this.loadModuleInfo(),
                this.loadDeviceInfo(),
                this.getLogCount(),
                this.getLatestVersion()
            ];

            const [moduleInfo, deviceInfo, logCount, latestVersion] = await Promise.allSettled(tasks);

            return {
                moduleInfo: moduleInfo.value || {},
                deviceInfo: deviceInfo.value || {},
                logCount: logCount.value || 0,
                latestVersion: latestVersion.value
            };
        } catch (error) {
            console.warn('预加载数据失败:', error);
            return null;
        }
    },

    // 修改 init 方法以使用预加载数据
    async init() {
        try {
            // 注册操作按钮
            this.registerActions();

            // 注册语言切换处理器
            I18n.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));

            // 获取预加载的数据
            const preloadedData = PreloadManager.getData('status');
            if (preloadedData) {
                this.moduleInfo = preloadedData.moduleInfo;
                this.deviceInfo = preloadedData.deviceInfo;
                this.logCount = preloadedData.logCount;
                this.latestVersion = preloadedData.latestVersion;
                this.version = this.moduleInfo.version || 'Unknown';
            } else {
                // 如果没有预加载数据，则正常加载
                await this.loadModuleInfo();
                await this.loadDeviceInfo();
                await this.getLogCount();
            }

            await this.loadModuleStatus(); // 实时状态始终需要加载
            this.startAutoRefresh();
            this.checkUpdate();
            return true;
        } catch (error) {
            console.error('初始化状态页面失败:', error);
            return false;
        }
    },

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
    registerActions() {
        UI.registerPageActions('status', [
            {
                id: 'refresh-status',
                icon: 'refresh',
                title: I18n.translate('REFRESH', '刷新'),
                onClick: 'refreshStatus'
            },
            {
                id: 'run-action',
                icon: 'play_arrow',
                title: I18n.translate('RUN_ACTION', '运行Action'),
                onClick: 'runAction'
            }
        ]);
    },
    // 修改渲染方法中的状态卡片部分
    render() {
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
            let rootInfo = [];

            // 检查Magisk
            try {
                // 检查多个可能的Magisk路径
                const magiskPaths = [
                    '/data/adb/magisk',
                    '/data/adb/magisk.db',
                    '/data/adb/magisk.img'
                ];
                
                for (const path of magiskPaths) {
                    const exists = await Core.execCommand(`[ -e "${path}" ] && echo "true" || echo "false"`);
                    if (exists.trim() === "true") {
                        // 尝试获取Magisk版本
                        const magiskResult = await Core.execCommand('magisk -v');
                        if (magiskResult && !magiskResult.includes('not found')) {
                            const version = magiskResult.trim().split(':')[0];
                            if (version) {
                                rootInfo.push(`Magisk ${version}`);
                                break;
                            }
                        }
                    }
                }
            } catch (error) {
                console.debug('Magisk检测失败:', error);
            }

            // 检查KernelSU
            try {
                const ksuResult = await Core.execCommand('ksu -V || ksud -V');
                if (ksuResult && !ksuResult.includes('not found')) {
                    rootInfo.push(`KernelSU ${ksuResult.trim()}`);
                }
            } catch (error) {
                console.debug('KernelSU检测失败:', error);
            }

            // 检查APatch
            try {
                const apatchResult = await Core.execCommand('apd -V');
                if (apatchResult && !apatchResult.includes('not found')) {
                    rootInfo.push(`APatch ${apatchResult.trim()}`);
                }
            } catch (error) {
                console.debug('APatch检测失败:', error);
            }

            // 通用root检测
            try {
                const suResult = await Core.execCommand('which su || command -v su');
                if (suResult && !suResult.includes('not found')) {
                    if (!rootInfo.length) {
                        rootInfo.push('Root (Unknown)');
                    }
                }
            } catch (error) {
                console.debug('通用root检测失败:', error);
            }

            return rootInfo.length ? rootInfo.join(' + ') : 'No Root';
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
    // 添加语言切换处理方法
    onLanguageChanged() {
        const statusPage = document.querySelector('.status-page');
        if (statusPage) {
            statusPage.innerHTML = this.render();
            this.afterRender();
        }
    },

    // 修改 onDeactivate 方法
    onDeactivate() {
        // 注销语言切换处理器
        I18n.unregisterLanguageChangeHandler(this.onLanguageChanged.bind(this));
        // 停止自动刷新
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.stopAutoRefresh();
        // 清理页面操作按钮
        UI.clearPageActions();
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
};
// 导出状态页面模块
window.StatusPage = StatusPage;