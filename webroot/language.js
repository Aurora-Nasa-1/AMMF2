// 语言管理模块
const languageManager = {
    currentLang: 'en',
    supportedLangs: ['en', 'zh'],
    translations: {
        en: {},
        zh: {}
    },
    
    // 初始化语言系统
    async init() {
        try {
            // 读取languages.sh文件
            const languagesContent = await utils.readFile(`${utils.MODULE_PATH}files/languages.sh`);
            if (languagesContent) {
                this.parseLanguagesFile(languagesContent);
            }
            
            // 语言优先级：
            // 1. 配置文件设置
            // 2. 浏览器语言
            // 3. 默认语言 (en)
            
            // 1. 检查配置文件
            const config = await utils.getConfig();
            if (config && config.print_languages && this.supportedLangs.includes(config.print_languages)) {
                this.currentLang = config.print_languages;
                console.log(`从配置中读取语言设置: ${this.currentLang}`);
            } else {
                // 2. 使用浏览器语言
                const browserLang = navigator.language.split('-')[0];
                this.currentLang = this.supportedLangs.includes(browserLang) ? browserLang : 'en';
                console.log(`使用浏览器语言或默认语言: ${this.currentLang}`);
                
                // 更新配置文件
                await this.updateConfigLanguage(this.currentLang);
            }
            
            // 应用语言
            this.applyLanguage();
            
            console.log(`语言初始化完成: ${this.currentLang}`);
            
            // 添加语言选择按钮
            this.addLanguageButton();
            
            // 监听语言变更事件
            document.addEventListener('languageChanged', this.handleLanguageChanged.bind(this));
        } catch (error) {
            console.error('初始化语言系统出错:', error);
            // 默认使用英语
            this.currentLang = 'en';
            this.applyLanguage();
        }
    },
    
    // 处理语言变更事件
    handleLanguageChanged(event) {
        console.log(`语言已变更为: ${event.detail.language}`);
        // 重新应用所有翻译
        this.applyLanguage();
    },
    
    // 更新配置文件中的语言设置
    async updateConfigLanguage(lang) {
        try {
            // 获取当前配置
            const config = await utils.getConfig();
            if (!config) return false;
            
            // 如果语言设置已经正确，不需要更新
            if (config.print_languages === lang) return true;
            
            // 更新语言设置
            config.print_languages = lang;
            
            // 保存配置
            const result = await settingsManager.saveConfig(config);
            console.log(`配置文件语言更新${result ? '成功' : '失败'}: ${lang}`);
            return result;
        } catch (error) {
            console.error('更新配置文件语言设置出错:', error);
            return false;
        }
    },
    
    // 添加语言选择按钮 - 改进位置和样式
    addLanguageButton() {
        // 将语言按钮添加到顶部导航栏
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            const langButton = document.createElement('button');
            langButton.id = 'language-button';
            langButton.className = 'md-button icon-only';
            langButton.innerHTML = `<i class="material-icons">language</i>`;
            langButton.setAttribute('title', this.getLanguageDisplayName(this.currentLang));
            
            headerRight.insertBefore(langButton, headerRight.firstChild);
            
            // 添加按钮点击事件
            langButton.addEventListener('click', () => {
                this.showLanguageDialog();
            });
        }
    },
    
    // 显示语言选择对话框
    showLanguageDialog() {
        // 创建对话框
        const dialogHTML = `
            <div class="dialog language-dialog">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>${this.translate('WEBUI_LANGUAGE_TITLE', '选择语言')}</h3>
                        <button class="icon-button close-dialog">
                            <i class="material-icons">close</i>
                        </button>
                    </div>
                    <div class="dialog-body">
                        <div class="language-options">
                            ${this.generateLanguageOptionsHTML()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到DOM
        const dialogContainer = document.createElement('div');
        dialogContainer.innerHTML = dialogHTML;
        document.body.appendChild(dialogContainer.firstElementChild);
        
        // 获取对话框元素
        const dialog = document.querySelector('.language-dialog');
        
        // 添加关闭按钮事件
        dialog.querySelector('.close-dialog')?.addEventListener('click', () => {
            this.closeLanguageDialog();
        });
        
        // 添加语言选项点击事件
        dialog.querySelectorAll('.language-option')?.forEach(option => {
            option.addEventListener('click', async (e) => {
                const lang = e.currentTarget.getAttribute('data-lang');
                if (lang) {
                    // 先关闭对话框，避免界面卡顿
                    this.closeLanguageDialog();
                    // 然后设置语言
                    await this.setLanguage(lang);
                }
            });
        });
        
        // 显示对话框
        setTimeout(() => {
            dialog.classList.add('visible');
        }, 10);
    },
    
    // 关闭语言选择对话框
    closeLanguageDialog() {
        const dialog = document.querySelector('.language-dialog');
        if (dialog) {
            dialog.classList.remove('visible');
            setTimeout(() => {
                dialog.remove();
            }, 300);
        }
    },
    
    // 生成语言选项HTML
    generateLanguageOptionsHTML() {
        let html = '';
        
        for (const lang of this.supportedLangs) {
            const selected = lang === this.currentLang ? 'selected' : '';
            const langName = this.getLanguageDisplayName(lang);
            html += `
                <div class="language-option ${selected}" data-lang="${lang}">
                    ${langName}
                </div>
            `;
        }
        
        return html;
    },
    
    // 获取语言显示名称
    getLanguageDisplayName(lang) {
        // 尝试从翻译中获取语言名称
        if (this.translations[lang] && this.translations[lang]['WEBUI_LANGUAGE_NAME']) {
            return this.translations[lang]['WEBUI_LANGUAGE_NAME'];
        }
        
        // 默认名称
        switch (lang) {
            case 'en': return 'English';
            case 'zh': return '中文';
            case 'jp': return '日本語';
            case 'ru': return 'Русский';
            case 'fr': return 'Français';
            default: return lang;
        }
    },
    
    // 解析语言文件
    parseLanguagesFile(content) {
        const lines = content.split('\n');
        let currentLang = null;
        
        for (let line of lines) {
            // 检测语言部分开始
            const langMatch = line.match(/^# Language: ([a-z]{2})$/) || line.match(/^lang_([a-z]{2})\(\) \{$/);
            if (langMatch) {
                currentLang = langMatch[1];
                if (!this.translations[currentLang]) {
                    this.translations[currentLang] = {};
                    if (!this.supportedLangs.includes(currentLang)) {
                        this.supportedLangs.push(currentLang);
                    }
                }
                continue;
            }
            
            // 如果当前有活跃的语言，解析键值对
            if (currentLang) {
                const keyValueMatch = line.match(/^([A-Z_]+)="(.+)"$/);
                if (keyValueMatch) {
                    const [, key, value] = keyValueMatch;
                    this.translations[currentLang][key] = value;
                }
            }
        }
        
        // 确保支持的语言列表是唯一的
        this.supportedLangs = [...new Set(this.supportedLangs)];
    },
    
    // 设置语言 - 不再使用本地存储
    async setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.error(`不支持的语言: ${lang}`);
            return false;
        }
        
        try {
            this.currentLang = lang;
            
            // 更新配置文件中的语言设置
            await this.updateConfigLanguage(lang);
            
            // 应用语言
            this.applyLanguage();
            
            // 更新语言按钮文本
            const langButton = document.getElementById('language-button');
            if (langButton) {
                langButton.setAttribute('title', this.getLanguageDisplayName(lang));
            }
            
            return true;
        } catch (error) {
            console.error('设置语言时出错:', error);
            return false;
        }
    },
    
    
    // 应用语言到页面
    applyLanguage() {
        try {
            // 更新所有带有data-i18n属性的元素
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (key) {
                    element.textContent = this.translate(key);
                }
            });
            
            // 更新模块标题
            const moduleTitle = document.getElementById('module-title');
            if (moduleTitle) {
                moduleTitle.textContent = this.translate('MODULE_MANAGER_TITLE', 'AMMF Module Manager');
            }
            
            // 更新加载中文本
            const loadingText = document.querySelector('.loading-indicator p');
            if (loadingText) {
                loadingText.textContent = this.translate('LOADING', '加载中...');
            }
            
            // 触发语言变更事件
            document.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: this.currentLang }
            }));
        } catch (error) {
            console.error('应用语言时出错:', error);
        }
    },
    
    // 翻译文本
    translate(key, defaultText = key) {
        // 首先尝试从languages.sh获取翻译
        if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
            return this.translations[this.currentLang][key];
        }
        
        // 如果没有找到，使用默认文本
        return defaultText;
    }
};

// 导出
window.languageManager = languageManager;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    languageManager.init();
});