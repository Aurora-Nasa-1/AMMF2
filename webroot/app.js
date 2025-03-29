/**
 * AMMF WebUI 主应用脚本
 * 处理页面加载、路由和全局事件
 */

// 应用状态
const appState = {
    currentPage: null,
    pageInstance: null,
    isLoading: true,
    themeChanging: false,
    pageChanging: false
};

// 页面模块映射
const pageModules = {
    status: 'StatusPage',
    logs: 'LogsPage',
    settings: 'SettingsPage',
    about: 'AboutPage'
};

// DOM 元素缓存
const elements = {
    app: document.getElementById('app'),
    mainContent: document.getElementById('main-content'),
    pageTitle: document.getElementById('page-title'),
    pageActions: document.getElementById('page-actions'),
    themeToggle: document.getElementById('theme-toggle'),
    languageButton: document.getElementById('language-button'),
    navItems: document.querySelectorAll('.nav-item')
};

// 初始化应用
async function initApp() {
    // 添加 app-loaded 类以触发淡入动画
    setTimeout(() => {
        document.body.classList.add('app-loaded');
    }, 100);

    // 设置导航事件监听
    setupNavigation();
    
    // 设置主题切换
    setupThemeToggle();
    
    // 设置语言切换
    setupLanguageToggle();
    
    // 加载初始页面
    const initialPage = getCurrentPageFromUrl() || 'status';
    await loadPage(initialPage);
    
    // 标记应用加载完成
    appState.isLoading = false;
}

// 设置导航事件
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            
            // 如果已经是当前页面，不做任何操作
            if (pageName === appState.currentPage) return;
            
            // 更新导航项状态
            updateActiveNavItem(pageName);
            
            // 加载新页面
            await loadPage(pageName);
            
            // 更新 URL
            history.pushState({ page: pageName }, '', `?page=${pageName}`);
        });
        
        // 添加涟漪效果
        item.addEventListener('mousedown', createRippleEffect);
    });
    
    // 处理浏览器后退/前进
    window.addEventListener('popstate', async (e) => {
        const pageName = e.state?.page || 'status';
        updateActiveNavItem(pageName);
        await loadPage(pageName);
    });
}

// 创建涟漪效果
function createRippleEffect(e) {
    const button = e.currentTarget;
    
    // 检查是否是导航项
    if (button.classList.contains('nav-item')) {
        // 如果是导航项，创建涟漪效果
        const rect = button.getBoundingClientRect();
        
        // 计算相对于导航项的位置
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 创建按钮涟漪
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 400); // 与CSS中的动画时间一致
        
        // 如果是激活状态的导航项，还需要在覆盖层上创建涟漪
        if (button.classList.contains('active')) {
            const overlayRipple = document.createElement('span');
            overlayRipple.className = 'overlay-ripple';
            
            // 计算覆盖层中心位置
            const overlayX = x - (button.querySelector('.nav-item.active::before') ? 30 : 30);
            const overlayY = y - 26; // 覆盖层的top位置
            
            overlayRipple.style.left = `${overlayX}px`;
            overlayRipple.style.top = `${overlayY}px`;
            overlayRipple.style.width = '20px';
            overlayRipple.style.height = '20px';
            
            button.appendChild(overlayRipple);
            
            setTimeout(() => {
                overlayRipple.remove();
            }, 400);
        }
        
        return;
    }
    
    // 其他元素的涟漪效果保持不变
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// 更新活动导航项
function updateActiveNavItem(pageName) {
    elements.navItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === pageName) {
            // 如果之前不是激活状态，添加激活类和动画类
            if (!item.classList.contains('active')) {
                item.classList.add('active');
                // 添加动画类
                item.classList.add('animate');
                setTimeout(() => {
                    item.classList.remove('animate');
                }, 200); // 减少时间以匹配更快的动画
            }
        } else {
            item.classList.remove('active', 'animate');
        }
    });
}

// 从 URL 获取当前页面
function getCurrentPageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('page');
}

// 加载页面
async function loadPage(pageName) {
    if (appState.pageChanging) return;
    appState.pageChanging = true;
    
    try {
        // 1. 淡出页面标题和操作按钮
        elements.pageTitle.classList.add('changing');
        elements.pageActions.classList.add('changing');
        
        // 2. 等待短暂延迟以确保动画开始
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 3. 获取页面模块实例
        const pageModuleName = pageModules[pageName];
        const newPageInstance = window[pageModuleName];
        
        if (!newPageInstance) {
            throw new Error(`页面模块 ${pageName} 未找到，请确保已加载相应的JS文件`);
        }
        
        // 4. 准备新页面内容
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container page-enter';
        pageContainer.id = `page-${pageName}`;
        
        // 5. 渲染新页面内容
        pageContainer.innerHTML = newPageInstance.render();
        
        // 6. 如果存在旧页面，准备淡出
        const oldPageContainer = elements.mainContent.querySelector('.page-container');
        if (oldPageContainer) {
            oldPageContainer.classList.add('page-exit');
        }
        
        // 7. 添加新页面到 DOM
        elements.mainContent.appendChild(pageContainer);
        
        // 8. 强制重排以确保动画生效
        pageContainer.offsetWidth; // 触发重排
        
        // 9. 触发动画
        requestAnimationFrame(() => {
            pageContainer.classList.add('page-active');
            
            if (oldPageContainer) {
                oldPageContainer.classList.add('page-active');
            }
        });
        
        // 10. 等待动画完成后移除旧页面
        await new Promise(resolve => setTimeout(resolve, 300)); // 与CSS中的动画时长一致
        
        if (oldPageContainer) {
            oldPageContainer.remove();
        }
        
        // 11. 淡入页面标题和操作按钮
        elements.pageTitle.classList.remove('changing');
        elements.pageActions.classList.remove('changing');
        
        // 12. 更新应用状态
        appState.currentPage = pageName;
        
        // 13. 如果页面有初始化方法，调用它
        if (newPageInstance.init) {
            await newPageInstance.init();
        }
        
        // 14. 如果页面有afterRender方法，调用它
        if (newPageInstance.afterRender) {
            newPageInstance.afterRender();
        }
        
        // 15. 保存页面实例以便后续使用
        if (appState.pageInstance && appState.pageInstance.destroy) {
            appState.pageInstance.destroy();
        }
        appState.pageInstance = newPageInstance;
        
        // 16. 触发页面切换事件
        document.dispatchEvent(new CustomEvent('pageChanged', { 
            detail: { page: pageName }
        }));
        
        // 17. 调用页面的onActivate方法（如果存在）
        if (newPageInstance.onActivate) {
            newPageInstance.onActivate();
        }
        
    } catch (error) {
        console.error('加载页面失败:', error);
        elements.mainContent.innerHTML = `
            <div class="page-container">
                <div class="error-container">
                    <h2>${I18n.translate('PAGE_LOAD_ERROR', '页面加载失败')}</h2>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
    } finally {
        // 延迟重置pageChanging状态，确保所有动画都已完成
        setTimeout(() => {
            appState.pageChanging = false;
        }, 350);
    }
}

// 设置主题切换
function setupThemeToggle() {
    elements.themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme(e);
    });
    
    // 更新主题图标
    updateThemeIcon();
}

// 设置语言切换
function setupLanguageToggle() {
    // 确保I18n模块已初始化
    if (window.I18n && typeof I18n.initLanguageSelector === 'function') {
        // 调用I18n模块的语言选择器初始化方法
        I18n.initLanguageSelector();
    } else {
        // 如果I18n模块尚未准备好，等待它加载完成
        document.addEventListener('i18nReady', () => {
            I18n.initLanguageSelector();
        });
    }
}


// 更新主题图标
function updateThemeIcon() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    elements.themeToggle.querySelector('.material-symbols-rounded').textContent = 
        isDarkTheme ? 'dark_mode' : 'light_mode';
}

// 切换主题
function toggleTheme(event) {
    if (appState.themeChanging) return;
    appState.themeChanging = true;
    
    // 创建涟漪效果
    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple';
    
    // 设置涟漪颜色
    const isDarkTheme = document.body.classList.contains('dark-theme');
    ripple.style.setProperty('--ripple-color', isDarkTheme ? '#FFFBFF' : '#1C1B1E');
    
    // 设置涟漪位置
    const x = event.clientX;
    const y = event.clientY;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // 添加到 DOM
    document.body.appendChild(ripple);
    
    // 触发动画
    setTimeout(() => {
        ripple.classList.add('active');
    }, 10);
    
    // 等待动画开始后切换主题
    setTimeout(() => {
        // 切换主题类
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        
        // 更新主题图标
        updateThemeIcon();
        
        // 保存主题设置
        const newTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        
        // 更新 meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1C1B1E' : '#FFFBFF');
        }
    }, 400);
    
    // 动画结束后移除涟漪元素
    setTimeout(() => {
        ripple.remove();
        appState.themeChanging = false;
    }, 1000);
}

// 当 DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
