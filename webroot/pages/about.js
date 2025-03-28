/**
 * AMMF WebUI 关于页面模块
 * 显示模块信息和版本
 */

const AboutPage = {
    // 模块信息
    moduleInfo: {},
    version: '5.0.0',
    
    // 初始化
    async init() {
        try {
            // 加载模块信息
            await this.loadModuleInfo();
            return true;
        } catch (error) {
            console.error('初始化关于页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        // 设置页面标题
        document.getElementById('page-title').textContent = I18n.translate('NAV_ABOUT', '关于');
        
        // 清空页面操作区
        document.getElementById('page-actions').innerHTML = '';
        
        return `
        <div class="about-page">
            <!-- WebUI信息 -->
            <div class="about-card">
                <div class="webui-content">
                    <div class="webui-logo">
                        <span class="material-symbols-rounded">dashboard_customize</span>
                    </div>
                    <h2>AMMF WebUI</h2>
                    <div class="version-info">
                        <span>${I18n.translate('VERSION', '版本')}:</span>
                        <span class="version-number">${this.version}</span>
                    </div>
                </div>
            </div>
            
            <!-- 模块信息 -->
            <div class="about-card">
                <h2 data-i18n="MODULE_INFO">${I18n.translate('MODULE_INFO', '模块信息')}</h2>
                <div class="info-grid">
                    ${this.renderModuleInfo()}
                </div>
            </div>
            
            <!-- 模块开发者信息 -->
            <div class="about-card">
                <h2 data-i18n="MODULE_DEVELOPER">${I18n.translate('MODULE_DEVELOPER', '模块开发者')}</h2>
                <div class="developer-content">
                    <div class="info-item">
                        <span class="material-symbols-rounded info-icon">person</span>
                        <div class="info-content">
                            <div class="info-label">${I18n.translate('DEVELOPER', '开发者')}</div>
                            <div class="info-value">${this.moduleInfo.author || I18n.translate('UNKNOWN_DEVELOPER', '未知')}</div>
                        </div>
                    </div>
                </div>
                ${this.moduleInfo.github ? `
                <div class="social-links">
                    <a href="#" class="social-link" id="module-github-link">
                        <span class="material-symbols-rounded">code</span>
                        <span>GitHub</span>
                    </a>
                </div>
                ` : ''}
            </div>
            
            <!-- AMMF框架开发者信息 -->
            <div class="about-card">
                <h2 data-i18n="FRAMEWORK_DEVELOPER">${I18n.translate('FRAMEWORK_DEVELOPER', '框架开发者')}</h2>
                <div class="developer-content">
                    <div class="info-item">
                        <span class="material-symbols-rounded info-icon">person</span>
                        <div class="info-content">
                            <div class="info-label">${I18n.translate('DEVELOPER', '开发者')}</div>
                            <div class="info-value">Aurora星空</div>
                        </div>
                    </div>
                </div>
                <div class="social-links">
                    <a href="#" class="social-link" id="github-link">
                        <span class="material-symbols-rounded">code</span>
                        <span>GitHub</span>
                    </a>
                </div>
            </div>
            
            <div class="about-footer">
                <p data-i18n="COPYRIGHT_INFO">© ${new Date().getFullYear()} Aurora星空. All rights reserved.</p>
            </div>
        </div>
    `;
},

    // 修改模块信息渲染方法，只保留模块名称和版本信息
    renderModuleInfo() {
        const infoItems = [
            { key: 'module_name', label: 'MODULE_NAME', icon: 'tag' },
            { key: 'version', label: 'MODULE_VERSION', icon: 'new_releases' },
            { key: 'versionCode', label: 'VERSION_DATE', icon: 'update' },
            { key: 'author', label: 'DEVELOPER', icon: 'person' }  // 添加开发者信息显示
        ];
        
        let html = '';
        
        infoItems.forEach(item => {
            if (this.moduleInfo[item.key]) {
                html += `
                    <div class="info-item">
                        <div class="info-icon">
                            <span class="material-symbols-rounded">${item.icon}</span>
                        </div>
                        <div class="info-content">
                            <div class="info-label" data-i18n="${item.label}">${I18n.translate(item.label, item.key)}</div>
                            <div class="info-value">${this.moduleInfo[item.key]}</div>
                        </div>
                    </div>
                `;
            }
        });
        
        return html || `<div class="no-info" data-i18n="NO_INFO">无可用信息</div>`;
    },
    
    // 加载模块信息
    async loadModuleInfo() {
        try {
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
                console.log('模块信息加载成功:', this.moduleInfo);
            } else {
                console.warn('无法读取模块配置文件');
                this.moduleInfo = {};
            }
        } catch (error) {
            console.error('加载模块信息失败:', error);
            this.moduleInfo = {};
        }
    },
    
    // 渲染后的回调
    afterRender() {
        // 添加GitHub链接点击事件
        const githubLink = document.getElementById('github-link');
        if (githubLink) {
            githubLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openGitHubLink();
            });
        }
        
        // 添加模块GitHub链接点击事件
        const moduleGithubLink = document.getElementById('module-github-link');
        if (moduleGithubLink) {
            moduleGithubLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModuleGitHubLink();
            });
        }
    },
    // 打开GitHub链接
    async openGitHubLink() {
        try {
            // 获取GitHub链接
            let githubUrl = "https://github.com/Aurora-Nasa-1/AM" + "MF2";
            
            // 如果模块信息中有GitHub链接，则使用模块信息中的链接
            if (this.moduleInfo.github) {
                githubUrl = this.moduleInfo.github;
            }
            
            // 使用安卓浏览器打开链接
            await Core.execCommand(`am start -a android.intent.action.VIEW -d "${githubUrl}"`);
            console.log('已打开GitHub链接:', githubUrl);
        } catch (error) {
            console.error('打开GitHub链接失败:', error);
            Core.showToast('打开GitHub链接失败', 'error');
        }
    }
};

// 导出关于页面模块
window.AboutPage = AboutPage;