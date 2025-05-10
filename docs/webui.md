# AMMF WebUI 开发指南

## 📋 概述

AMMF WebUI是一个基于浏览器的配置界面，提供了模块设置、状态监控和常用操作的图形化管理功能。本指南将帮助你了解WebUI的结构和开发方法。

## 🚀 快速开始

### 项目结构

WebUI相关文件位于`webroot/`目录：

```
webroot/
├── index.html         # 主页面
├── app.js             # 应用逻辑
├── core.js            # 核心功能
├── i18n.js            # 多语言支持
├── style.css          # 主样式表
├── theme.js           # 主题管理
├── css-loader.js      # CSS加载器
├── css/               # 样式模块
    ├── animations.css # 动画效果
    ├── components.css # 组件样式
    ├── md3.css        # MD3布局框架
    └── pages/         # 页面样式
        ├── about.css   
        ├── logs.css 
        ├── settings.css
        └── status.css
└── pages/             # 页面模块
    ├── about.js
    ├── logs.js
    ├── settings.js
    └── status.js
```

## 🎨 界面开发

### 样式系统

WebUI采用Material Design 3设计规范，使用模块化的CSS结构
```css
/* 样式模块 */
@import url('./pages/settings.css');
@import url('./pages/status.css');
@import url('./pages/logs.css');
@import url('./pages/about.css');
```

### 简单配置
状态页面提供了简单配置的选项：
```javascript
        const quickActionsEnabled = false; // 设置为false可全部隐藏
        const quickActions = [
            {
                title: '清理缓存',
                icon: 'delete',
                command: 'rm -rf /data/local/tmp/*'
            },
            {
                title: '重启服务',
                icon: 'restart_alt',
                command: 'sh ${Core.MODULE_PATH}service.sh restart'
            },
            {
                title: '查看日志',
                icon: 'description',
                command: 'cat ${Core.MODULE_PATH}logs.txt'
            }
        ];
```
关于界面也提供了简单配置：
```javascript
    // 配置项
    config: {
        showThemeToggle: false  // 控制是否显示主题切换按钮
    },
```

### 自定义界面样式
你可以在添加自定义CSS，通过css-loader.js加载：
```javascript
    // 自定义CSS路径
    customCSSPath: 'css/CustomCss/main.css',
```
**注意**：
- 使用自定义CSS时，原有样式将失效。
- 如果只是想添加覆盖css，只需在原css文件尾添加样式或者修改即可。

### 页面开发

每个页面都是一个独立的JS模块，需要实现以下接口：

```javascript
const PageModule = {
    // 初始化函数
    async init() {
        // 返回初始化状态
        return true;
    },
    
    // 渲染页面内容
    render() {
        return `
            <div class="page-container">
                <!-- 页面内容 -->
            </div>
        `;
    },
    
    // 渲染后的处理
    afterRender() {
        // 绑定事件等操作
    }
};
```

### 添加新页面

1. 在`pages/`目录创建页面模块文件
2. 在`index.html`引入页面脚本
3. 在`app.js`注册页面模块
4. 添加导航栏入口
5. 在`i18n.js`添加相关翻译

## 🔄 核心功能

### 数据处理

WebUI通过`core.js`提供的API与后端通信：

```javascript
// 执行Shell命令
async execCommand(command) {
    return new Promise((resolve, reject) => {
        const callbackName = `exec_callback_${Date.now()}`;
        window[callbackName] = (errno, stdout, stderr) => {
            delete window[callbackName];
            errno === 0 ? resolve(stdout) : reject(stderr);
        };
        ksu.exec(command, "{}", callbackName);
    });
}
```

### 多语言支持

使用`i18n.js`实现多语言支持：

- 使用`data-i18n`属性标记需要翻译的文本
- 在`i18n.js`中添加翻译字符串
- 调用`I18n.translate()`获取翻译

### 主题支持

通过`theme.js`实现主题切换：

- 使用CSS变量定义主题色
- 支持亮色/暗色模式
- 响应系统主题变化

## 📱 响应式设计

WebUI采用移动优先的响应式设计：

```css
/* 移动设备 */
@media (max-width: 767px) {
    .app-nav {
        height: 56px;
        bottom: 0;
    }
}

/* 平板设备 */
@media (min-width: 768px) and (max-width: 1023px) {
    .app-nav {
        height: 60px;
        bottom: 0;
    }
}

/* 桌面设备 */
@media (min-width: 1024px) {
    .app-nav {
        width: 80px;
        height: 100%;
        flex-direction: column;
        left: 0;
    }
}
```

## 🔧 开发建议

1. **调试工具**
   - 使用浏览器开发者工具(F12)
   - 添加`console.log()`输出调试信息
   - 使用`Core.showToast()`显示提示

2. **代码规范**
   - 遵循Material Design 3设计规范
   - 使用模块化的CSS结构
   - 保持代码整洁和注释完整

3. **性能优化**
   - 减少不必要的DOM操作
   - 优化事件监听器
   - 使用CSS动画代替JavaScript动画

## 🔄 版本升级

升级AMMF框架时注意以下文件的变化：

- `app.js`: 应用逻辑
- `core.js`: 核心功能
- `i18n.js`: 语言配置
- `css/`: 样式文件

建议在升级前备份自定义文件，仔细合并更改。