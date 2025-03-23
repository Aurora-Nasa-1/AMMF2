/**
 * AMMF WebUI 状态页面模块
 * 显示模块运行状态和基本信息
 */

const StatusPage = {
    // 模块状态
    moduleStatus: 'UNKNOWN',
    
    // 模块信息
    moduleInfo: {},
    
    // 自动刷新定时器
    refreshTimer: null,
    
    // 初始化
    async init() {
        try {
            // 加载模块状态和信息
            await this.loadModuleStatus();
            await this.loadModuleInfo();
            
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
        return `
            <div class="page-container status-page">
                <div class="status-header card">
                    <h2 data-i18n="MODULE_STATUS">模块状态</h2>
                    <div class="status-actions">
                        <button id="refresh-status" class="md-button">
                            <span class="material-symbols-rounded">refresh</span>
                            <span data-i18n="REFRESH">刷新</span>
                        </button>
                    </div>
                </div>
                
                <div class="status-content">
                    <div class="status-card card">
                        <div class="status-indicator ${this.getStatusClass()}">
                            <span class="material-symbols-rounded">${this.getStatusIcon()}</span>
                            <span>${this.getStatusText()}</span>
                        </div>
                    </div>
                    
                    <div class="module-info card">
                        <h3>模块信息</h3>
                        <div class="info-grid">
                            ${this.renderModuleInfo()}
                        </div>
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
    },
    
    // 加载模块状态
    async loadModuleStatus() {
        try {
            this.moduleStatus = await Core.getModuleStatus();
            console.log(`模块状态: ${this.moduleStatus}`);
        } catch (error) {
            console.error('加载模块状态失败:', error);
            this.moduleStatus = 'ERROR';
        }
    },
    
    // 加载模块信息
    async loadModuleInfo() {
        try {
            const config = await Core.getConfig();
            this.moduleInfo = config || {};
        } catch (error) {
            console.error('加载模块信息失败:', error);
            this.moduleInfo = {};
        }
    },
    
    // 刷新状态
    async refreshStatus(showToast = false) {
        try {
            await this.loadModuleStatus();
            await this.loadModuleInfo();
            
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
    
    // 启动服务
    async startService() {
        try {
            Core.showToast(I18n.translate('STARTING_SERVICE', '正在启动服务...'));
            
            // 改进启动命令
            await Core.execCommand(`cd "${Core.MODULE_PATH}" && nohup sh service.sh > /dev/null 2>&1 &`);
            
            // 等待一段时间后刷新状态
            setTimeout(() => {
                this.refreshStatus(true);
            }, 2000);
        } catch (error) {
            console.error('启动服务失败:', error);
            Core.showToast(I18n.translate('START_ERROR', '启动服务失败'), 'error');
        }
    },
    
    // 停止服务
    async stopService() {
        try {
            Core.showToast(I18n.translate('STOPPING_SERVICE', '正在停止服务...'));
            
            // 改进停止命令，使用pkill更可靠地终止进程
            await Core.execCommand(`pkill -f "${Core.MODULE_PATH}service.sh"`);
            
            // 确保状态文件更新
            await Core.writeFile(`${Core.MODULE_PATH}status.txt`, "STOPPED");
            
            // 等待一段时间后刷新状态
            setTimeout(() => {
                this.refreshStatus(true);
            }, 2000);
        } catch (error) {
            console.error('停止服务失败:', error);
            Core.showToast(I18n.translate('STOP_ERROR', '停止服务失败'), 'error');
        }
    },
    
    // 重启服务
    async restartService() {
        try {
            Core.showToast(I18n.translate('RESTARTING_SERVICE', '正在重启服务...'));
            
            // 改进重启命令
            await Core.execCommand(`pkill -f "${Core.MODULE_PATH}service.sh"; cd "${Core.MODULE_PATH}" && nohup sh service.sh > /dev/null 2>&1 &`);
            
            // 等待一段时间后刷新状态
            setTimeout(() => {
                this.refreshStatus(true);
            }, 2000);
        } catch (error) {
            console.error('重启服务失败:', error);
            Core.showToast(I18n.translate('RESTART_ERROR', '重启服务失败'), 'error');
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
    },
    
    // 渲染模块信息
    renderModuleInfo() {
        const infoItems = [
            { key: 'action_name', label: '模块名称' },
            { key: 'action_id', label: '模块ID' },
            { key: 'action_author', label: '作者' },
            { key: 'action_description', label: '描述' },
            { key: 'magisk_min_version', label: 'Magisk最低版本' },
            { key: 'ksu_min_version', label: 'KernelSU最低版本' },
            { key: 'apatch_min_version', label: 'APatch最低版本' },
            { key: 'ANDROID_API', label: 'Android API' }
        ];
        
        let html = '';
        
        infoItems.forEach(item => {
            if (this.moduleInfo[item.key]) {
                html += `
                    <div class="info-item">
                        <div class="info-label">${item.label}</div>
                        <div class="info-value">${this.moduleInfo[item.key]}</div>
                    </div>
                `;
            }
        });
        
        return html || '<div class="no-info">无可用信息</div>';
    }
};

// 导出状态页面模块
window.StatusPage = StatusPage;