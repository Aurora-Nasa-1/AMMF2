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
    
    // 初始化
    async init() {
        try {
            // 加载模块状态和信息
            await this.loadModuleStatus();
            await this.loadDeviceInfo();
            // 启动自动刷新
            this.startAutoRefresh();
            
            return true;
        } catch (error) {
            console.error('初始化状态页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        // 设置页面标题
        document.getElementById('page-title').textContent = I18n.translate('NAV_STATUS', '状态');
        
        const pageActions = document.getElementById('page-actions');
        pageActions.innerHTML = `
            <button id="refresh-status" class="md-button icon-only" title="${I18n.translate('REFRESH', '刷新')}">
                <span class="material-symbols-rounded">refresh</span>
            </button>
            <button id="run-action" class="md-button icon-only" title="${I18n.translate('RUN_ACTION', '运行Action')}">
                <span class="material-symbols-rounded">play_arrow</span>
            </button>
        `;
        
        // 渲染页面内容
        return `
            <div class="status-page">
                <!-- 模块状态卡片 -->
                <div class="status-card">
                    <div class="status-card-content">
                        <div class="status-icon-container">
                            <div class="status-indicator ${this.getStatusClass()}">
                                <span class="material-symbols-rounded">${this.getStatusIcon()}</span>
                            </div>
                        </div>
                        <div class="status-info-container">
                            <div class="status-title-row">
                                <span class="status-title" data-i18n="MODULE_STATUS">模块状态</span>
                                <span class="status-value" data-i18n="${this.getStatusI18nKey()}">${this.getStatusText()}</span>
                            </div>
                            <div class="status-update-row">
                                <span class="status-update-time">${new Date().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 设备信息卡片 -->
                <div class="card device-info">
                    <h3 data-i18n="DEVICE_INFO">设备信息</h3>
                    ${this.renderDeviceInfo()}
                </div>
            </div>
        `;
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
    },
    
    // 运行Action脚本
    async runAction() {
        try {
            // 创建输出容器
            const outputContainer = document.createElement('div');
            outputContainer.className = 'action-output-container';
            outputContainer.innerHTML = `
                <div class="action-output-header">
                    <h3>${I18n.translate('ACTION_OUTPUT', 'Action输出')}</h3>
                    <button class="md-button icon-only close-output">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
                <div class="action-output-content"></div>
            `;
            
            // 添加到页面
            document.querySelector('.status-page').appendChild(outputContainer);
            const outputContent = outputContainer.querySelector('.action-output-content');
            
            // 显示加载状态
            Core.showToast(I18n.translate('RUNNING_ACTION', '正在运行Action...'));
            outputContent.textContent = I18n.translate('ACTION_STARTING', '正在启动Action...');
            
            // 绑定关闭按钮事件
            outputContainer.querySelector('.close-output').addEventListener('click', () => {
                outputContainer.remove();
            });
    
            // 运行Action并实时显示输出
            await Core.execCommand(`sh ${Core.MODULE_PATH}action.sh`, {
                onStdout: (data) => {
                    outputContent.textContent += data + '\n';
                    outputContent.scrollTop = outputContent.scrollHeight;
                },
                onStderr: (data) => {
                    outputContent.textContent += '[ERROR] ' + data + '\n';
                    outputContent.scrollTop = outputContent.scrollHeight;
                }
            });
    
            // 运行完成提示
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
                magisk: await this.getMagiskVersion(),
                ksu: await this.getKsuVersion(),
                android_api: await this.getAndroidAPI(),
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

    async getAndroidAPI() {
        try {
            const result = await Core.execCommand('getprop ro.build.version.sdk');
            return result.trim() || 'Unknown';
        } catch (error) {
            console.error('获取Android API失败:', error);
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

    async getMagiskVersion() {
        try {
            // 检查Magisk是否安装
            const magiskPath = '/data/adb/magisk';
            const fileExistsResult = await Core.execCommand(`[ -f "${magiskPath}" ] && echo "true" || echo "false"`);
            
            if (fileExistsResult.trim() === "true") {
                const version = await Core.execCommand(`cat "${magiskPath}"`);
                return version.trim() || 'Unknown';
            }
            
            // 尝试通过magisk命令获取版本
            const cmdResult = await Core.execCommand('magisk -v');
            if (cmdResult && !cmdResult.includes('not found')) {
                return cmdResult.trim().split(':')[0] || 'Unknown';
            }
            
            return 'Not Installed';
        } catch (error) {
            console.error('获取Magisk版本失败:', error);
            return 'Unknown';
        }
    },

    async getKsuVersion() {
        try {
            // 检查KernelSU是否安装
            const result = await Core.execCommand('ksud');
            if (result && !result.includes('not found')) {
                return result.trim() || 'Unknown';
            }
            return 'Not Installed';
        } catch (error) {
            console.error('获取KernelSU版本失败:', error);
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
            { key: 'android_api', label: 'ANDROID_API', icon: 'api' },
            { key: 'device_abi', label: 'DEVICE_ABI', icon: 'memory' },
            { key: 'kernel', label: 'KERNEL_VERSION', icon: 'terminal' },
            { key: 'magisk', label: 'MAGISK_VERSION', icon: 'security' },
            { key: 'ksu', label: 'KSU_VERSION', icon: 'new_releases' }
        ];
        
        let html = '<div class="device-info-grid">';
        
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
        
        html += '</div>';
        return html || `<div class="no-info" data-i18n="NO_DEVICE_INFO">无设备信息</div>`;
    },
    
    // 刷新状态
    async refreshStatus(showToast = false) {
        try {
            await this.loadModuleStatus();
            await this.loadDeviceInfo();
            
            // 更新UI
            const statusPage = document.querySelector('.status-page');
            if (statusPage) {
                statusPage.innerHTML = '';
                statusPage.innerHTML = `
                    <!-- 模块状态卡片 -->
                    <div class="status-card">
                        <div class="status-card-content">
                            <div class="status-icon-container">
                                <div class="status-indicator ${this.getStatusClass()}">
                                    <span class="material-symbols-rounded">${this.getStatusIcon()}</span>
                                </div>
                            </div>
                            <div class="status-info-container">
                                <div class="status-title-row">
                                    <span class="status-title" data-i18n="MODULE_STATUS">模块状态</span>
                                    <span class="status-value" data-i18n="${this.getStatusI18nKey()}">${this.getStatusText()}</span>
                                </div>
                                <div class="status-update-row">
                                    <span class="status-update-time">${new Date().toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 设备信息卡片 -->
                    <div class="card device-info">
                        <h3 data-i18n="DEVICE_INFO">设备信息</h3>
                        ${this.renderDeviceInfo()}
                    </div>
                `;
                
                this.afterRender();
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
    
    // 启动自动刷新
    startAutoRefresh() {
        // 每30秒刷新一次
        this.refreshTimer = setInterval(() => {
            this.refreshStatus();
        }, 30000);
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
        // 刷新状态
        this.refreshStatus();
    },
    
    // 页面停用时的回调
    onDeactivate() {
        console.log('状态页面已停用');
        // 停止自动刷新
        this.stopAutoRefresh();
    }
};

// 导出状态页面模块
window.StatusPage = StatusPage;