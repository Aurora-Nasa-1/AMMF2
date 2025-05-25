# AMMF WebUI 页面模块开发文档

本文档旨在帮助开发者为 AMMF WebUI 创建新的页面模块。基于提供的 `app.js`、`core.js`、`settings.js` 和 `about.js`，我们将详细介绍如何开发一个新的页面模块，包括模块结构、核心功能实现、国际化支持和页面交互等。

---

## 1. 概述

AMMF WebUI 是一个模块化的 Web 界面，用于管理 AMMF 模块。它通过 JavaScript 模块化设计，支持动态页面加载、国际化（i18n）、主题切换和 Shell 命令执行。每个页面模块（如 `SettingsPage` 和 `AboutPage`）是一个独立的 JavaScript 对象，负责特定页面的逻辑、渲染和交互。

新页面模块需要遵循以下原则：
- **模块化**：每个页面模块是独立的，注册到全局作用域（如 `window.MyPage`）。
- **一致性**：遵循现有模块的结构和 API（如 `init`、`render`、`afterRender` 等）。
- **国际化**：支持多语言，通过 `I18n.translate` 提供翻译。
- **异步加载**：支持数据预加载和异步初始化。

---

## 2. 创建页面模块

以下是创建一个新页面模块的步骤。我们以一个示例模块 `DashboardPage` 为例，该模块显示一个仪表盘页面，展示模块状态和操作按钮。

### 2.1 文件结构

创建一个新文件 `dashboard.js`，并将其放置在与 `settings.js` 和 `about.js` 相同的目录下。文件结构如下：

```javascript
/**
 * AMMF WebUI 仪表盘页面模块
 * 显示模块状态和操作
 */

const DashboardPage = {
    // 模块代码
};

// 导出模块
window.DashboardPage = DashboardPage;
```

### 2.2 基本模块结构

页面模块是一个 JavaScript 对象，包含以下核心方法和属性：

- **属性**：
  - 存储页面状态或数据（如 `moduleInfo`、`isLoading`）。
  - 配置项（如 `config`）。
- **方法**：
  - `init()`：初始化模块，加载数据并注册事件。
  - `render()`：渲染页面 HTML。
  - `afterRender()`：渲染后绑定事件或执行其他逻辑。
  - `preloadData()`：预加载数据（可选）。
  - `registerActions()`：注册页面操作按钮。
  - `onActivate()`：页面激活时的回调。
  - `onDeactivate()`：页面停用时的清理逻辑。
  - `onLanguageChanged()`：语言切换时的处理逻辑。

示例模块骨架：

```javascript
/**
 * AMMF WebUI 仪表盘页面模块
 * 显示模块状态和操作
 */

const DashboardPage = {
    // 状态和数据
    status: {},
    isLoading: false,
    config: {
        refreshInterval: 5000 // 自动刷新间隔（毫秒）
    },

    // 预加载数据
    async preloadData() {
        try {
            const statusData = await Core.execCommand('some_status_command');
            return { status: this.parseStatus(statusData) };
        } catch (error) {
            console.warn('预加载仪表盘数据失败:', error);
            return {};
        }
    },

    // 初始化
    async init() {
        try {
            this.registerActions();
            const preloadedData = PreloadManager.getData('dashboard') || await this.preloadData();
            this.status = preloadedData.status || {};
            I18n.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));
            return true;
        } catch (error) {
            console.error('初始化仪表盘页面失败:', error);
            return false;
        }
    },

    // 渲染页面
    render() {
        return `
            <div class="dashboard-container">
                <h2>${I18n.translate('DASHBOARD_TITLE', '仪表盘')}</h2>
                <div class="status-card">
                    <p>${I18n.translate('STATUS', '状态')}: ${this.status.value || '未知'}</p>
                </div>
            </div>
        `;
    },

    // 渲染后回调
    afterRender() {
        // 绑定事件
        const refreshButton = document.getElementById('refresh-dashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshStatus());
        }
    },

    // 注册操作按钮
    registerActions() {
        UI.registerPageActions('dashboard', [
            {
                id: 'refresh-dashboard',
                icon: 'refresh',
                title: I18n.translate('REFRESH', '刷新'),
                onClick: 'refreshStatus'
            }
        ]);
    },

    // 刷新状态
    async refreshStatus() {
        try {
            this.showLoading();
            const statusData = await Core.execCommand('some_status_command');
            this.status = this.parseStatus(statusData);
            this.updateDisplay();
            Core.showToast(I18n.translate('STATUS_REFRESHED', '状态已刷新'));
        } catch (error) {
            console.error('刷新状态失败:', error);
            Core.showToast(I18n.translate('STATUS_REFRESH_ERROR', '刷新状态失败'), 'error');
        } finally {
            this.hideLoading();
        }
    },

    // 解析状态数据
    parseStatus(data) {
        // 假设数据是键值对
        return { value: data.trim() || '未知' };
    },

    // 更新显示
    updateDisplay() {
        const container = document.querySelector('.dashboard-container');
        if (container) {
            container.innerHTML = this.render().trim();
            this.afterRender();
        }
    },

    // 显示加载中
    showLoading() {
        this.isLoading = true;
        // 显示加载动画（可参考 `SettingsPage.showLoading`）
    },

    // 隐藏加载中
    hideLoading() {
        this.isLoading = false;
        // 隐藏加载动画（可参考 `SettingsPage.hideLoading`）
    },

    // 语言切换处理
    onLanguageChanged() {
        this.updateDisplay();
    },

    // 页面激活
    onActivate() {
        // 可在此启动定时刷新等
    },

    // 页面停用
    onDeactivate() {
        I18n.unregisterLanguageChangeHandler(this.onLanguageChanged.bind(this));
        UI.clearPageActions('dashboard');
    }
};

// 导出模块
window.DashboardPage = DashboardPage;
```

---

## 3. 核心功能实现

### 3.1 初始化和数据加载

- **使用 `init` 方法**：初始化页面模块，加载数据并注册事件。参考 `SettingsPage.init` 和 `AboutPage.init`：
  - 调用 `registerActions` 注册操作按钮。
  - 使用 `PreloadManager.getData` 获取预加载数据，或调用 `preloadData` 加载数据。
  - 注册语言切换处理器 `I18n.registerLanguageChangeHandler`。
- **异步操作**：使用 `async/await` 确保数据加载完成。
- **错误处理**：捕获异常并记录日志，返回 `true`（成功）或 `false`（失败）。

```javascript
async init() {
    try {
        this.registerActions();
        const preloadedData = PreloadManager.getData('dashboard') || await this.preloadData();
        this.status = Forthcoming data.status || {};
        I18n.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));
        return true;
    } catch (error) {
        console.error('初始化仪表盘页面失败:', error);
        return false;
    }
}
```

### 3.2 渲染页面

- **使用 `render` 方法**：返回页面的 HTML 字符串。参考 `SettingsPage.render` 和 `AboutPage.render`：
  - 使用模板字符串（`` ` ``）生成 HTML。
  - 嵌入国际化文本 `I18n.translate(key, fallback)`。
  - 动态插入数据（如 `this.status.value`）。
- **结构化 HTML**：使用语义化的类名（如 `dashboard-container`、`status-card`）和 Material Design 图标。

```javascript
render() {
    return `
        <div class="dashboard-container">
            <h2>${I18n.translate('DASHBOARD_TITLE', '仪表盘')}</h2>
            <div class="status-card">
                <p>${I18n.translate('STATUS', '状态')}: ${this.status.value || '未知'}</p>
            </div>
        </div>
    `;
}
```

### 3.3 渲染后逻辑

- **使用 `afterRender` 方法**：在页面渲染后绑定事件或执行其他逻辑。参考 `AboutPage.afterRender`：
  - 绑定按钮点击事件（如 `refreshButton.addEventListener`）。
  - 初始化动态组件（如滑块、对话框）。
- **事件委托**：考虑使用事件委托（如 `SettingsPage.bindSettingEvents`）以提高性能。

```javascript
afterRender() {
    const refreshButton = document.getElementById('refresh-dashboard');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => this.refreshStatus());
    }
}
```

### 3.4 操作按钮

- **使用 `registerActions` 方法**：注册页面操作按钮，参考 `SettingsPage.registerActions` 和 `AboutPage.registerActions`：
  - 调用 `UI.registerPageActions` 注册按钮。
  - 每个按钮需要 `id`、`icon`、`title` 和 `onClick` 属性。
  - 可选 `disabled` 函数控制按钮禁用状态。

```javascript
registerActions() {
    UI.registerPageActions('dashboard', [
        {
            id: 'refresh-dashboard',
            icon: 'refresh',
            title: I18n.translate('REFRESH', '刷新'),
            onClick: 'refreshStatus'
        }
    ]);
}
```

### 3.5 数据预加载

- **使用 `preloadData` 方法**：提前加载数据以提高页面加载速度。参考 `AboutPage.preloadData`：
  - 使用 `Core.execCommand` 执行 Shell 命令获取数据。
  - 缓存数据到 `sessionStorage` 或 `PreloadManager`。
- **注册到 `PreloadManager`**：在模块加载时注册预加载函数。

```javascript
// 在模块加载时注册
PreloadManager.registerDataLoader('dashboard', DashboardPage.preloadData.bind(DashboardPage));
```

### 3.6 国际化支持

- **使用 `I18n.translate`**：为所有用户界面文本提供翻译，参考 `SettingsPage.renderSettings` 和 `AboutPage.render`：
  - 格式：`I18n.translate('KEY', '默认值')`。
  - 确保提供中文（`zh`）和英文（`en`）翻译。
- **语言切换处理**：实现 `onLanguageChanged` 方法，重新渲染页面。

```javascript
onLanguageChanged() {
    this.updateDisplay();
}
```

### 3.7 页面生命周期

- **激活 (`onActivate`)**：页面显示时调用，可启动定时任务或初始化状态。
- **停用 (`onDeactivate`)**：页面隐藏时调用，清理资源和事件监听器，参考 `SettingsPage.onDeactivate` 和 `AboutPage.onDeactivate`。

```javascript
onActivate() {
    // 启动定时刷新
}

onDeactivate() {
    I18n.unregisterLanguageChangeHandler(this.onLanguageChanged.bind(this));
    UI.clearPageActions('dashboard');
}
```

### 3.8 Shell 命令执行

- **使用 `Core.execCommand`**：执行 Shell 命令以获取数据或执行操作，参考 `SettingsPage.loadSettingsData` 和 `AboutPage.loadModuleInfo`：
  - 异步调用，返回命令输出。
  - 处理错误并显示用户提示（`Core.showToast`）。

```javascript
async refreshStatus() {
    try {
        const statusData = await Core.execCommand('some_status_command');
        this.status = this.parseStatus(statusData);
        Core.showToast(I18n.translate('STATUS_REFRESHED', '状态已刷新'));
    } catch (error) {
        Core.showToast(I18n.translate('STATUS_REFRESH_ERROR', '刷新状态失败'), 'error');
    }
}
```

### 3.9 用户提示

- **使用 `Core.showToast`**：显示通知消息，参考 `SettingsPage.saveSettings` 和 `AboutPage.refreshModuleInfo`：
  - 参数：`message`（消息文本）、`type`（`info`、`success`、`warning`、`error`）、`duration`（显示时长，毫秒）。

```javascript
Core.showToast(I18n.translate('STATUS_REFRESHED', '状态已刷新'), 'success');
```

---

## 4. 集成到应用

### 4.1 注册路由

在 `app.js` 的 `Router.modules` 中注册新页面模块：

```javascript
static modules = {
    status: 'StatusPage',
    logs: 'LogsPage',
    settings: 'SettingsPage',
    about: 'AboutPage',
    dashboard: 'DashboardPage' // 添加新页面
};
```

### 4.2 更新导航

在主 HTML 文件中添加导航项，确保与 `Router.modules` 的 `dashboard` 键匹配：

```html
<div class="nav-item" data-page="dashboard">
    <span class="material-symbols-rounded">dashboard</span>
    <span data-i18n="NAV_DASHBOARD">仪表盘</span>
</div>
```

### 4.3 加载模块

确保 `dashboard.js` 在主 HTML 中加载：

```html
<script src="js/dashboard.js"></script>
```

---

## 5. 最佳实践

- **错误处理**：在所有异步操作中捕获异常，使用 `Core.showToast` 通知用户。
- **性能优化**：
  - 使用 `PreloadManager` 预加载数据。
  - 使用事件委托减少事件监听器。
  - 避免频繁 DOM 操作，使用 `requestAnimationFrame` 优化动画。
- **国际化**：为所有文本提供 `I18n.translate` 调用，确保支持多语言。
- **清理资源**：在 `onDeactivate` 中移除事件监听器和定时器。
- **一致性**：遵循现有模块的命名约定和代码风格（如 `SettingsPage` 和 `AboutPage`）。
- **安全**：对用户输入进行 HTML 转义（如 `SettingsPage.escapeHtml`）以防止 XSS 攻击。

---

## 6. 示例完整代码

以下是 `dashboard.js` 的完整示例代码：

```javascript
/**
 * AMMF WebUI 仪表盘页面模块
 * 显示模块状态和操作
 */

const DashboardPage = {
    status: {},
    isLoading: false,
    config: {
        refreshInterval: 5000
    },

    async preloadData() {
        try {
            const statusData = await Core.execCommand('some_status_command');
            return { status: this.parseStatus(statusData) };
        } catch (error) {
            console.warn('预加载仪表盘数据失败:', error);
            return {};
        }
    },

    async init() {
        try {
            this.registerActions();
            const preloadedData = PreloadManager.getData('dashboard') || await this.preloadData();
            this.status = preloadedData.status || {};
            I18n.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));
            return true;
        } catch (error) {
            console.error('初始化仪表盘页面失败:', error);
            return false;
        }
    },

    render() {
        return `
            <div class="dashboard-container">
                <h2>${I18n.translate('DASHBOARD_TITLE', '仪表盘')}</h2>
                <div class="status-card">
                    <p>${I18n.translate('STATUS', '状态')}: ${this.status.value || '未知'}</p>
                </div>
            </div>
        `;
    },

    afterRender() {
        const refreshButton = document.getElementById('refresh-dashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshStatus());
        }
    },

    registerActions() {
        UI.registerPageActions('dashboard', [
            {
                id: 'refresh-dashboard',
                icon: 'refresh',
                title: I18n.translate('REFRESH', '刷新'),
                onClick: 'refreshStatus'
            }
        ]);
    },

    async refreshStatus() {
        try {
            this.showLoading();
            const statusData = await Core.execCommand('some_status_command');
            this.status = this.parseStatus(statusData);
            this.updateDisplay();
            Core.showToast(I18n.translate('STATUS_REFRESHED', '状态已刷新'));
        } catch (error) {
            console.error('刷新状态失败:', error);
            Core.showToast(I18n.translate('STATUS_REFRESH_ERROR', '刷新状态失败'), 'error');
        } finally {
            this.hideLoading();
        }
    },

    parseStatus(data) {
        return { value: data.trim() || '未知' };
    },

    updateDisplay() {
        const container = document.querySelector('.dashboard-container');
        if (container) {
            container.innerHTML = this.render().trim();
            this.afterRender();
        }
    },

    showLoading() {
        this.isLoading = true;
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-overlay';
        loadingElement.innerHTML = '<div class="loading-spinner"></div>';
        document.querySelector('.dashboard-container')?.appendChild(loadingElement);
    },

    hideLoading() {
        this.isLoading = false;
        const loadingElement = document.querySelector('.loading-overlay');
        if (loadingElement) {
            loadingElement.remove();
        }
    },

    onLanguageChanged() {
        this.updateDisplay();
    },

    onActivate() {},

    onDeactivate() {
        I18n.unregisterLanguageChangeHandler(this.onLanguageChanged.bind(this));
        UI.clearPageActions('dashboard');
    }
};

// 注册预加载
PreloadManager.registerDataLoader('dashboard', DashboardPage.preloadData.bind(DashboardPage));

// 导出模块
window.DashboardPage = DashboardPage;
```

---

## 7. 常见问题

**Q1：如何调试页面模块？**
- 使用 `console.log` 和 `console.error` 记录日志。
- 在浏览器开发者工具中检查 DOM 和网络请求。
- 确保 `Core.execCommand` 返回预期输出。

**Q2：如何添加新的操作按钮？**
- 在 `registerActions` 中添加新的按钮配置，确保 `id` 唯一，`onClick` 指向模块中的方法。

**Q3：如何支持多语言？**
- 使用 `I18n.translate` 为所有文本提供翻译键和默认值。
- 实现 `onLanguageChanged` 方法以更新页面。

**Q4：如何处理异步操作超时？**
- 使用 `Promise.race` 设置超时，参考 `SettingsPage.loadSettingsData`。

---

## 8. 总结

通过遵循本文档，您可以快速为 AMMF WebUI 创建新的页面模块。关键是保持模块化、一致性和国际化支持，同时利用 `Core` 和 `App` 提供的 API（如 `execCommand`、`showToast`、`renderUI`）。参考 `SettingsPage` 和 `AboutPage` 的实现，确保代码健壮且用户友好。

如需进一步帮助，请查看现有模块代码或联系 AMMF WebUI 开发团队。