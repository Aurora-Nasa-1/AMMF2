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
    
    render() {
        return `
            <div class="page-container status-page">
                <div class="status-header card">
                    <h2 data-i18n="MODULE_STATUS">模块状态</h2>
                    <div class="status-actions">
                        <button id="refresh-status" class="md-button">
                            <span class="material-symbols-rounded">refresh</span>
                            <span data-i18n="REFRESH_STATUS">刷新状态</span>
                        </button>
                    </div>
                </div>
                
                <div class="status-card card">
                    <div class="status-indicator ${this.getStatusClass()}">
                        <span class="material-symbols-rounded">${this.getStatusIcon()}</span>
                        <span>${this.getStatusText()}</span>
                    </div>
                    
                    <div class="status-actions">
                        <button id="run-action" class="md-button">
                            <span class="material-symbols-rounded">terminal</span>
                            <span data-i18n="RUN_ACTION">运行Action</span>
                        </button>
                    </div>
                </div>
                
                <div class="device-info card">
                    <h3 data-i18n="DEVICE_INFO">设备信息</h3>
                    <div class="info-grid">
                        ${this.renderDeviceInfo()}
                    </div>
                </div>
            </div>
        `;
    },

    // 渲染后的回调
    afterRender() {
        // 绑定刷新按钮
        document.getElementById('refresh-status')?.addEventListener('click', () => {
            this.refreshStatus(true);
        });
        
        // 绑定运行Action按钮
        document.getElementById('run-action')?.addEventListener('click', () => {
            this.runAction();
        });
    },
    
    // 运行Action脚本
    async runAction() {
        try {
            Core.showToast(I18n.translate('RUNNING_ACTION', '正在运行Action...'));
            
            // 打开终端并运行action.sh
            await Core.openTerminal(`cd "${Core.MODULE_PATH}" && busybox sh action.sh`);
            
            // 刷新状态
            setTimeout(() => {
                this.refreshStatus(true);
            }, 2000);
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
    
    renderDeviceInfo() {
        const infoItems = [
            { key: 'android', label: 'Android 版本', icon: 'android' },
            { key: 'android_api', label: 'Android API', icon: 'api' },
            { key: 'device_abi', label: '设备架构', icon: 'memory' },
            { key: 'model', label: '设备型号', icon: 'smartphone' },
            { key: 'kernel', label: '内核版本', icon: 'terminal' },
            { key: 'magisk', label: 'Magisk 版本', icon: 'security' },
            { key: 'ksu', label: 'KernelSU 版本', icon: 'admin_panel_settings' }
        ];
        
        let html = '';
        
        infoItems.forEach(item => {
            if (this.deviceInfo[item.key]) {
                html += `
                    <div class="info-item">
                        <div class="info-icon">
                            <span class="material-symbols-rounded">${item.icon}</span>
                        </div>
                        <div class="info-content">
                            <div class="info-label">${item.label}</div>
                            <div class="info-value">${this.deviceInfo[item.key]}</div>
                        </div>
                    </div>
                `;
            }
        });
        
        return html || '<div class="no-info">无可用信息</div>';
    },
    
    // 刷新状态
    async refreshStatus(showToast = false) {
        try {
            await this.loadModuleStatus();
            await this.loadDeviceInfo();
            
            // 更新UI
            const statusPage = document.querySelector('.status-page');
            if (statusPage) {
                statusPage.innerHTML = this.render();
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
            default: return 'status-unknown';
        }
    },
    
    // 获取状态图标
    getStatusIcon() {
        switch (this.moduleStatus) {
            case 'RUNNING': return 'check_circle';
            case 'STOPPED': return 'cancel';
            case 'ERROR': return 'error';
            default: return 'help';
        }
    },
    
    // 获取状态文本
    getStatusText() {
        switch (this.moduleStatus) {
            case 'RUNNING': return I18n.translate('RUNNING', '运行中');
            case 'STOPPED': return I18n.translate('STOPPED', '已停止');
            case 'ERROR': return I18n.translate('ERROR', '错误');
            default: return I18n.translate('UNKNOWN', '未知');
        }
    }
};

// 导出状态页面模块
window.StatusPage = StatusPage;