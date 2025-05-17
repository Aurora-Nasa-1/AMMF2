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
            await this.loadTranslations();
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

    async loadTranslations() {
        try {
            // 加载每种语言的翻译文件
            const loadPromises = this.supportedLangs.map(async lang => {
                try {
                    const response = await fetch(`translations/${lang}.json`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const translations = await response.json();
                    // 验证加载的翻译数据
                    if (typeof translations === 'object' && Object.keys(translations).length > 0) {
                        this.translations[lang] = translations;
                        console.log(`成功加载${lang}语言文件，包含 ${Object.keys(translations).length} 个翻译项`);
                    } else {
                        throw new Error(`${lang}语言文件格式无效`);
                    }
                } catch (error) {
                    console.error(`加载${lang}语言文件失败:`, error);
                    // 如果是中文翻译加载失败，使用基础翻译
                    if (lang === 'zh') {
                        this.translations.zh = this.getBaseTranslations();
                    }
                }
            });

            await Promise.all(loadPromises);

            // 验证所有语言是否都有基本的翻译内容
            this.supportedLangs.forEach(lang => {
                if (!this.translations[lang] || Object.keys(this.translations[lang]).length === 0) {
                    console.warn(`${lang}语言翻译内容为空，使用基础翻译`);
                    this.translations[lang] = this.getBaseTranslations();
                }
            });
        } catch (error) {
            console.error('加载翻译文件失败:', error);
            // 确保至少有基础的中文翻译
            this.translations.zh = this.getBaseTranslations();
        }
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
                        languageSelector.classList.add('closing');
                        setTimeout(() => {
                            languageSelector.classList.remove('active');
                            languageSelector.classList.remove('closing');
                            languageSelector.style.display = 'none';
                            setTimeout(() => {
                                languageSelector.style.display = '';
                            }, 50);
                        }, 200);
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
