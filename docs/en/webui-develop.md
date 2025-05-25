# AMMF WebUI Page Module Development Guide

This document aims to assist developers in creating new page modules for the AMMF WebUI. Based on the provided `app.js`, `core.js`, `settings.js`, and `about.js`, we will detail how to develop a new page module, covering module structure, core functionality, internationalization support, and page interactions.

---

## 1. Overview

AMMF WebUI is a modular web interface for managing AMMF modules. It uses a JavaScript modular design, supporting dynamic page loading, internationalization (i18n), theme switching, and Shell command execution. Each page module (e.g., `SettingsPage` and `AboutPage`) is an independent JavaScript object responsible for a specific page's logic, rendering, and interactions.

New page modules should adhere to the following principles:
- **Modularity**: Each page module is independent, registered in the global scope (e.g., `window.MyPage`).
- **Consistency**: Follow the structure and API of existing modules (e.g., `init`, `render`, `afterRender`).
- **Internationalization**: Support multiple languages using `I18n.translate`.
- **Asynchronous Loading**: Support data preloading and asynchronous initialization.

---

## 2. Creating a Page Module

The following steps outline how to create a new page module. We use an example module, `DashboardPage`, which displays a dashboard page showing module status and action buttons.

### 2.1 File Structure

Create a new file, `dashboard.js`, and place it in the same directory as `settings.js` and `about.js`. The file structure is as follows:

```javascript
/**
 * AMMF WebUI Dashboard Page Module
 * Displays module status and actions
 */

const DashboardPage = {
    // Module code
};

// Export module
window.DashboardPage = DashboardPage;
```

### 2.2 Basic Module Structure

A page module is a JavaScript object containing the following core methods and properties:

- **Properties**:
  - Store page state or data (e.g., `moduleInfo`, `isLoading`).
  - Configuration options (e.g., `config`).
- **Methods**:
  - `init()`: Initialize the module, load data, and register events.
  - `render()`: Render the page HTML.
  - `afterRender()`: Bind events or execute logic after rendering.
  - `preloadData()`: Preload data (optional).
  - `registerActions()`: Register page action buttons.
  - `onActivate()`: Callback when the page is activated.
  - `onDeactivate()`: Cleanup logic when the page is deactivated.
  - `onLanguageChanged()`: Handle language change events.

Example module skeleton:

```javascript
/**
 * AMMF WebUI Dashboard Page Module
 * Displays module status and actions
 */

const DashboardPage = {
    // State and data
    status: {},
    isLoading: false,
    config: {
        refreshInterval: 5000 // Auto-refresh interval (ms)
    },

    // Preload data
    async preloadData() {
        try {
            const statusData = await Core.execCommand('some_status_command');
            return { status: this.parseStatus(statusData) };
        } catch (error) {
            console.warn('Failed to preload dashboard data:', error);
            return {};
        }
    },

    // Initialize
    async init() {
        try {
            this.registerActions();
            const preloadedData = PreloadManager.getData('dashboard') || await this.preloadData();
            this.status = preloadedData.status || {};
            I18n.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));
            return true;
        } catch (error) {
            console.error('Failed to initialize dashboard page:', error);
            return false;
        }
    },

    // Render page
    render() {
        return `
            <div class="dashboard-container">
                <h2>${I18n.translate('DASHBOARD_TITLE', 'Dashboard')}</h2>
                <div class="status-card">
                    <p>${I18n.translate('STATUS', 'Status')}: ${this.status.value || 'Unknown'}</p>
                </div>
            </div>
        `;
    },

    // Post-render callback
    afterRender() {
        // Bind events
        const refreshButton = document.getElementById('refresh-dashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshStatus());
        }
    },

    // Register action buttons
    registerActions() {
        UI.registerPageActions('dashboard', [
            {
                id: 'refresh-dashboard',
                icon: 'refresh',
                title: I18n.translate('REFRESH', 'Refresh'),
                onClick: 'refreshStatus'
            }
        ]);
    },

    // Refresh status
    async refreshStatus() {
        try {
            this.showLoading();
            const statusData = await Core.execCommand('some_status_command');
            this.status = this.parseStatus(statusData);
            this.updateDisplay();
            Core.showToast(I18n.translate('STATUS_REFRESHED', 'Status refreshed'));
        } catch (error) {
            console.error('Failed to refresh status:', error);
            Core.showToast(I18n.translate('STATUS_REFRESH_ERROR', 'Failed to refresh status'), 'error');
        } finally {
            this.hideLoading();
        }
    },

    // Parse status data
    parseStatus(data) {
        // Assume data is key-value pairs
        return { value: data.trim() || 'Unknown' };
    },

    // Update display
    updateDisplay() {
        const container = document.querySelector('.dashboard-container');
        if (container) {
            container.innerHTML = this.render().trim();
            this.afterRender();
        }
    },

    // Show loading
    showLoading() {
        this.isLoading = true;
        // Show loading animation (see SettingsPage.showLoading)
    },

    // Hide loading
    hideLoading() {
        this.isLoading = false;
        // Hide loading animation (see SettingsPage.hideLoading)
    },

    // Handle language change
    onLanguageChanged() {
        this.updateDisplay();
    },

    // Page activation
    onActivate() {
        // Start periodic refresh, etc.
    },

    // Page deactivation
    onDeactivate() {
        I18n.unregisterLanguageChangeHandler(this.onLanguageChanged.bind(this));
        UI.clearPageActions('dashboard');
    }
};

// Export module
window.DashboardPage = DashboardPage;
```

---

## 3. Core Functionality Implementation

### 3.1 Initialization and Data Loading

- **Use `init` Method**: Initialize the page module, load data, and register events. Reference `SettingsPage.init` and `AboutPage.init`:
  - Call `registerActions` to register action buttons.
  - Use `PreloadManager.getData` to retrieve preloaded data or call `preloadData` to load data.
  - Register language change handler with `I18n.registerLanguageChangeHandler`.
- **Asynchronous Operations**: Use `async/await` to ensure data loading completes.
- **Error Handling**: Catch exceptions, log errors, and return `true` (success) or `false` (failure).

```javascript
async init() {
    try {
        this.registerActions();
        const preloadedData = PreloadManager.getData('dashboard') || await this.preloadData();
        this.status = preloadedData.status || {};
        I18n.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));
        return true;
    } catch (error) {
        console.error('Failed to initialize dashboard page:', error);
        return false;
    }
}
```

### 3.2 Rendering the Page

- **Use `render` Method**: Return the page’s HTML string. Reference `SettingsPage.render` and `AboutPage.render`:
  - Use template literals (`` ` ``) to generate HTML.
  - Embed internationalized text with `I18n.translate(key, fallback)`.
  - Dynamically insert data (e.g., `this.status.value`).
- **Structured HTML**: Use semantic class names (e.g., `dashboard-container`, `status-card`) and Material Design icons.

```javascript
render() {
    return `
        <div class="dashboard-container">
            <h2>${I18n.translate('DASHBOARD_TITLE', 'Dashboard')}</h2>
            <div class="status-card">
                <p>${I18n.translate('STATUS', 'Status')}: ${this.status.value || 'Unknown'}</p>
            </div>
        </div>
    `;
}
```

### 3.3 Post-Render Logic

- **Use `afterRender` Method**: Bind events or execute logic after rendering. Reference `AboutPage.afterRender`:
  - Bind button click events (e.g., `refreshButton.addEventListener`).
  - Initialize dynamic components (e.g., sliders, dialogs).
- **Event Delegation**: Consider using event delegation (see `SettingsPage.bindSettingEvents`) to improve performance.

```javascript
afterRender() {
    const refreshButton = document.getElementById('refresh-dashboard');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => this.refreshStatus());
    }
}
```

### 3.4 Action Buttons

- **Use `registerActions` Method**: Register page action buttons. Reference `SettingsPage.registerActions` and `AboutPage.registerActions`:
  - Call `UI.registerPageActions` to register buttons.
  - Each button requires `id`, `icon`, `title`, and `onClick` properties.
  - Optional `disabled` function to control button state.

```javascript
registerActions() {
    UI.registerPageActions('dashboard', [
        {
            id: 'refresh-dashboard',
            icon: 'refresh',
            title: I18n.translate('REFRESH', 'Refresh'),
            onClick: 'refreshStatus'
        }
    ]);
}
```

### 3.5 Data Preloading

- **Use `preloadData` Method**: Load data in advance to improve page load speed. Reference `AboutPage.preloadData`:
  - Use `Core.execCommand` to execute Shell commands for data.
  - Cache data in `sessionStorage` or `PreloadManager`.
- **Register with `PreloadManager`**: Register the preload function when the module loads.

```javascript
// Register during module load
PreloadManager.registerDataLoader('dashboard', DashboardPage.preloadData.bind(DashboardPage));
```

### 3.6 Internationalization Support

- **Use `I18n.translate`**: Provide translations for all UI text. Reference `SettingsPage.renderSettings` and `AboutPage.render`:
  - Format: `I18n.translate('KEY', 'Default')`.
  - Ensure translations for Chinese (`zh`) and English (`en`).
- **Language Change Handling**: Implement `onLanguageChanged` to re-render the page.

```javascript
onLanguageChanged() {
    this.updateDisplay();
}
```

### 3.7 Page Lifecycle

- **Activation (`onActivate`)**: Called when the page is displayed; use for starting timers or initializing state.
- **Deactivation (`onDeactivate`)**: Called when the page is hidden; clean up resources and event listeners. Reference `SettingsPage.onDeactivate` and `AboutPage.onDeactivate`.

```javascript
onActivate() {
    // Start periodic refresh
}

onDeactivate() {
    I18n.unregisterLanguageChangeHandler(this.onLanguageChanged.bind(this));
    UI.clearPageActions('dashboard');
}
```

### 3.8 Shell Command Execution

- **Use `Core.execCommand`**: Execute Shell commands to fetch data or perform actions. Reference `SettingsPage.loadSettingsData` and `AboutPage.loadModuleInfo`:
  - Asynchronous call returning command output.
  - Handle errors and display user prompts with `Core.showToast`.

```javascript
async refreshStatus() {
    try {
        const statusData = await Core.execCommand('some_status_command');
        this.status = this.parseStatus(statusData);
        Core.showToast(I18n.translate('STATUS_REFRESHED', 'Status refreshed'));
    } catch (error) {
        Core.showToast(I18n.translate('STATUS_REFRESH_ERROR', 'Failed to refresh status'), 'error');
    }
}
```

### 3.9 User Notifications

- **Use `Core.showToast`**: Display notification messages. Reference `SettingsPage.saveSettings` and `AboutPage.refreshModuleInfo`:
  - Parameters: `message` (text), `type` (`info`, `success`, `warning`, `error`), `duration` (display time in ms).

```javascript
Core.showToast(I18n.translate('STATUS_REFRESHED', 'Status refreshed'), 'success');
```

---

## 4. Integrating into the Application

### 4.1 Register Route

Register the new page module in `app.js` under `Router.modules`:

```javascript
static modules = {
    status: 'StatusPage',
    logs: 'LogsPage',
    settings: 'SettingsPage',
    about: 'AboutPage',
    dashboard: 'DashboardPage' // Add new page
};
```

### 4.2 Update Navigation

Add a navigation item in the main HTML file, ensuring it matches the `dashboard` key in `Router.modules`:

```html
<div class="nav-item" data-page="dashboard">
    <span class="material-symbols-rounded">dashboard</span>
    <span data-i18n="NAV_DASHBOARD">Dashboard</span>
</div>
```

### 4.3 Load Module

Ensure `dashboard.js` is loaded in the main HTML:

```html
<script src="js/dashboard.js"></script>
```

---

## 5. Best Practices

- **Error Handling**: Catch exceptions in all asynchronous operations and use `Core.showToast` to notify users.
- **Performance Optimization**:
  - Use `PreloadManager` for data preloading.
  - Use event delegation to reduce event listeners.
  - Avoid frequent DOM operations; use `requestAnimationFrame` for animations.
- **Internationalization**: Provide `I18n.translate` for all text to support multiple languages.
- **Resource Cleanup**: Remove event listeners and timers in `onDeactivate`.
- **Consistency**: Follow naming conventions and code style of existing modules (e.g., `SettingsPage`, `AboutPage`).
- **Security**: Escape user input for HTML to prevent XSS attacks (see `SettingsPage.escapeHtml`).

---

## 6. Complete Example Code

Below is the complete example code for `dashboard.js`:

```javascript
/**
 * AMMF WebUI Dashboard Page Module
 * Displays module status and actions
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
            console.warn('Failed to preload dashboard data:', error);
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
            console.error('Failed to initialize dashboard page:', error);
            return false;
        }
    },

    render() {
        return `
            <div class="dashboard-container">
                <h2>${I18n.translate('DASHBOARD_TITLE', 'Dashboard')}</h2>
                <div class="status-card">
                    <p>${I18n.translate('STATUS', 'Status')}: ${this.status.value || 'Unknown'}</p>
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
                title: I18n.translate('REFRESH', 'Refresh'),
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
            Core.showToast(I18n.translate('STATUS_REFRESHED', 'Status refreshed'));
        } catch (error) {
            console.error('Failed to refresh status:', error);
            Core.showToast(I18n.translate('STATUS_REFRESH_ERROR', 'Failed to refresh status'), 'error');
        } finally {
            this.hideLoading();
        }
    },

    parseStatus(data) {
        return { value: data.trim() || 'Unknown' };
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

// Register preload
PreloadManager.registerDataLoader('dashboard', DashboardPage.preloadData.bind(DashboardPage));

// Export module
window.DashboardPage = DashboardPage;
```

---

## 7. Common Questions

**Q1: How to debug a page module?**
- Use `console.log` and `console.error` for logging.
- Check the DOM and network requests in browser developer tools.
- Verify `Core.execCommand` returns expected output.

**Q2: How to add new action buttons?**
- Add new button configurations in `registerActions`, ensuring unique `id` and `onClick` pointing to a module method.

**Q3: How to support multiple languages?**
- Use `I18n.translate` for all text with translation keys and defaults.
- Implement `onLanguageChanged` to update the page.

**Q4: How to handle asynchronous operation timeouts?**
- Use `Promise.race` to set timeouts, as in `SettingsPage.loadSettingsData`.

---

## 8. Summary

By following this guide, you can quickly create new page modules for AMMF WebUI. The key is to maintain modularity, consistency, and internationalization support while leveraging APIs from `Core` and `App` (e.g., `execCommand`, `showToast`, `renderUI`). Refer to `SettingsPage` and `AboutPage` for robust and user-friendly implementations.

For further assistance, review existing module code or contact the AMMF WebUI development team.