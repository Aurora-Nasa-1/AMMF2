/**
 * AMMF WebUI 日志页面模块
 * 提供高性能的日志查看和管理功能
 * 采用虚拟滚动和高效的DOM操作策略
 * 优化性能，减少内存占用和UI卡顿
 */

const LogsPage = {
    // 核心状态
    state: {
        logFiles: {},           // 日志文件列表
        currentFile: '',        // 当前选中的日志文件
        content: '',            // 当前日志内容
        filter: {               // 日志过滤器
            level: 'all',       // 日志级别过滤
            search: ''          // 搜索关键词
        },
        autoRefresh: false,     // 自动刷新状态
        loading: false,         // 加载状态
        error: null             // 错误信息
    },

    // 虚拟滚动配置
    virtualScroll: {
        itemHeight: 48,         // 每行高度(px)，增加高度以提高可读性（从36增加到48）
        containerHeight: 0,     // 容器高度
        bufferSize: 100,        // 缓冲区大小（从100增加到200，减少空白闪烁）
        startIndex: 0,          // 起始索引
        visibleCount: 0,        // 可见行数
        totalCount: 0,          // 总行数
        scrollTop: 0,           // 滚动位置
        lines: [],              // 处理后的日志行
        renderRequested: false, // 渲染请求标志（防止重复渲染）
        lastRenderTime: 0,      // 上次渲染时间（用于节流）
        expandedLines: new Set() // 跟踪展开的行
    },

    // 自动刷新配置
    refreshConfig: {
        timer: null,
        interval: 5000,         // 刷新间隔(ms)
        retryCount: 0,          // 重试计数
        maxRetries: 3           // 最大重试次数
    },

    // 事件监听器引用（用于清理）
    _eventListeners: {
        scroll: null,
        resize: null,
        languageChanged: null
    },

    // 防抖和节流计时器
    _timers: {
        searchDebounce: null,
        scrollThrottle: null,
        resizeThrottle: null
    },

    // 缓存状态
    _cache: {
        currentFile: '',
        filter: {
            level: 'all',
            search: ''
        },
        // 添加内容缓存，避免重复处理
        contentCache: new Map()
    },

    // 保存状态到localStorage
    saveState() {
        try {
            const state = {
                currentFile: this.state.currentFile,
                filter: {
                    level: this.state.filter.level,
                    search: this.state.filter.search
                },
                autoRefresh: this.state.autoRefresh
            };
            localStorage.setItem('logs_page_state', JSON.stringify(state));
        } catch (error) {
            console.warn('保存日志页面状态失败:', error);
        }
    },

    // 从localStorage恢复状态
    restoreState() {
        try {
            const savedState = localStorage.getItem('logs_page_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this._cache.currentFile = state.currentFile || '';
                this._cache.filter.level = state.filter?.level || 'all';
                this._cache.filter.search = state.filter?.search || '';
                this.state.autoRefresh = state.autoRefresh || false;
            }
        } catch (error) {
            console.warn('恢复日志页面状态失败:', error);
        }
    },

    // 初始化
    async init() {
        try {
            // 恢复保存的状态
            this.restoreState();
            
            // 初始化日志文件列表
            await this.scanLogFiles();

            // 如果有缓存的文件且文件存在，使用缓存的文件
            if (this._cache.currentFile && this.state.logFiles[this._cache.currentFile]) {
                this.state.currentFile = this._cache.currentFile;
                this.state.filter = { ...this._cache.filter };
            } else if (Object.keys(this.state.logFiles).length > 0) {
                // 否则使用第一个可用的文件
                this.state.currentFile = Object.keys(this.state.logFiles)[0];
            }

            // 如果不是预加载模式，加载日志内容
            if (!Router?.isPreloading) {
                await this.loadLogContent();
            }
            
            // 如果启用了自动刷新，启动定时器
            if (this.state.autoRefresh) {
                this.toggleAutoRefresh(true);
            }
            
            return true;
        } catch (error) {
            console.error('初始化日志页面失败:', error);
            this.state.error = error.message || '初始化失败';
            return false;
        }
    },

    // 扫描日志文件
    async scanLogFiles() {
        try {
            this.state.loading = true;
            this.updateLoadingState(true);
            
            // 获取日志目录
            const logDirResult = await Core.execCommand('echo $AMMF_LOG_DIR');
            const logDir = logDirResult?.trim() || '/data/adb/modules/AMMF/logs';
            
            // 检查日志目录是否存在
            const dirExistsResult = await Core.execCommand(`[ -d "${logDir}" ] && echo "exists" || echo "not exists"`);
            if (dirExistsResult?.trim() !== 'exists') {
                throw new Error(I18n.translate('LOGS_DIR_NOT_FOUND', '日志目录不存在'));
            }
            
            // 扫描日志文件
            const filesResult = await Core.execCommand(`find "${logDir}" -name "*.log" -type f | sort`);
            if (!filesResult) {
                this.state.logFiles = {};
                return;
            }
            
            // 解析日志文件列表
            const files = filesResult.split('\n').filter(f => f.trim());
            const logFiles = {};
            
            for (const file of files) {
                const fileName = file.split('/').pop();
                logFiles[fileName] = file;
            }
            
            this.state.logFiles = logFiles;
            
            const fileCount = Object.keys(logFiles).length;
            if (fileCount > 0) {
                Core.showToast(I18n.translate('LOGS_FILES_FOUND', '找到 {count} 个日志文件', { count: fileCount }));
            } else {
                Core.showToast(I18n.translate('NO_LOG_FILES', '没有找到日志文件'), 'warning');
            }
        } catch (error) {
            console.error('扫描日志文件失败:', error);
            Core.showToast(I18n.translate('LOGS_SCAN_ERROR', '扫描日志文件失败'), 'error');
            throw error;
        } finally {
            this.state.loading = false;
            this.updateLoadingState(false);
        }
    },

    // 加载日志内容
    async loadLogContent(forceRefresh = false) {
        if (!this.state.currentFile) {
            Core.showToast(I18n.translate('NO_LOG_SELECTED', '未选择日志文件'), 'warning');
            return;
        }
        
        try {
            this.state.loading = true;
            this.updateLoadingState(true);
            
            const logPath = this.state.logFiles[this.state.currentFile];
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "exists" || echo "not exists"`);
            if (fileExistsResult?.trim() !== 'exists') {
                throw new Error(I18n.translate('LOG_FILE_NOT_FOUND', '日志文件不存在'));
            }
            
            // 检查缓存
            const cacheKey = `${this.state.currentFile}_${Date.now()}`;
            if (!forceRefresh && this._cache.contentCache.has(this.state.currentFile)) {
                const cachedData = this._cache.contentCache.get(this.state.currentFile);
                // 检查缓存是否过期（5秒内的缓存有效）
                if (Date.now() - cachedData.timestamp < 5000) {
                    this.state.content = cachedData.content;
                    await this.processLogContent();
                    return;
                }
            }
            
            // 读取日志文件内容
            // 使用tail命令获取最新的日志（最多10000行，避免内存溢出）
            const content = await Core.execCommand(`tail -n 10000 "${logPath}"`);
            this.state.content = content || '';
            
            // 更新缓存
            this._cache.contentCache.set(this.state.currentFile, {
                content: this.state.content,
                timestamp: Date.now()
            });
            
            // 限制缓存大小
            if (this._cache.contentCache.size > 5) {
                // 删除最旧的缓存
                const oldestKey = Array.from(this._cache.contentCache.keys())[0];
                this._cache.contentCache.delete(oldestKey);
            }
            
            // 处理日志内容
            await this.processLogContent();
            
            // 重置重试计数
            this.refreshConfig.retryCount = 0;
            
            Core.showToast(I18n.translate('LOGS_REFRESHED', '日志已刷新'));
        } catch (error) {
            console.error('加载日志失败:', error);
            Core.showToast(I18n.translate('LOGS_LOAD_ERROR', '加载日志失败'), 'error');
            
            // 增加重试计数
            this.refreshConfig.retryCount++;
            
            // 如果自动刷新模式下连续失败超过最大重试次数，停止自动刷新
            if (this.state.autoRefresh && this.refreshConfig.retryCount > this.refreshConfig.maxRetries) {
                this.toggleAutoRefresh(false);
                Core.showToast(I18n.translate('AUTO_REFRESH_STOPPED', '自动刷新已停止'), 'warning');
            }
        } finally {
            this.state.loading = false;
            this.updateLoadingState(false);
        }
    },

    // 页面激活时调用
    async onActivate() {
        // 添加语言变更事件监听
        this._eventListeners.languageChanged = async () => {
            // 重新渲染UI
            await Router.refreshCurrentPage();
            // 重新加载日志内容以更新翻译
            await this.loadLogContent(true); // 强制刷新
            // 更新容器大小并渲染
            this.updateContainerSize();
            this.renderVirtualScroll();
        };
        document.addEventListener('languageChanged', this._eventListeners.languageChanged);
        
        // 如果是预加载后首次激活，加载日志内容
        if (!this.state.content) {
            await this.loadLogContent();
        }
        
        // 应用缓存的过滤器状态
        if (this._cache.filter) {
            this.state.filter = { ...this._cache.filter };
            await this.processLogContent();
        }
        
        // 更新容器大小并渲染
        this.updateContainerSize();
        this.renderVirtualScroll();
        
        // 如果启用了自动刷新，确保定时器运行
        if (this.state.autoRefresh && !this.refreshConfig.timer) {
            this.toggleAutoRefresh(true);
        }
    },

    // 页面停用时调用
    onDeactivate() {
        // 保存当前状态到缓存
        this._cache.currentFile = this.state.currentFile;
        this._cache.filter = { ...this.state.filter };
        
        // 保存状态到localStorage
        this.saveState();

        // 清理自动刷新
        if (this.refreshConfig.timer) {
            clearInterval(this.refreshConfig.timer);
            this.refreshConfig.timer = null;
        }

        // 移除事件监听器
        if (this._eventListeners.scroll) {
            const container = document.querySelector('.virtual-scroll-container');
            if (container) {
                container.removeEventListener('scroll', this._eventListeners.scroll);
            }
            this._eventListeners.scroll = null;
        }
        
        if (this._eventListeners.resize) {
            window.removeEventListener('resize', this._eventListeners.resize);
            this._eventListeners.resize = null;
        }
        
        if (this._eventListeners.languageChanged) {
            document.removeEventListener('languageChanged', this._eventListeners.languageChanged);
            this._eventListeners.languageChanged = null;
        }
        
        // 清理所有计时器
        Object.keys(this._timers).forEach(key => {
            if (this._timers[key]) {
                clearTimeout(this._timers[key]);
                this._timers[key] = null;
            }
        });
    },

    // 文件变更处理
    async handleFileChange(event) {
        this.state.currentFile = event.target.value;
        this._cache.currentFile = event.target.value; // 同步更新缓存
        await this.loadLogContent(true); // 强制刷新
        this.updateContainerSize();
        Core.showToast(I18n.translate('LOGS_FILE_CHANGED', '已切换日志文件'));
    },

    // 日志级别变更处理
    async handleLevelChange(event) {
        this.state.filter.level = event.target.value;
        this._cache.filter.level = event.target.value; // 同步更新缓存
        await this.processLogContent();
        this.updateContainerSize();
        this.virtualScroll.scrollTop = 0;
        this.renderVirtualScroll();
        Core.showToast(I18n.translate('LOGS_LEVEL_CHANGED', '已更改日志级别筛选'));
    },

    // 搜索处理（带防抖）
    handleSearch(event) {
        if (this._timers.searchDebounce) {
            clearTimeout(this._timers.searchDebounce);
        }
        
        this._timers.searchDebounce = setTimeout(async () => {
            const searchTerm = event.target.value.trim();
            this.state.filter.search = searchTerm;
            this._cache.filter.search = searchTerm; // 同步更新缓存
            
            await this.processLogContent();
            
            if (searchTerm) {
                Core.showToast(I18n.translate('LOGS_SEARCH_APPLIED', '已应用搜索筛选'));
            }
            
            this._timers.searchDebounce = null;
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
        
        if (this.refreshConfig.timer) {
            clearInterval(this.refreshConfig.timer);
            this.refreshConfig.timer = null;
        }
        
        if (enable) {
            this.refreshConfig.timer = setInterval(() => this.loadLogContent(), this.refreshConfig.interval);
            Core.showToast(I18n.translate('AUTO_REFRESH_STARTED', '自动刷新已启动'));
        } else {
            Core.showToast(I18n.translate('AUTO_REFRESH_STOPPED', '自动刷新已停止'));
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
                    await this.loadLogContent(true); // 强制刷新
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
        if (typeof text !== 'string') return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // 高亮搜索关键词
    highlightSearchTerm(text) {
        if (!this.state.filter.search || !text) return text;
        
        try {
            // 转义所有正则表达式特殊字符
            const searchTerm = this.state.filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        } catch (error) {
            console.error('搜索高亮错误:', error);
            return text; // 如果正则表达式有错误，返回原始文本
        }
    },

    // 高亮日志级别
    highlightLogLevel(text) {
        if (!text) return text;
        
        return text.replace(/\[(error|warn|info|debug)\]/gi, (match, level) => {
            let className = '';
            switch (level.toLowerCase()) {
                case 'error': className = 'log-error'; break;
                case 'warn': className = 'log-warn'; break;
                case 'info': className = 'log-info'; break;
                case 'debug': className = 'log-debug'; break;
            }
            return `<span class="${className}">${match}</span>`;
        });
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
            `<button id="auto-refresh-logs" class="icon-button ${this.state.autoRefresh ? 'active' : ''}" 
                    data-on-click="toggleAutoRefresh" data-click-args="${!this.state.autoRefresh}" 
                    title="${I18n.translate('AUTO_REFRESH', '自动刷新')}">
                <span class="material-symbols-rounded">autorenew</span>
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
                                <option value="all" ${this.state.filter.level === 'all' ? 'selected' : ''}>
                                    ${I18n.translate('LOG_LEVEL_ALL', '所有级别')}
                                </option>
                                <option value="error" ${this.state.filter.level === 'error' ? 'selected' : ''}>
                                    ${I18n.translate('LOG_LEVEL_ERROR', '错误')}
                                </option>
                                <option value="warn" ${this.state.filter.level === 'warn' ? 'selected' : ''}>
                                    ${I18n.translate('LOG_LEVEL_WARN', '警告')}
                                </option>
                                <option value="info" ${this.state.filter.level === 'info' ? 'selected' : ''}>
                                    ${I18n.translate('LOG_LEVEL_INFO', '信息')}
                                </option>
                                <option value="debug" ${this.state.filter.level === 'debug' ? 'selected' : ''}>
                                    ${I18n.translate('LOG_LEVEL_DEBUG', '调试')}
                                </option>
                            </select>
                        </label>
                        <div class="search-box md3-surface-variant">
                            <span class="material-symbols-rounded">search</span>
                            <input type="text" class="md3-input" 
                                   data-on-input="handleSearch"
                                   value="${this.state.filter.search}"
                                   placeholder="${I18n.translate('SEARCH_LOGS', '搜索日志...')}">
                        </div>
                    </div>
                </div>

                <div id="logs-display" class="logs-display md3-surface ${this.state.loading ? 'loading' : ''}">
                    ${this.state.error ? `
                        <div class="error-state">
                            <span class="material-symbols-rounded">error</span>
                            <span>${this.escapeHtml(this.state.error)}</span>
                        </div>
                    ` : this.state.content ? `
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
    },

    // 处理日志内容
    async processLogContent() {
        if (!this.state.content) {
            this.virtualScroll.lines = [];
            this.virtualScroll.totalCount = 0;
            return;
        }
    
        // 将日志内容按行分割
        const lines = this.state.content.split('\n');
    
        // 根据过滤条件处理日志行
        const filteredLines = [];
        const levelFilter = this.state.filter.level;
        const searchFilter = this.state.filter.search.toLowerCase();
        
        // 使用更高效的循环和条件判断
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue; // 跳过空行
            
            // 日志级别过滤
            let passLevelFilter = true;
            if (levelFilter !== 'all') {
                const levelMatch = line.match(/\[(error|warn|info|debug)\]/i);
                passLevelFilter = levelMatch && levelMatch[1].toLowerCase() === levelFilter;
            }
            
            if (!passLevelFilter) continue; // 不符合级别过滤条件，跳过此行
            
            // 搜索关键词过滤
            let passSearchFilter = true;
            if (searchFilter) {
                try {
                    passSearchFilter = line.toLowerCase().includes(searchFilter);
                } catch (error) {
                    console.error('搜索过滤错误:', error);
                    // 出错时不过滤，保留该行
                    passSearchFilter = true;
                }
            }
            
            if (!passSearchFilter) continue; // 不符合搜索条件，跳过此行
            
            // 检测是否为长文本
            const isLongText = line.length > 150;
            
            // 添加到过滤后的行列表
            filteredLines.push({
                id: i,
                content: line,
                height: this.virtualScroll.itemHeight,
                isLongText,
                expanded: this.virtualScroll.expandedLines.has(i)
            });
        }
        
        // 更新虚拟滚动状态
        this.virtualScroll.lines = filteredLines;
        this.virtualScroll.totalCount = filteredLines.length;
        
        // 重置滚动位置
        if (this.virtualScroll.scrollTop > 0) {
            // 如果之前有滚动位置，尝试保持相对位置
            const scrollRatio = this.virtualScroll.scrollTop / (this.virtualScroll.previousTotalCount * this.virtualScroll.itemHeight || 1);
            this.virtualScroll.scrollTop = Math.floor(scrollRatio * filteredLines.length * this.virtualScroll.itemHeight);
        } else {
            this.virtualScroll.scrollTop = 0;
        }
        
        // 保存当前总行数，用于下次计算滚动比例
        this.virtualScroll.previousTotalCount = filteredLines.length;
        
        this.virtualScroll.startIndex = 0;
        
        // 应用高亮和格式化
        this.applyHighlightAndFormatting();
        
        // 重新渲染
        this.renderVirtualScroll();
    },
    
    // 应用高亮和格式化
    applyHighlightAndFormatting() {
        // 处理每一行，应用HTML转义、高亮和格式化
        for (let i = 0; i < this.virtualScroll.lines.length; i++) {
            const line = this.virtualScroll.lines[i];
            let content = this.escapeHtml(line.content);
            
            // 提取时间戳和日志级别
            let timestamp = '';
            let levelIcon = '';
            let message = content;
            let logLevel = '';
            
            // 尝试匹配时间戳 [YYYY-MM-DD HH:MM:SS]
            const timestampMatch = content.match(/\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\]/);
            if (timestampMatch) {
                timestamp = timestampMatch[0];
                message = message.replace(timestamp, '');
            }
            
            // 尝试匹配日志级别 [ERROR], [WARN], [INFO], [DEBUG]
            const levelMatch = content.match(/\[(ERROR|WARN|INFO|DEBUG|error|warn|info|debug)\]/);
            if (levelMatch) {
                const level = levelMatch[1].toLowerCase();
                logLevel = level;
                
                // 设置对应的图标
                switch (level) {
                    case 'error':
                        levelIcon = '<span class="material-symbols-rounded log-level-icon">error</span>';
                        break;
                    case 'warn':
                        levelIcon = '<span class="material-symbols-rounded log-level-icon">warning</span>';
                        break;
                    case 'info':
                        levelIcon = '<span class="material-symbols-rounded log-level-icon">info</span>';
                        break;
                    case 'debug':
                        levelIcon = '<span class="material-symbols-rounded log-level-icon">code</span>';
                        break;
                }
                
                message = message.replace(levelMatch[0], '');
            }
            
            // 应用搜索关键词高亮
            message = this.highlightSearchTerm(message);
            
            // 格式化日志行
            const expandClass = line.isLongText ? (line.expanded ? 'expanded' : 'collapsed') : '';
            const expandableClass = line.isLongText ? 'expandable' : '';
            
            // 构建格式化后的内容
            const formattedContent = `
                <div class="log-line-content">
                    ${levelIcon}
                    ${timestamp ? `<span class="log-timestamp">${timestamp}</span>` : ''}
                    <div class="log-message">${message.trim()}</div>
                    ${line.isLongText ? `<button class="log-expand-button" data-line-id="${line.id}">${line.expanded ? I18n.translate('COLLAPSE', '收起') : I18n.translate('EXPAND', '展开')}</button>` : ''}
                </div>
            `;
            
            // 更新处理后的内容和样式类
            this.virtualScroll.lines[i].formattedContent = formattedContent;
            this.virtualScroll.lines[i].logLevel = logLevel;
            this.virtualScroll.lines[i].expandClass = expandClass;
            this.virtualScroll.lines[i].expandableClass = expandableClass;
        }
    },

    // 渲染虚拟滚动内容
    renderVirtualScroll() {
        const container = document.querySelector('.virtual-scroll-container');
        const content = document.querySelector('.virtual-scroll-content');
        if (!container || !content) return;
        
        // 如果已经请求了渲染，避免重复渲染
        if (this.virtualScroll.renderRequested) return;
        
        // 使用requestAnimationFrame优化渲染性能
        this.virtualScroll.renderRequested = true;
        
        requestAnimationFrame(() => {
            // 节流控制，避免短时间内多次渲染
            const now = Date.now();
            if (now - this.virtualScroll.lastRenderTime < 16) { // 约60fps
                this.virtualScroll.renderRequested = false;
                return;
            }
            
            // 更新最后渲染时间
            this.virtualScroll.lastRenderTime = now;
            
            // 计算可见区域
            this.virtualScroll.containerHeight = container.clientHeight;
            this.virtualScroll.visibleCount = Math.ceil(this.virtualScroll.containerHeight / this.virtualScroll.itemHeight);
            
            // 计算需要渲染的行范围
            const startIndex = Math.max(0, Math.floor(this.virtualScroll.scrollTop / this.virtualScroll.itemHeight) - this.virtualScroll.bufferSize);
            const endIndex = Math.min(
                this.virtualScroll.totalCount,
                startIndex + this.virtualScroll.visibleCount + 2 * this.virtualScroll.bufferSize
            );
            
            // 更新起始索引
            this.virtualScroll.startIndex = startIndex;
            
            // 生成可见行的HTML
            const visibleLines = this.virtualScroll.lines
                .slice(startIndex, endIndex)
                .map(line => `
                    <div class="log-line ${line.logLevel} ${line.expandableClass} ${line.expandClass}" 
                         data-line-id="${line.id}" 
                         style="height: ${line.expanded && line.isLongText ? 'auto' : line.height + 'px'}">
                        ${line.formattedContent}
                    </div>
                `)
                .join('');
            
            // 更新内容和位置
            content.innerHTML = visibleLines;
            content.style.transform = `translateY(${startIndex * this.virtualScroll.itemHeight}px)`;
            
            // 添加展开/收起按钮的事件监听
            const expandButtons = content.querySelectorAll('.log-expand-button');
            expandButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    const lineId = parseInt(button.getAttribute('data-line-id'));
                    this.toggleLogLineExpand(lineId);
                });
            });
            
            // 添加长文本行点击事件
            const expandableLines = content.querySelectorAll('.log-line.expandable');
            expandableLines.forEach(line => {
                line.addEventListener('click', () => {
                    const lineId = parseInt(line.getAttribute('data-line-id'));
                    this.toggleLogLineExpand(lineId);
                });
            });
            
            // 重置渲染请求标志
            this.virtualScroll.renderRequested = false;
        });
    },
    
    // 切换日志行展开/收起状态
    toggleLogLineExpand(lineId) {
        // 查找对应的行
        const lineIndex = this.virtualScroll.lines.findIndex(line => line.id === lineId);
        if (lineIndex === -1) return;
        
        const line = this.virtualScroll.lines[lineIndex];
        
        // 切换展开状态
        line.expanded = !line.expanded;
        
        // 更新展开行集合
        if (line.expanded) {
            this.virtualScroll.expandedLines.add(lineId);
        } else {
            this.virtualScroll.expandedLines.delete(lineId);
        }
        
        // 更新样式类
        line.expandClass = line.expanded ? 'expanded' : 'collapsed';
        
        // 重新渲染
        this.renderVirtualScroll();
    },

    // 更新容器大小
    updateContainerSize() {
        const container = document.querySelector('.virtual-scroll-container');
        if (!container) return;
        
        // 更新容器高度和可见行数
        this.virtualScroll.containerHeight = container.clientHeight;
        this.virtualScroll.visibleCount = Math.ceil(this.virtualScroll.containerHeight / this.virtualScroll.itemHeight);
        
        // 更新虚拟滚动容器的总高度
        container.style.height = `${this.virtualScroll.totalCount * this.virtualScroll.itemHeight}px`;
    },
    
    // 页面渲染后的处理
    afterRender() {
        // 添加虚拟滚动事件监听
        const container = document.querySelector('.virtual-scroll-container');
        if (container) {
            // 移除旧的事件监听器（如果存在）
            if (this._eventListeners.scroll) {
                container.removeEventListener('scroll', this._eventListeners.scroll);
            }
            
            // 添加新的事件监听器（带节流）
            this._eventListeners.scroll = (e) => {
                if (this._timers.scrollThrottle) return;
                
                this._timers.scrollThrottle = setTimeout(() => {
                    this.virtualScroll.scrollTop = e.target.scrollTop;
                    this.renderVirtualScroll();
                    this._timers.scrollThrottle = null;
                }, 10); // 10ms节流
            };
            
            container.addEventListener('scroll', this._eventListeners.scroll);
        }
        
        // 添加窗口大小变化监听（带节流）
        if (this._eventListeners.resize) {
            window.removeEventListener('resize', this._eventListeners.resize);
        }
        
        this._eventListeners.resize = () => {
            if (this._timers.resizeThrottle) return;
            
            this._timers.resizeThrottle = setTimeout(() => {
                this.updateContainerSize();
                this.renderVirtualScroll();
                this._timers.resizeThrottle = null;
            }, 100); // 100ms节流
        };
        
        window.addEventListener('resize', this._eventListeners.resize);
        
        // 初始渲染
        this.updateContainerSize();
        this.renderVirtualScroll();
    }
};

// 导出模块
window.LogsPage = LogsPage;