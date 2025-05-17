/**
 * AMMF WebUI 日志页面模块
 * 提供日志查看和管理功能
 */

const LogsPage = {
    // 日志文件列表
    logFiles: {},

    // 当前选中的日志文件
    currentLogFile: '',

    // 日志内容
    logContent: '',
    async preloadData() {
        try {
            const tasks = [
                this.checkLogsDirectoryExists(`${Core.MODULE_PATH}logs/`),
                this.scanLogFiles()
            ];

            const [dirExists, _] = await Promise.allSettled(tasks);

            return {
                dirExists: dirExists.value,
                logFiles: this.logFiles
            };
        } catch (error) {
            console.warn('预加载日志数据失败:', error);
            return null;
        }
    },
    async init() {
        try {
            this.registerActions();
            // 注册语言切换处理器
            app.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));

            // 获取预加载的数据
            const preloadedData = PreloadManager.getData('logs');
            if (preloadedData) {
                if (!preloadedData.dirExists) {
                    console.warn(I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在'));
                    this.logContent = I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在');
                    return false;
                }

                this.logFiles = preloadedData.logFiles;
            } else {
                // 如果没有预加载数据，则正常加载
                const logsDir = `${Core.MODULE_PATH}logs/`;
                const dirExists = await this.checkLogsDirectoryExists(logsDir);

                if (!dirExists) {
                    console.warn(I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在'));
                    this.logContent = I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在');
                    return false;
                }

                await this.scanLogFiles();
            }

            // 设置默认日志文件
            if (Object.keys(this.logFiles).length > 0) {
                this.currentLogFile = Object.keys(this.logFiles)[0];
                await this.loadLogContent();
            } else {
                this.logContent = I18n.translate('NO_LOGS_FILES', '没有找到日志文件');
            }

            return true;
        } catch (error) {
            console.error(I18n.translate('LOGS_INIT_ERROR', '初始化日志页面失败:'), error);
            return false;
        }
    },
    registerActions() {
        UI.registerPageActions('logs', [
            {
                id: 'refresh-logs',
                icon: 'refresh',
                title: I18n.translate('REFRESH_LOGS', '刷新日志'),
                onClick: 'loadLogContent'
            },
            {
                id: 'export-logs',
                icon: 'download',
                title: I18n.translate('EXPORT_LOGS', '导出日志'),
                onClick: 'exportLog',
            },
            {
                id: 'clear-logs',
                icon: 'delete',
                title: I18n.translate('CLEAR_LOGS', '清除日志'),
                onClick: 'clearLog',
            }
        ]);
    },
    // 检查日志目录是否存在
    async checkLogsDirectoryExists(logsDir) {
        try {
            const result = await Core.execCommand(`[ -d "${logsDir}" ] && echo "true" || echo "false"`);
            return result.trim() === "true";
        } catch (error) {
            console.error(I18n.translate('LOGS_DIR_CHECK_ERROR', '检查日志目录失败:'), error);
            return false;
        }
    },

    // 扫描日志文件
    async scanLogFiles() {
        try {
            const logsDir = `${Core.MODULE_PATH}logs/`;

            // 检查目录是否存在
            const dirExists = await this.checkLogsDirectoryExists(logsDir);
            if (!dirExists) {
                console.warn(I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在'));
                this.logFiles = {};
                return;
            }

            // 获取logs目录下的所有日志文件
            const result = await Core.execCommand(`find "${logsDir}" -type f -name "*.log" -o -name "*.log.old" 2>/dev/null | sort`);

            // 清空现有日志文件列表
            this.logFiles = {};

            if (!result || result.trim() === '') {
                console.warn(I18n.translate('NO_LOGS_FILES', '没有找到日志文件'));
                return;
            }

            // 解析日志文件列表
            const files = result.split('\n').filter(file => file.trim() !== '');

            files.forEach(file => {
                const fileName = file.split('/').pop();
                this.logFiles[fileName] = file;
            });

            console.log(I18n.translate('LOGS_FILES_FOUND', '找到 {count} 个日志文件', { count: Object.keys(this.logFiles).length }));
        } catch (error) {
            console.error(I18n.translate('LOGS_SCAN_ERROR', '扫描日志文件失败:'), error);
            this.logFiles = {};
        }
    },
    
    // 重写的日志加载逻辑，使用并行处理
    async loadLogContent(showToast = false) {
        try {
            if (!this.currentLogFile || !this.logFiles[this.currentLogFile]) {
                this.logContent = I18n.translate('NO_LOG_SELECTED', '未选择日志文件');
                return;
            }

            const logPath = this.logFiles[this.currentLogFile];

            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                this.logContent = I18n.translate('LOG_FILE_NOT_FOUND', '日志文件不存在');
                if (showToast) Core.showToast(this.logContent, 'warning');
                return;
            }

            // 显示加载指示器
            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.classList.add('loading');
            }

            // 使用并行处理加载日志内容
            // 首先获取文件大小
            const fileSizeCmd = await Core.execCommand(`wc -c "${logPath}" | awk '{print $1}'`);
            const fileSize = parseInt(fileSizeCmd.trim(), 10);
            
            // 如果文件太大，分块读取
            if (fileSize > 1024 * 1024) { // 大于1MB的文件
                // 获取最后100KB的内容，通常日志最新内容在末尾
                const content = await Core.execCommand(`tail -c 102400 "${logPath}"`);
                this.processLogContent(content, logsDisplay, showToast);
            } else {
                // 小文件直接读取
                const content = await Core.execCommand(`cat "${logPath}"`);
                this.processLogContent(content, logsDisplay, showToast);
            }
        } catch (error) {
            console.error(I18n.translate('LOGS_LOAD_ERROR', '加载日志内容失败:'), error);
            this.logContent = I18n.translate('LOGS_LOAD_ERROR', '加载失败');

            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.classList.remove('loading');
            }

            if (showToast) Core.showToast(this.logContent, 'error');
        }
    },

    // 处理日志内容
    processLogContent(content, logsDisplay, showToast) {
        this.logContent = content || I18n.translate('NO_LOGS', '没有可用的日志');

        // 使用微任务处理日志格式化，避免阻塞主线程
        Promise.resolve().then(() => {
            if (logsDisplay) {
                logsDisplay.innerHTML = this.formatLogContent();
                logsDisplay.classList.remove('loading');
                // 滚动到底部
                logsDisplay.scrollTop = logsDisplay.scrollHeight;
            }

            if (showToast) Core.showToast(I18n.translate('LOGS_REFRESHED', '日志已刷新'));
        });
    },

    // 清除日志
    async clearLog() {
        try {
            if (!this.currentLogFile || !this.logFiles[this.currentLogFile]) {
                Core.showToast(I18n.translate('NO_LOG_SELECTED', '未选择日志文件'), 'warning');
                return;
            }

            const logPath = this.logFiles[this.currentLogFile];

            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                Core.showToast(I18n.translate('LOG_FILE_NOT_FOUND', '日志文件不存在'), 'warning');
                return;
            }

            // 使用MD3对话框确认
            const dialog = document.createElement('dialog');
            dialog.className = 'md-dialog log-delete-dialog';

            // 确保对话框在body中居中
            document.body.style.overflow = 'hidden'; // 防止背景滚动

            dialog.innerHTML = `
                <h2>${I18n.translate('CLEAR_LOGS', '清除日志')}</h2>
                <p>${I18n.translate('CONFIRM_CLEAR_LOG', '确定要清除此日志文件吗？此操作不可撤销。')}</p>
                <div class="dialog-buttons">
                    <button class="dialog-button" data-action="cancel">${I18n.translate('CANCEL', '取消')}</button>
                    <button class="dialog-button filled" data-action="confirm">${I18n.translate('CONFIRM', '确认')}</button>
                </div>
            `;

            // 先添加到DOM
            document.body.appendChild(dialog);

            // 显示对话框
            requestAnimationFrame(() => {
                dialog.showModal();
            });

            // 处理对话框按钮点击
            return new Promise((resolve, reject) => {
                dialog.addEventListener('click', async (e) => {
                    const action = e.target.getAttribute('data-action');
                    if (action === 'cancel' || action === 'confirm') {
                        // 添加关闭动画
                        dialog.classList.add('closing');
                        // 等待动画完成后关闭
                        setTimeout(() => {
                            dialog.close();
                            document.body.removeChild(dialog);
                            document.body.style.overflow = ''; // 恢复背景滚动
                        }, 120);

                        if (action === 'confirm') {
                            try {
                                // 清空日志文件
                                await Core.execCommand(`cat /dev/null > "${logPath}" && chmod 666 "${logPath}"`);

                                // 重新加载日志内容
                                await this.loadLogContent();

                                Core.showToast(I18n.translate('LOG_CLEARED', '日志已清除'));
                                resolve(true);
                            } catch (error) {
                                console.error(I18n.translate('LOG_CLEAR_ERROR', '清除日志失败:'), error);
                                Core.showToast(I18n.translate('LOG_CLEAR_ERROR', '清除日志失败'), 'error');
                                reject(error);
                            }
                        }
                    }
                });
            });
        } catch (error) {
            console.error(I18n.translate('LOG_CLEAR_ERROR', '清除日志失败:'), error);
            Core.showToast(I18n.translate('LOG_CLEAR_ERROR', '清除日志失败'), 'error');
            return false;
        }
    },

    // 导出日志
    async exportLog() {
        try {
            if (!this.currentLogFile || !this.logFiles[this.currentLogFile]) {
                Core.showToast(I18n.translate('NO_LOG_SELECTED', '未选择日志文件'), 'warning');
                return;
            }

            const logPath = this.logFiles[this.currentLogFile];

            // 使用cp命令复制到下载文件夹
            const downloadDir = '/sdcard/Download/';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFileName = `${this.currentLogFile}_${timestamp}.log`;

            // 显示加载指示器
            Core.showToast(I18n.translate('LOADING', '导出中...'), 'info');

            // 确保下载目录存在并复制文件
            await Core.execCommand(`mkdir -p "${downloadDir}" && cp "${logPath}" "${downloadDir}${exportFileName}"`);

            Core.showToast(I18n.translate('LOG_EXPORTED', '日志已导出到: {path}', { path: `${downloadDir}${exportFileName}` }));
        } catch (error) {
            console.error(I18n.translate('LOG_EXPORT_ERROR', '导出日志失败:'), error);
            Core.showToast(I18n.translate('LOG_EXPORT_ERROR', '导出日志失败'), 'error');
        }
    },

    // HTML转义
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // 优化的虚拟滚动相关配置
    virtualScroll: {
        itemHeight: 32, // 减小每行高度，减少上方间隔
        bufferSize: 5,  // 缓冲区大小
        visibleItems: [],
        totalItems: [],
        scrollTop: 0,
        lastScrollTime: 0,
        scrollThrottle: 32, // 增加节流时间
        isProcessing: false,
        chunkSize: 100 // 分块处理的大小
    },

    // 处理滚动事件
    handleScroll(event) {
        if (this.virtualScroll.isProcessing) return;

        const now = Date.now();
        if (now - this.virtualScroll.lastScrollTime < this.virtualScroll.scrollThrottle) return;

        this.virtualScroll.scrollTop = event.target.scrollTop;
        this.virtualScroll.lastScrollTime = now;
        this.virtualScroll.isProcessing = true;

        // 使用requestAnimationFrame确保在下一帧渲染前更新
        requestAnimationFrame(() => {
            this.updateVisibleItems();
            this.virtualScroll.isProcessing = false;
        });
    },

    // 更新可见项
    updateVisibleItems() {
        const container = document.getElementById('logs-display-container');
        if (!container) return;

        const { itemHeight, bufferSize, totalItems, scrollTop, chunkSize } = this.virtualScroll;
        const containerHeight = container.clientHeight;
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
        const endIndex = Math.min(totalItems.length, startIndex + visibleCount + 2 * bufferSize);

        // 分块处理，避免一次性处理太多项导致卡顿
        this.renderChunkedItems(startIndex, endIndex);
    },

    // 分块渲染可见项
    renderChunkedItems(startIndex, endIndex) {
        const { totalItems, chunkSize, itemHeight } = this.virtualScroll;
        const totalHeight = totalItems.length * itemHeight;
        const visibleItems = totalItems.slice(startIndex, endIndex);
        
        // 创建文档片段，减少DOM操作
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.className = 'virtual-scroll-container';
        container.style.height = `${totalHeight}px`;
        fragment.appendChild(container);

        // 分块处理
        const processChunk = (items, chunkIndex) => {
            const chunk = items.slice(chunkIndex, chunkIndex + chunkSize);
            if (chunk.length === 0) return;

            chunk.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = `log-line ${item.logClass || ''}`;
                div.style.transform = `translateY(${(startIndex + chunkIndex + index) * itemHeight}px)`;
                div.innerHTML = item.content;
                container.appendChild(div);
            });

            // 如果还有剩余项，继续处理下一块
            if (chunkIndex + chunkSize < items.length) {
                setTimeout(() => processChunk(items, chunkIndex + chunkSize), 0);
            }
        };

        // 开始处理第一块
        processChunk(visibleItems, 0);

        // 更新DOM
        const logsDisplay = document.getElementById('logs-display');
        if (logsDisplay) {
            logsDisplay.innerHTML = '';
            logsDisplay.appendChild(fragment);
        }
    },

    // 格式化日志内容
    formatLogContent() {
        if (!this.logContent || this.logContent.trim() === '') {
            return `<div class="empty-state">${I18n.translate('NO_LOGS', '没有可用的日志')}</div>`;
        }

        // 分行并过滤空行
        const lines = this.logContent.split('\n').filter(line => line.trim());
        
        // 并行处理日志行
        this.virtualScroll.totalItems = this.processLogLines(lines);

        // 获取初始可见区域
        const containerHeight = document.getElementById('logs-display-container')?.clientHeight || 500;
        const visibleCount = Math.ceil(containerHeight / this.virtualScroll.itemHeight);
        const endIndex = Math.min(this.virtualScroll.totalItems.length, visibleCount + 2 * this.virtualScroll.bufferSize);
        
        // 渲染初始可见项
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.className = 'virtual-scroll-container';
        container.style.height = `${this.virtualScroll.totalItems.length * this.virtualScroll.itemHeight}px`;
        
        this.virtualScroll.totalItems.slice(0, endIndex).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `log-line ${item.logClass || ''}`;
            div.style.transform = `translateY(${index * this.virtualScroll.itemHeight}px)`;
            div.innerHTML = item.content;
            container.appendChild(div);
        });
        
        fragment.appendChild(container);
        return fragment.firstChild.outerHTML;
    },

    // 并行处理日志行
    processLogLines(lines) {
        // 使用分块处理，每次处理一部分行
        const { chunkSize } = this.virtualScroll;
        const totalItems = [];
        
        // 处理一批日志行
        for (let i = 0; i < lines.length; i += chunkSize) {
            const chunk = lines.slice(i, i + chunkSize);
            const processedChunk = chunk.map((line, index) => this.processLogLine(line, i + index));
            totalItems.push(...processedChunk);
        }
        
        return totalItems;
    },

    // 处理单行日志
    processLogLine(line, id) {
        if (!line.trim()) return { id, content: '', logClass: '' };

        let formatted = this.escapeHtml(line);
        let logClass = '';

        // 解析日志级别
        const levelMatch = formatted.match(/\[(ERROR|WARN|INFO|DEBUG)\]/);
        if (levelMatch) {
            logClass = levelMatch[1].toLowerCase();
            formatted = formatted.replace(levelMatch[0], '').trim();
        }

        // 解析时间戳
        const timeMatch = formatted.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
        if (timeMatch) {
            const timestamp = new Date(timeMatch[0]);
            const relativeTime = this.getRelativeTimeString(timestamp);
            formatted = formatted.replace(timeMatch[0], relativeTime).trim();
        }

        return {
            id,
            content: formatted,
            logClass
        };
    },

    // 获取相对时间字符串
    getRelativeTimeString(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        // 今天的日期
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // 昨天的日期
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

        if (diffMins < 1) return I18n.translate('LOG_TIME_JUST_NOW', '刚刚');
        if (diffMins < 60) return I18n.translate('LOG_TIME_MINUTES_AGO', '{minutes}分钟前', { minutes: diffMins });
        if (diffHours < 24 && date >= today) return I18n.translate('LOG_TIME_TODAY', '今天 {time}', { time: timeStr });
        if (date >= yesterday && date < today) return I18n.translate('LOG_TIME_YESTERDAY', '昨天 {time}', { time: timeStr });

        // 一年内的日期显示月日
        if (date.getFullYear() === now.getFullYear()) {
            return I18n.translate('LOG_TIME_THIS_YEAR', '{month}月{day}日 {time}', {
                month: date.getMonth() + 1,
                day: date.getDate(),
                time: timeStr
            });
        }

        // 超过一年显示完整日期
        return I18n.translate('LOG_TIME_FULL_DATE', '{year}/{month}/{day} {time}', {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            time: timeStr
        });
    },

    // 渲染页面
    render() {
        const hasLogFiles = Object.keys(this.logFiles).length > 0;

        return `
            <div class="logs-container">
                <div class="controls-row">
                    <label>
                        <span>${I18n.translate('SELECT_LOG_FILE', '选择日志文件')}</span>
                        <select id="log-file-select" ${!hasLogFiles ? 'disabled' : ''}>
                            ${this.renderLogFileOptions()}
                        </select>
                    </label>
                </div>
                
                <div id="logs-display-container" class="card-content">
                    <div class="logs-scroll-container">
                        <div id="logs-display" class="logs-content">${this.formatLogContent()}</div>
                    </div>
                </div>
            </div>
        `;
    },

    // 渲染日志文件选项
    renderLogFileOptions() {
        if (Object.keys(this.logFiles).length === 0) {
            return `<option value="" disabled>${I18n.translate('NO_LOGS_FILES', '没有可用的日志文件')}</option>`;
        }

        return Object.keys(this.logFiles).map(fileName =>
            `<option value="${fileName}" ${this.currentLogFile === fileName ? 'selected' : ''}>${fileName}</option>`
        ).join('');
    },

    // 渲染后的回调
    afterRender() {
        // 日志文件选择器事件
        document.getElementById('log-file-select')?.addEventListener('change', (e) => {
            this.currentLogFile = e.target.value;
            this.loadLogContent(true);
        });

        // 滚动容器事件
        const container = document.getElementById('logs-display-container');
        if (container) {
            container.addEventListener('scroll', this.handleScroll.bind(this));
        }

        // 语言变更处理
        this.onLanguageChanged();
    },

    // 语言变更处理
    onLanguageChanged() {
        // 更新页面操作按钮
        this.registerActions();

        // 更新选择器标签
        const selectLabel = document.querySelector('.logs-container label span');
        if (selectLabel) {
            selectLabel.textContent = I18n.translate('SELECT_LOG_FILE', '选择日志文件');
        }

        // 如果有空状态，更新文本
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            if (Object.keys(this.logFiles).length === 0) {
                emptyState.textContent = I18n.translate('NO_LOGS_FILES', '没有可用的日志文件');
            } else if (!this.logContent || this.logContent.trim() === '') {
                emptyState.textContent = I18n.translate('NO_LOGS', '没有可用的日志');
            }
        }
    },

    // 销毁页面
    destroy() {
        const container = document.getElementById('logs-display-container');
        if (container) {
            container.removeEventListener('scroll', this.handleScroll.bind(this));
            // 移除所有动态创建的事件监听
            container.querySelectorAll('*').forEach(element => {
                element.replaceWith(element.cloneNode(true));
            });
        }
    }
};
window.LogsPage = LogsPage;