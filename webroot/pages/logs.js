/**
 * AMMF WebUI 日志页面模块
 * 提供高性能的日志查看和管理功能
 * 采用虚拟滚动和高效的DOM操作策略
 */

const LogsPage = {
    // 核心状态
    state: {
        logFiles: {},           // 日志文件列表
        currentFile: '',        // 当前选中的日志文件
        content: '',           // 当前日志内容
        filter: {              // 日志过滤器
            level: 'all',      // 日志级别过滤
            search: ''         // 搜索关键词
        },
        autoRefresh: false,    // 自动刷新状态
        loading: false         // 加载状态
    },

    // 虚拟滚动配置
    virtualScroll: {
        itemHeight: 28,        // 每行高度(px)
        containerHeight: 0,     // 容器高度
        bufferSize: 50,        // 缓冲区大小
        startIndex: 0,         // 起始索引
        visibleCount: 0,       // 可见行数
        totalCount: 0,         // 总行数
        scrollTop: 0,          // 滚动位置
        lines: []              // 处理后的日志行
    },

    // 自动刷新配置
    refreshConfig: {
        timer: null,
        interval: 5000,        // 刷新间隔(ms)
        retryCount: 0,         // 重试计数
        maxRetries: 3          // 最大重试次数
    },

    // 初始化
    async init() {
        try {
            // 初始化日志文件列表
            await this.scanLogFiles();

            // 设置默认日志文件
            if (Object.keys(this.state.logFiles).length > 0) {
                this.state.currentFile = Object.keys(this.state.logFiles)[0];
                await this.loadLogContent();
            }
            return true;
        } catch (error) {
            console.error('初始化日志页面失败:', error);
            return false;
        }
    },

    // 更新容器尺寸
    updateContainerSize() {
        const container = document.getElementById('logs-display');
        if (container) {
            this.virtualScroll.containerHeight = container.clientHeight;
            this.virtualScroll.visibleCount = Math.ceil(this.virtualScroll.containerHeight / this.virtualScroll.itemHeight) + 2;
            this.renderVirtualScroll();
        }
    },

    // 渲染后的回调函数
    afterRender() {
        // 滚动事件
        const container = document.getElementById('logs-display');
        if (container) {
            container.addEventListener('scroll', this.handleScroll.bind(this));
        }

        // 更新容器尺寸
        this.updateContainerSize();
        window.addEventListener('resize', () => this.updateContainerSize());

        // 初始化虚拟滚动
        if (this.state.content) {
            this.processLogContent();
        }

        // 绑定操作按钮事件
        const refreshBtn = document.getElementById('refresh-logs');
        if (refreshBtn && !refreshBtn.dataset.bound) {
            refreshBtn.addEventListener('click', () => this.loadLogContent());
            refreshBtn.dataset.bound = 'true';
        }

        const exportBtn = document.getElementById('export-logs');
        if (exportBtn && !exportBtn.dataset.bound) {
            exportBtn.addEventListener('click', () => this.exportLog());
            exportBtn.dataset.bound = 'true';
        }

        const clearBtn = document.getElementById('clear-logs');
        if (clearBtn && !clearBtn.dataset.bound) {
            clearBtn.addEventListener('click', () => this.clearLog());
            clearBtn.dataset.bound = 'true';
        }
    },

    // 扫描日志文件
    async scanLogFiles() {
        try {
            const logsDir = `${Core.MODULE_PATH}logs/`;
            const result = await Core.execCommand(`find "${logsDir}" -type f -name "*.log" -o -name "*.log.old" 2>/dev/null | sort`);

            this.state.logFiles = {};
            if (result && result.trim()) {
                result.split('\n')
                    .filter(file => file.trim())
                    .forEach(file => {
                        const fileName = file.split('/').pop();
                        this.state.logFiles[fileName] = file;
                    });
            } else {
                // 当没有找到日志文件时，添加一条测试错误日志
                const testLogPath = `${Core.MODULE_PATH}logs/test.log`;
                this.state.logFiles['test.log'] = testLogPath;
                this.state.content = '[ERROR] 未找到任何日志文件，这是一条测试错误日志。\n';
                await this.processLogContent();
            }
        } catch (error) {
            console.error('扫描日志文件失败:', error);
            Core.showToast(I18n.translate('LOGS_SCAN_ERROR', '扫描日志文件失败'), 'error');
            this.state.logFiles = {};
        }
    },

    // 加载日志内容
    async loadLogContent(showToast = false) {
        if (this.state.loading) return;
        if (!this.state.currentFile) {
            this.state.content = '[INFO] 请选择日志文件查看内容';
            await this.processLogContent();
            return;
        }

        try {
            this.state.loading = true;
            this.updateLoadingState(true);

            const logPath = this.state.logFiles[this.state.currentFile];
            const content = await Core.execCommand(`cat "${logPath}"`);

            if (!content || content.trim() === '') {
                this.state.content = '[INFO] 日志文件为空';
            } else {
                this.state.content = content;
            }
            await this.processLogContent();

            if (showToast) {
                Core.showToast(I18n.translate('LOGS_REFRESHED', '日志已刷新'));
            }
        } catch (error) {
            console.error('加载日志内容失败:', error);
            Core.showToast(I18n.translate('LOGS_LOAD_ERROR', '加载日志失败'), 'error');
            this.state.content = '[ERROR] 加载日志失败，请检查文件权限或重试';
            await this.processLogContent();
        } finally {
            this.state.loading = false;
            this.updateLoadingState(false);
        }
    },

    // 处理日志内容
    async processLogContent() {
        return new Promise(resolve => {
            requestIdleCallback(() => {
                // 分割并过滤日志行
                const lines = this.state.content.split('\n')
                    .map(line => this.parseLine(line))
                    .filter(line => this.filterLine(line));

                this.virtualScroll.lines = lines;
                this.virtualScroll.totalCount = lines.length;
                this.renderVirtualScroll();
                resolve();
            });
        });
    },

    // 解析日志行
    parseLine(line) {
        const logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
        let level = 'INFO';
        let content = line;

        // 提取日志级别
        for (const l of logLevels) {
            if (line.includes(`[${l}]`)) {
                level = l;
                content = line.replace(`[${l}]`, '').trim();
                break;
            }
        }

        // 提取时间戳
        const timeMatch = content.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
        const timestamp = timeMatch ? new Date(timeMatch[0]) : null;

        return {
            raw: line,
            level,
            timestamp,
            content: content.trim()
        };
    },

    // 过滤日志行
    filterLine(line) {
        if (!line.content) return false;

        // 级别过滤
        if (this.state.filter.level !== 'all' &&
            line.level.toLowerCase() !== this.state.filter.level) {
            return false;
        }

        // 关键词搜索
        if (this.state.filter.search &&
            !line.content.toLowerCase().includes(this.state.filter.search.toLowerCase())) {
            return false;
        }

        return true;
    },

    // 渲染虚拟滚动
    renderVirtualScroll() {
        const container = document.getElementById('logs-display');
        if (!container) return;

        const startIndex = Math.max(0, Math.floor(this.virtualScroll.scrollTop / this.virtualScroll.itemHeight) - this.virtualScroll.bufferSize);
        const endIndex = Math.min(
            this.virtualScroll.totalCount,
            startIndex + this.virtualScroll.visibleCount + this.virtualScroll.bufferSize
        );

        const visibleLines = this.virtualScroll.lines.slice(startIndex, endIndex);
        const html = this.generateLogHtml(visibleLines, startIndex);

        // 使用DocumentFragment优化DOM操作
        const fragment = document.createRange().createContextualFragment(html);
        const content = container.querySelector('.virtual-scroll-content');
        if (content) {
            content.innerHTML = '';
            content.appendChild(fragment);
            // Ensure the transform is updated correctly after content change
            content.style.transform = `translateY(${startIndex * this.virtualScroll.itemHeight}px)`; 
        } else {
            container.innerHTML = `
                <div class="virtual-scroll-container" style="height: ${this.virtualScroll.totalCount * this.virtualScroll.itemHeight}px;">
                    <div class="virtual-scroll-content" style="transform: translateY(${startIndex * this.virtualScroll.itemHeight}px);">
                        ${html}
                    </div>
                </div>
            `;
        }
    },

    // 生成日志HTML
    generateLogHtml(lines, startIndex) {
        return lines.map((line, index) => {
            const actualIndex = startIndex + index;
            const timestamp = line.timestamp ? this.formatTimestamp(line.timestamp) : '';

            return `
                <div class="log-line ${line.level.toLowerCase()}" data-index="${actualIndex}">
                    <div class="log-line-content">
                        ${this.getLevelIcon(line.level)}
                        ${timestamp ? `<span class="log-timestamp">${timestamp}</span>` : ''}
                        <span class="log-message">${this.escapeHtml(line.content)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 获取日志级别图标
    getLevelIcon(level) {
        const icons = {
            'ERROR': 'error',
            'WARN': 'warning',
            'INFO': 'info',
            'DEBUG': 'code'
        };
        return `<span class="log-level-icon material-symbols-rounded">${icons[level] || 'info'}</span>`;
    },

    // 格式化时间戳
    formatTimestamp(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (date.toDateString() === now.toDateString()) {
            return `今天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `昨天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        }

        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    // 处理滚动事件
    handleScroll(event) {
        this.virtualScroll.scrollTop = event.target.scrollTop;
        requestAnimationFrame(() => this.renderVirtualScroll());
    },

    async handleFileChange(event) {
        this.state.currentFile = event.target.value;
        await this.loadLogContent(true);
        this.updateContainerSize();
        Core.showToast(I18n.translate('LOGS_FILE_CHANGED', '已切换日志文件'));
    },

    async handleLevelChange(event) {
        this.state.filter.level = event.target.value;
        await this.processLogContent();
        this.updateContainerSize();
        this.virtualScroll.scrollTop = 0;
        this.renderVirtualScroll();
        Core.showToast(I18n.translate('LOGS_LEVEL_CHANGED', '已更改日志级别筛选'));
    },

    handleSearch(event) {
        clearTimeout(this._searchDebounce);
        this._searchDebounce = setTimeout(() => {
            this.state.filter.search = event.target.value.trim();
            this.processLogContent();
            if (this.state.filter.search) {
                Core.showToast(I18n.translate('LOGS_SEARCH_APPLIED', '已应用搜索筛选'));
            }
        }, 300);
    },

    // 更新加载状态
    updateLoadingState(loading) {
        const container = document.getElementById('logs-display');
        if (container) {
            container.classList.toggle('loading', loading);
        }
    },

    // 切换自动刷新
    toggleAutoRefresh(enable) {
        this.state.autoRefresh = enable;
        if (enable) {
            this.refreshConfig.timer = setInterval(() => this.loadLogContent(), this.refreshConfig.interval);
        } else if (this.refreshConfig.timer) {
            clearInterval(this.refreshConfig.timer);
            this.refreshConfig.timer = null;
        }
    },

    // 清除日志
    async clearLog() {
        if (!this.state.currentFile) return;

        const result = await Core.showDialog({
            title: I18n.translate('CLEAR_LOGS', '清除日志'),
            content: I18n.translate('CONFIRM_CLEAR_LOG', '确定要清除此日志文件吗？此操作不可撤销。'),
            buttons: [
                { text: I18n.translate('CANCEL', '取消'), value: false },
                { text: I18n.translate('CONFIRM', '确认'), value: true, primary: true }
            ]
        });

        if (result) {
            try {
                const logPath = this.state.logFiles[this.state.currentFile];
                const clearResult = await Core.execCommand(`cat /dev/null > "${logPath}" && chmod 666 "${logPath}"`);
                if (clearResult !== undefined) {
                    await this.loadLogContent();
                    Core.showToast(I18n.translate('LOG_CLEARED', '日志已清除'));
                } else {
                    throw new Error('命令执行失败');
                }
            } catch (error) {
                console.error('清除日志失败:', error);
                Core.showToast(I18n.translate('LOG_CLEAR_ERROR', '清除日志失败'), 'error');
            }
        }
    },

    // 导出日志
    async exportLog() {
        if (!this.state.currentFile) return;

        try {
            const logPath = this.state.logFiles[this.state.currentFile];
            const downloadDir = '/sdcard/Download/';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFileName = `${this.state.currentFile}_${timestamp}.log`;

            Core.showToast(I18n.translate('LOADING', '导出中...'));
            await Core.execCommand(`mkdir -p "${downloadDir}" && cp "${logPath}" "${downloadDir}${exportFileName}"`);
            Core.showToast(I18n.translate('LOG_EXPORTED', '日志已导出到: {path}', { path: `${downloadDir}${exportFileName}` }));
        } catch (error) {
            console.error('导出日志失败:', error);
            Core.showToast(I18n.translate('LOG_EXPORT_ERROR', '导出日志失败'), 'error');
        }
    },

    // HTML转义
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // 渲染页面
    render() {
        // 设置页面标题
        document.getElementById('page-title').textContent = I18n.translate('NAV_LOGS', '日志');

        // 添加操作按钮到页面操作区
        const buttons = [
            `<button id="refresh-logs" class="icon-button" data-on-click="loadLogContent" title="${I18n.translate('REFRESH_LOGS', '刷新日志')}">
                <span class="material-symbols-rounded">refresh</span>
            </button>`,
            `<button id="export-logs" class="icon-button" data-on-click="exportLog" title="${I18n.translate('EXPORT_LOGS', '导出日志')}">
                <span class="material-symbols-rounded">download</span>
            </button>`,
            `<button id="clear-logs" class="icon-button" data-on-click="clearLog" title="${I18n.translate('CLEAR_LOGS', '清除日志')}">
                <span class="material-symbols-rounded">delete</span>
            </button>`
        ];

        document.getElementById('page-actions').innerHTML = buttons.join('');

        // 日志文件选择器
        const fileSelector = `
            <div class="md3-select-container">
                <label>
                <span>${I18n.translate('LOG_FILE', '日志文件')}</span>
                    <select id="logfile-select" data-on-change="handleFileChange" ${Object.keys(this.state.logFiles).length === 0 ? 'disabled' : ''}>
                    ${Object.keys(this.state.logFiles).length > 0 ? 
                        Object.keys(this.state.logFiles).map(file => `
                            <option value="${file}" ${file === this.state.currentFile ? 'selected' : ''}>
                                ${file}
                            </option>
                        `).join('') : 
                        `<option value="">${I18n.translate('NO_LOG_FILES', '没有找到日志文件')}</option>`
                    }
                </select>
                </label>
            </div>
        `;

        return `
            <div class="logs-container">
                <div class="logs-header md3-surface">
                    <div class="logs-filters">
                        ${fileSelector}
                        <label>
                            <span>${I18n.translate('LOG_LEVEL', '日志级别')}</span>
                            <select id="logsettings-select" data-on-change="handleLevelChange">
                                <option value="all">${I18n.translate('LOG_LEVEL_ALL', '所有级别')}</option>
                                <option value="error">${I18n.translate('LOG_LEVEL_ERROR', '错误')}</option>
                                <option value="warn">${I18n.translate('LOG_LEVEL_WARN', '警告')}</option>
                                <option value="info">${I18n.translate('LOG_LEVEL_INFO', '信息')}</option>
                                <option value="debug">${I18n.translate('LOG_LEVEL_DEBUG', '调试')}</option>
                            </select>
                        </label>
                        <div class="search-box md3-surface-variant">
                            <span class="material-symbols-rounded">search</span>
                            <input type="text" class="md3-input" 
                                   data-on-input="handleSearch"
                                   placeholder="${I18n.translate('SEARCH_LOGS', '搜索日志...')}">
                        </div>
                    </div>
                </div>

                <div id="logs-display" class="logs-display md3-surface ${this.state.loading ? 'loading' : ''}">
                    ${this.state.content ? `
                        <div class="virtual-scroll-container" style="height: ${this.virtualScroll.totalCount * this.virtualScroll.itemHeight}px;">
                            <div class="virtual-scroll-content" style="transform: translateY(0px);"> 
                                <!-- Content rendered by renderVirtualScroll -->
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <span class="material-symbols-rounded">description</span>
                            <span>${I18n.translate('NO_LOGS', '没有可用的日志')}</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
};
window.LogsPage = LogsPage;