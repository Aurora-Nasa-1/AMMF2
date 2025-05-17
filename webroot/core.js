/**
 * AMMF WebUI 核心功能模块
 * 提供Shell命令执行能力
 */

const Core = {
    // 模块路径
    MODULE_PATH: '/data/adb/modules/AMMF/',

    // 执行Shell命令
    async execCommand(command) {
        const callbackName = `exec_callback_${Date.now()}`;
        return new Promise((resolve, reject) => {
            window[callbackName] = (errno, stdout, stderr) => {
                delete window[callbackName];
                errno === 0 ? resolve(stdout) : reject(stderr);
            };
            ksu.exec(command, "{}", callbackName);
        });
    },
    // 显示Toast消息
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 自动关闭
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, duration);
    },
    // DOM 就绪检查
    onDOMReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
};

// 导出核心模块
window.Core = Core;
