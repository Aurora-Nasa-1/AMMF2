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
    /**
     * 显示Toast消息
     * @param {string} message - 要显示的消息文本
     * @param {string} type - 消息类型 ('info', 'success', 'warning', 'error')
     * @param {number} duration - 消息显示时长 (毫秒)
     */
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.error('Toast container not found!');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');

            setTimeout(() => {
                if (toast.parentElement === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 150);
        }, duration);
    },

    /**
     * DOM 就绪检查
     * @param {function} callback - DOM 就绪后执行的回调函数
     */
    onDOMReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
};

// 导出核心模块到全局作用域
window.Core = Core;
