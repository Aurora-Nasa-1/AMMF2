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
            I18n.registerLanguageChangeHandler(this.onLanguageChanged.bind(this));

            const preloadedData = PreloadManager.getData('logs');
            if (preloadedData) {
                if (!preloadedData.dirExists) {
                    console.warn(I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在'));
                    this.logContent = I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在');
                    return false;
                }
                this.logFiles = preloadedData.logFiles;
            } else {
                const logsDir = `${Core.MODULE_PATH}logs/`;
                const dirExists = await this.checkLogsDirectoryExists(logsDir);
                if (!dirExists) {
                    console.warn(I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在'));
                    this.logContent = I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在');
                    return false;
                }
                await this.scanLogFiles();
            }

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
            { id: 'refresh-logs', icon: 'refresh', title: I18n.translate('REFRESH_LOGS', '刷新日志'), onClick: 'loadLogContent' },
            { id: 'export-logs', icon: 'download', title: I18n.translate('EXPORT_LOGS', '导出日志'), onClick: 'exportLog' },
            { id: 'clear-logs', icon: 'delete', title: I18n.translate('CLEAR_LOGS', '清除日志'), onClick: 'clearLog' }
        ]);
    },

    async checkLogsDirectoryExists(logsDir) {
        try {
            const result = await Core.execCommand(`[ -d "${logsDir}" ] && echo "true" || echo "false"`);
            return result.trim() === "true";
        } catch (error) {
            console.error(I18n.translate('LOGS_DIR_CHECK_ERROR', '检查日志目录失败:'), error);
            return false;
        }
    },

    async scanLogFiles() {
        try {
            const logsDir = `${Core.MODULE_PATH}logs/`;
            const dirExists = await this.checkLogsDirectoryExists(logsDir);
            if (!dirExists) {
                console.warn(I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在'));
                this.logFiles = {};
                return;
            }

            const result = await Core.execCommand(`find "${logsDir}" -type f -name "*.log" -o -name "*.log.old" 2>/dev/null | sort`);
            this.logFiles = {};

            if (!result || result.trim() === '') {
                console.warn(I18n.translate('NO_LOGS_FILES', '没有找到日志文件'));
                return;
            }

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

    async loadLogContent(showToast = false) {
        try {
            if (!this.currentLogFile || !this.logFiles[this.currentLogFile]) {
                this.logContent = I18n.translate('NO_LOG_SELECTED', '未选择日志文件');
                return;
            }

            const logPath = this.logFiles[this.currentLogFile];
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                this.logContent = I18n.translate('LOG_FILE_NOT_FOUND', '日志文件不存在');
                if (showToast) Core.showToast(this.logContent, 'warning');
                return;
            }

            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) logsDisplay.classList.add('loading');

            const fileSizeCmd = await Core.execCommand(`wc -c "${logPath}" | awk '{print $1}'`);
            const fileSize = parseInt(fileSizeCmd.trim(), 10);
            const content = fileSize > 1024 * 1024
                ? await Core.execCommand(`tail -c 102400 "${logPath}"`)
                : await Core.execCommand(`cat "${logPath}"`);

            this.processLogContent(content, logsDisplay, showToast);
        } catch (error) {
            console.error(I18n.translate('LOGS_LOAD_ERROR', '加载日志内容失败:'), error);
            this.logContent = I18n.translate('LOGS_LOAD_ERROR', '加载失败');
            if (logsDisplay) logsDisplay.classList.remove('loading');
            if (showToast) Core.showToast(this.logContent, 'error');
        }
    },

    processLogContent(content, logsDisplay, showToast) {
        this.logContent = content || I18n.translate('NO_LOGS', '没有可用的日志');
        Promise.resolve().then(() => {
            if (logsDisplay) {
                logsDisplay.innerHTML = this.formatLogContent();
                logsDisplay.classList.remove('loading');
                logsDisplay.scrollTop = logsDisplay.scrollHeight;
            }
            if (showToast) Core.showToast(I18n.translate('LOGS_REFRESHED', '日志已刷新'));
        });
    },

    async clearLog() {
        try {
            if (!this.currentLogFile || !this.logFiles[this.currentLogFile]) {
                Core.showToast(I18n.translate('NO_LOG_SELECTED', '未选择日志文件'), 'warning');
                return;
            }

            const logPath = this.logFiles[this.currentLogFile];
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                Core.showToast(I18n.translate('LOG_FILE_NOT_FOUND', '日志文件不存在'), 'warning');
                return;
            }
            await Core.execCommand(`cat /dev/null > "${logPath}" && chmod 666 "${logPath}"`);
            await this.loadLogContent();
            Core.showToast(I18n.translate('LOG_CLEARED', '日志已清除'));
            return true;
        } catch (error) {
            console.error(I18n.translate('LOG_CLEAR_ERROR', '清除日志失败:'), error);
            Core.showToast(I18n.translate('LOG_CLEAR_ERROR', '清除日志失败'), 'error');
            return false;
        }
    },

    async exportLog() {
        try {
            if (!this.currentLogFile || !this.logFiles[this.currentLogFile]) {
                Core.showToast(I18n.translate('NO_LOG_SELECTED', '未选择日志文件'), 'warning');
                return;
            }

            const logPath = this.logFiles[this.currentLogFile];
            const downloadDir = '/sdcard/Download/';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFileName = `${this.currentLogFile}_${timestamp}.log`;

            Core.showToast(I18n.translate('LOADING', '导出中...'), 'info');
            await Core.execCommand(`mkdir -p "${downloadDir}" && cp "${logPath}" "${downloadDir}${exportFileName}"`);
            Core.showToast(I18n.translate('LOG_EXPORTED', '日志已导出到: {path}', { path: `${downloadDir}${exportFileName}` }));
        } catch (error) {
            console.error(I18n.translate('LOG_EXPORT_ERROR', '导出日志失败:'), error);
            Core.showToast(I18n.translate('LOG_EXPORT_ERROR', '导出日志失败'), 'error');
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    virtualScroll: {
        defaultHeight: 32, // Fallback height for initial rendering
        bufferSize: 10,
        totalItems: [], // Array of { id, content, logClass, height, offset }
        scrollTop: 0,
        lastScrollTime: 0,
        scrollThrottle: 50,
        isProcessing: false,
        heightCache: new Map() // Cache computed heights
    },

    handleScroll(event) {
        if (this.virtualScroll.isProcessing) return;

        const now = Date.now();
        if (now - this.virtualScroll.lastScrollTime < this.virtualScroll.scrollThrottle) return;

        this.virtualScroll.scrollTop = event.target.scrollTop;
        this.virtualScroll.lastScrollTime = now;
        this.virtualScroll.isProcessing = true;

        requestAnimationFrame(() => {
            this.updateVisibleItems();
            this.virtualScroll.isProcessing = false;
        });
    },

    updateVisibleItems() {
        const container = document.getElementById('logs-display-container');
        if (!container) return;

        const { bufferSize, totalItems, scrollTop } = this.virtualScroll;
        const containerHeight = container.clientHeight;

        // Find start index by binary search on offsets
        let startIndex = this.binarySearchOffset(scrollTop);
        let endOffset = scrollTop + containerHeight;
        let endIndex = startIndex;

        // Find end index
        while (endIndex < totalItems.length && totalItems[endIndex].offset < endOffset) {
            endIndex++;
        }

        // Apply buffer
        startIndex = Math.max(0, startIndex - bufferSize);
        endIndex = Math.min(totalItems.length, endIndex + bufferSize);

        const totalHeight = totalItems.length > 0 ? totalItems[totalItems.length - 1].offset + totalItems[totalItems.length - 1].height : 0;

        const fragment = document.createDocumentFragment();
        const wrapper = document.createElement('div');
        wrapper.style.height = `${totalHeight}px`;
        wrapper.style.position = 'relative';

        totalItems.slice(startIndex, endIndex).forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `log-line ${item.logClass || ''}`;
            div.innerHTML = item.content;
            div.style.position = 'absolute';
            div.style.top = `${item.offset}px`;
            div.style.width = '100%';
            div.style.willChange = 'transform';
            div.dataset.index = startIndex + idx; // For height updates
            wrapper.appendChild(div);
        });

        fragment.appendChild(wrapper);
        const logsDisplay = document.getElementById('logs-display');
        if (logsDisplay) {
            logsDisplay.innerHTML = '';
            logsDisplay.appendChild(fragment);
            // Update heights after rendering
            this.updateRenderedHeights(startIndex, endIndex);
        }
    },

    binarySearchOffset(scrollTop) {
        const { totalItems } = this.virtualScroll;
        let low = 0, high = totalItems.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const offset = totalItems[mid].offset;
            if (offset <= scrollTop && (mid === totalItems.length - 1 || totalItems[mid + 1].offset > scrollTop)) {
                return mid;
            } else if (offset > scrollTop) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return 0;
    },

    updateRenderedHeights(startIndex, endIndex) {
        const { totalItems, heightCache } = this.virtualScroll;
        const logsDisplay = document.getElementById('logs-display');
        if (!logsDisplay) return;

        const renderedItems = logsDisplay.querySelectorAll('.log-line');
        let offset = startIndex > 0 ? totalItems[startIndex - 1].offset + totalItems[startIndex - 1].height : 0;

        renderedItems.forEach((item, idx) => {
            const index = startIndex + idx;
            const rect = item.getBoundingClientRect();
            const height = rect.height;
            if (height > 0) {
                heightCache.set(totalItems[index].id, height);
                totalItems[index].height = height;
            }
            totalItems[index].offset = offset;
            item.style.top = `${offset}px`;
            offset += totalItems[index].height;
        });

        // Update offsets for remaining items
        for (let i = endIndex; i < totalItems.length; i++) {
            totalItems[i].offset = offset;
            offset += totalItems[i].height;
        }
    },

    formatLogContent() {
        if (!this.logContent || this.logContent.trim() === '') {
            return `<div class="empty-state">${I18n.translate('NO_LOGS', '没有可用的日志')}</div>`;
        }

        const lines = this.logContent.split('\n').filter(line => line.trim());
        this.virtualScroll.totalItems = lines.map((line, index) => this.processLogLine(line, index));

        // Initialize offsets
        let offset = 0;
        this.virtualScroll.totalItems.forEach(item => {
            item.offset = offset;
            offset += item.height;
        });

        const container = document.getElementById('logs-display-container');
        const containerHeight = container ? container.clientHeight : 500;
        let endIndex = 0;
        let endOffset = containerHeight;

        // Find initial visible items
        while (endIndex < this.virtualScroll.totalItems.length && this.virtualScroll.totalItems[endIndex].offset < endOffset) {
            endIndex++;
        }
        endIndex = Math.min(this.virtualScroll.totalItems.length, endIndex + 2 * this.virtualScroll.bufferSize);

        const totalHeight = this.virtualScroll.totalItems.length > 0
            ? this.virtualScroll.totalItems[this.virtualScroll.totalItems.length - 1].offset + this.virtualScroll.totalItems[this.virtualScroll.totalItems.length - 1].height
            : 0;

        const fragment = document.createDocumentFragment();
        const wrapper = document.createElement('div');
        wrapper.style.height = `${totalHeight}px`;
        wrapper.style.position = 'relative';

        this.virtualScroll.totalItems.slice(0, endIndex).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `log-line ${item.logClass || ''}`;
            div.innerHTML = item.content;
            div.style.position = 'absolute';
            div.style.top = `${item.offset}px`;
            div.style.width = '100%';
            div.style.willChange = 'transform';
            div.dataset.index = index;
            wrapper.appendChild(div);
        });

        fragment.appendChild(wrapper);
        return fragment.firstChild.outerHTML;
    },

    processLogLine(line, id) {
        if (!line.trim()) return { id, content: '', logClass: '', height: this.virtualScroll.defaultHeight, offset: 0 };

        let formatted = this.escapeHtml(line);
        let logClass = '';

        const levelMatch = formatted.match(/\[(ERROR|WARN|INFO|DEBUG)\]/);
        if (levelMatch) {
            logClass = levelMatch[1].toLowerCase();
            formatted = formatted.replace(levelMatch[0], '').trim();
        }

        const timeMatch = formatted.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
        if (timeMatch) {
            const timestamp = new Date(timeMatch[0]);
            const relativeTime = this.getRelativeTimeString(timestamp);
            formatted = formatted.replace(timeMatch[0], relativeTime).trim();
        }

        const cachedHeight = this.virtualScroll.heightCache.get(id);
        return {
            id,
            content: formatted,
            logClass,
            height: cachedHeight || this.virtualScroll.defaultHeight,
            offset: 0
        };
    },

    getRelativeTimeString(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

        if (diffMins < 1) return I18n.translate('LOG_TIME_JUST_NOW', '刚刚');
        if (diffMins < 60) return I18n.translate('LOG_TIME_MINUTES_AGO', '{minutes}分钟前', { minutes: diffMins });
        if (diffHours < 24 && date >= today) return I18n.translate('LOG_TIME_TODAY', '今天 {time}', { time: timeStr });
        if (date >= yesterday && date < today) return I18n.translate('LOG_TIME_YESTERDAY', '昨天 {time}', { time: timeStr });

        if (date.getFullYear() === now.getFullYear()) {
            return I18n.translate('LOG_TIME_THIS_YEAR', '{month}月{day}日 {time}', {
                month: date.getMonth() + 1,
                day: date.getDate(),
                time: timeStr
            });
        }

        return I18n.translate('LOG_TIME_FULL_DATE', '{year}/{month}/{day} {time}', {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            time: timeStr
        });
    },

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
                <div id="logs-display-container" class="card-content logs-scroll-container">
                    <div id="logs-display" class="logs-content">${this.formatLogContent()}</div>
                </div>
            </div>
        `;
    },

    renderLogFileOptions() {
        if (Object.keys(this.logFiles).length === 0) {
            return `<option value="" disabled>${I18n.translate('NO_LOGS_FILES', '没有可用的日志文件')}</option>`;
        }
        return Object.keys(this.logFiles).map(fileName =>
            `<option value="${fileName}" ${this.currentLogFile === fileName ? 'selected' : ''}>${fileName}</option>`
        ).join('');
    },

    afterRender() {
        document.getElementById('log-file-select')?.addEventListener('change', (e) => {
            this.currentLogFile = e.target.value;
            this.loadLogContent(true);
        });

        const container = document.getElementById('logs-display-container');
        if (container) {
            container.addEventListener('scroll', this.handleScroll.bind(this));
            // Initial height update
            this.updateRenderedHeights(0, this.virtualScroll.totalItems.length);
        }

        this.onLanguageChanged();
    },

    onLanguageChanged() {
        this.registerActions();
        const selectLabel = document.querySelector('.logs-container label span');
        if (selectLabel) selectLabel.textContent = I18n.translate('SELECT_LOG_FILE', '选择日志文件');

        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            if (Object.keys(this.logFiles).length === 0) {
                emptyState.textContent = I18n.translate('NO_LOGS_FILES', '没有可用的日志文件');
            } else if (!this.logContent || this.logContent.trim() === '') {
                emptyState.textContent = I18n.translate('NO_LOGS', '没有可用的日志');
            }
        }
    },

    destroy() {
        const container = document.getElementById('logs-display-container');
        if (container) {
            container.removeEventListener('scroll', this.handleScroll.bind(this));
            container.querySelectorAll('*').forEach(element => element.replaceWith(element.cloneNode(true)));
        }
        this.virtualScroll.heightCache.clear();
    }
};
window.LogsPage = LogsPage;