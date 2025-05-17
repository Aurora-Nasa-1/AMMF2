#include <iostream>
#include <fstream>
#include <string>
#include <string_view>  // C++17 string_view 提高性能
#include <vector>
#include <map>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <memory>
#include <csignal>
#include <format>       // C++20 format

// Linux 特定头文件
#include <sys/stat.h>   // stat, mkdir, chmod
#include <dirent.h>     // opendir, readdir, closedir
#include <unistd.h>     // access, remove, rename, rmdir, umask
#include <cerrno>       // errno

// 日志级别定义
enum LogLevel {
    LOG_ERROR = 1,
    LOG_WARN = 2,
    LOG_INFO = 3,
    LOG_DEBUG = 4
};

// 高性能、低功耗日志系统
class Logger {
private:
    // 使用 string_view 优化字符串处理
    using StringView = std::string_view;
    
    // 使用 steady_clock 获得更好的性能
    using Clock = std::chrono::steady_clock;
    using TimePoint = Clock::time_point;
    
    // 原子变量减少锁竞争
    std::atomic_bool running{true};
    std::atomic_bool low_power_mode{false};
    std::atomic<unsigned int> max_idle_time{30000}; // ms
    std::atomic<size_t> buffer_max_size{8192};      // bytes
    std::atomic<size_t> log_size_limit{102400};     // bytes
    std::atomic<int> log_level{LOG_INFO};           // default level

    // 日志目录
    std::string log_dir;

    // 互斥锁和条件变量
    std::mutex log_mutex;
    std::condition_variable cv;

    // 文件缓存
    struct LogFile {
        std::ofstream stream;
        TimePoint last_access;
        size_t current_size{0};
    };
    std::map<std::string, std::unique_ptr<LogFile>> log_files;

    // 优化的缓冲区 - 使用预分配内存
    struct LogBuffer {
        std::string content;
        size_t size{0};
        TimePoint last_write;

        LogBuffer() {
            // 预分配内存减少重新分配
            content.reserve(16384); // 初始预分配 16KB
        }
    };
    std::map<std::string, std::unique_ptr<LogBuffer>> log_buffers;

    // 线程控制
    std::unique_ptr<std::thread> flush_thread;

    // 时间格式化缓存 - 减少格式化开销
    char time_buffer[32];
    std::chrono::system_clock::time_point last_time_format;
    std::mutex time_mutex;

public:
    // 使用 string_view 优化构造函数
    Logger(StringView dir, int level = LOG_INFO, size_t size_limit = 102400)
        : log_dir(dir)
        , log_level(level)
        , log_size_limit(size_limit) {

        // 创建日志目录
        create_log_directory();

        // 初始化时间缓存
        {
            std::lock_guard<std::mutex> lock(time_mutex);
            last_time_format = std::chrono::system_clock::now();
            update_time_cache();
        }

        // 启动刷新线程
        flush_thread = std::make_unique<std::thread>(&Logger::flush_thread_func, this);
    }

    ~Logger() {
        stop();

        if (flush_thread && flush_thread->joinable()) {
            flush_thread->join();
        }
    }

    // 停止日志系统
    void stop() {
        bool expected = true;
        if (running.compare_exchange_strong(expected, false, std::memory_order_relaxed)) {
            cv.notify_all();

            {
                std::lock_guard<std::mutex> lock(log_mutex);
                for (auto& buffer_pair : log_buffers) {
                    if (buffer_pair.second && buffer_pair.second->size > 0) {
                        flush_buffer_internal(buffer_pair.first);
                    }
                }
                log_files.clear();
            }
        }
    }

    // 设置最大空闲时间（毫秒）
    void set_max_idle_time(unsigned int ms) {
        max_idle_time.store(ms, std::memory_order_relaxed);
    }

    // 设置缓冲区大小
    void set_buffer_size(size_t size) {
        buffer_max_size.store(size, std::memory_order_relaxed);
    }

    // 设置日志级别
    void set_log_level(int level) {
        log_level.store(level, std::memory_order_relaxed);
    }

    // 设置日志文件大小限制
    void set_log_size_limit(size_t limit) {
        log_size_limit.store(limit, std::memory_order_relaxed);
    }

    // 设置低功耗模式
    void set_low_power_mode(bool enabled) {
        low_power_mode.store(enabled, std::memory_order_relaxed);

        if (enabled) {
            max_idle_time.store(60000, std::memory_order_relaxed);
            buffer_max_size.store(32768, std::memory_order_relaxed);
        } else {
            max_idle_time.store(30000, std::memory_order_relaxed);
            buffer_max_size.store(8192, std::memory_order_relaxed);
        }
        cv.notify_one();
    }

    // 写入日志 - 优化版本
    void write_log(StringView log_name, LogLevel level, StringView message) {
        if (static_cast<int>(level) > log_level.load(std::memory_order_relaxed)) {
            return;
        }
        if (!running.load(std::memory_order_relaxed)) {
            return;
        }

        // 获取级别字符串
        const char* level_str = get_level_string(level);

        // 获取格式化时间
        const char* time_str = get_formatted_time();

        // 优化日志条目构造
        std::string log_entry;
        log_entry.reserve(strlen(time_str) + strlen(level_str) + message.size() + 10);

        log_entry += time_str;
        log_entry += " [";
        log_entry += level_str;
        log_entry += "] ";
        log_entry += message;
        log_entry += "\n";

        // 添加到缓冲区
        add_to_buffer(std::string(log_name), std::move(log_entry), level);
    }

    // 批量写入日志 - 高效版本
    void batch_write(StringView log_name, const std::vector<std::pair<LogLevel, std::string>>& entries) {
        if (entries.empty() || !running.load(std::memory_order_relaxed)) return;

        // 过滤有效条目并计算总大小
        std::vector<std::pair<LogLevel, const std::string*>> valid_entries;
        valid_entries.reserve(entries.size());

        size_t total_size = 0;
        bool has_error = false;
        int current_log_level = log_level.load(std::memory_order_relaxed);

        for (const auto& entry : entries) {
            if (static_cast<int>(entry.first) <= current_log_level) {
                valid_entries.emplace_back(entry.first, &entry.second);
                total_size += entry.second.size() + 50;
                if (entry.first == LOG_ERROR) has_error = true;
            }
        }

        if (valid_entries.empty()) return;

        // 获取格式化时间
        const char* time_str = get_formatted_time();

        // 构建批量日志内容
        std::string batch_content;
        batch_content.reserve(total_size);

        for (const auto& entry : valid_entries) {
            const char* level_str = get_level_string(entry.first);
            batch_content += time_str;
            batch_content += " [";
            batch_content += level_str;
            batch_content += "] ";
            batch_content += *entry.second;
            batch_content += "\n";
        }

        // 添加到缓冲区
        add_to_buffer(std::string(log_name), std::move(batch_content), has_error ? LOG_ERROR : LOG_INFO);
    }

    // 刷新指定日志缓冲区
    void flush_buffer(const std::string& log_name) {
        std::lock_guard<std::mutex> lock(log_mutex);
        flush_buffer_internal(log_name);
    }

    // 刷新所有日志缓冲区
    void flush_all() {
        std::lock_guard<std::mutex> lock(log_mutex);
        for (auto it = log_buffers.begin(); it != log_buffers.end(); ++it) {
            if (it->second && it->second->size > 0) {
                flush_buffer_internal(it->first);
            }
        }
        for (auto& file_pair : log_files) {
            if (file_pair.second && file_pair.second->stream.is_open()) {
                file_pair.second->stream.flush();
            }
        }
    }

    // 清理所有日志
    void clean_logs() {
        std::lock_guard<std::mutex> lock(log_mutex);

        // 关闭并清理所有文件和缓冲区
        log_files.clear();
        log_buffers.clear();

        // 删除日志文件
        DIR *dir = opendir(log_dir.c_str());
        if (!dir) {
            std::cerr << "Cannot open log directory for cleaning: " << log_dir << " (" << strerror(errno) << ")" << std::endl;
            std::string cmd = "rm -f \"" + log_dir + "\"/*.log \"" + log_dir + "\"/*.log.old";
            system(cmd.c_str());
            return;
        }

        struct dirent *entry;
        while ((entry = readdir(dir)) != nullptr) {
            std::string filename = entry->d_name;
            if (filename == "." || filename == "..") {
                continue;
            }

            // 检查是否为 .log 或 .log.old 文件
            bool is_log_file = false;
            size_t len = filename.length();
            if (len > 4 && filename.substr(len - 4) == ".log") {
                is_log_file = true;
            } else if (len > 7 && filename.substr(len - 7) == ".log.old") {
                is_log_file = true;
            }

            if (is_log_file) {
                std::string full_path = log_dir + "/" + filename;
                if (remove(full_path.c_str()) != 0) {
                    std::cerr << "Cannot delete log file: " << full_path << " (" << strerror(errno) << ")" << std::endl;
                }
            }
        }
        closedir(dir);
    }

    // 主循环检查的辅助函数
    [[nodiscard]] bool is_running() const noexcept {
        return running.load(std::memory_order_relaxed);
    }

private:
    // 创建日志目录
    void create_log_directory() {
        struct stat st;
        // 检查目录是否存在
        if (stat(log_dir.c_str(), &st) == 0) {
            if (S_ISDIR(st.st_mode)) {
                // 目录存在，检查权限
                if (access(log_dir.c_str(), W_OK | X_OK) != 0) {
                    std::cerr << "Warning: Insufficient permissions for log directory: " << log_dir << " (" << strerror(errno) << ")" << std::endl;
                    chmod(log_dir.c_str(), 0755);
                }
                return;
            } else {
                std::cerr << "Error: Log path exists but is not a directory: " << log_dir << std::endl;
                log_dir = "./logs";
                std::cerr << "Trying alternative log directory: " << log_dir << std::endl;
                if (stat(log_dir.c_str(), &st) != 0) {
                    // 替代目录也不存在
                } else if (!S_ISDIR(st.st_mode)) {
                    std::cerr << "Error: Alternative log path also exists but is not a directory: " << log_dir << std::endl;
                    throw std::runtime_error("Cannot initialize log directory");
                } else {
                    // 替代目录存在且是目录
                    return;
                }
            }
        }

        // 尝试创建目录
        std::string cmd = "mkdir -p \"" + log_dir + "\"";
        int ret = system(cmd.c_str());
        if (ret != 0) {
            std::cerr << "Cannot create log directory (using system): " << log_dir << std::endl;
            if (stat(log_dir.c_str(), &st) != 0 || !S_ISDIR(st.st_mode)) {
                std::cerr << "Error: Failed to create log directory, please check permissions or path." << std::endl;
                throw std::runtime_error("Cannot create log directory");
            }
        }
        
        if (chmod(log_dir.c_str(), 0755) != 0) {
            std::cerr << "Warning: Cannot set log directory permissions: " << log_dir << " (" << strerror(errno) << ")" << std::endl;
        }
    }

    // 获取日志级别字符串
    [[nodiscard]] constexpr const char* get_level_string(LogLevel level) const noexcept {
        switch (level) {
            case LOG_ERROR: return "ERROR";
            case LOG_WARN:  return "WARN";
            case LOG_INFO:  return "INFO";
            case LOG_DEBUG: return "DEBUG";
            default:        return "UNKNOWN";
        }
    }

    // 获取格式化时间字符串
    [[nodiscard]] const char* get_formatted_time() {
        std::lock_guard<std::mutex> lock(time_mutex);

        auto now = std::chrono::system_clock::now();
        if (now - last_time_format < std::chrono::seconds(1)) {
            return time_buffer;
        }

        last_time_format = now;
        update_time_cache();
        return time_buffer;
    }

    // 更新时间缓存
    void update_time_cache() {
        auto now_time = std::chrono::system_clock::to_time_t(last_time_format);
        std::tm now_tm;
        localtime_r(&now_time, &now_tm);
        std::strftime(time_buffer, sizeof(time_buffer), "%Y-%m-%d %H:%M:%S", &now_tm);
    }

    // 添加内容到缓冲区
    void add_to_buffer(const std::string& log_name, std::string&& content, LogLevel level) {
        std::lock_guard<std::mutex> lock(log_mutex);

        // 确保缓冲区存在
        auto buffer_it = log_buffers.find(log_name);
        if (buffer_it == log_buffers.end()) {
            buffer_it = log_buffers.emplace(log_name, std::make_unique<LogBuffer>()).first;
        }

        auto& buffer = buffer_it->second;
        buffer->content.append(std::move(content));
        buffer->size = buffer->content.size();
        buffer->last_write = Clock::now();

        // 考虑立即刷新
        bool is_low_power = low_power_mode.load(std::memory_order_relaxed);
        size_t current_max_size = buffer_max_size.load(std::memory_order_relaxed);

        if ((level == LOG_ERROR) || (!is_low_power && buffer->size >= current_max_size)) {
            flush_buffer_internal(log_name);
        }

        cv.notify_one();
    }

    // 内部缓冲区刷新方法
    void flush_buffer_internal(const std::string& log_name) {
        auto buffer_it = log_buffers.find(log_name);
        if (buffer_it == log_buffers.end() || !buffer_it->second || buffer_it->second->size == 0) {
            return;
        }

        auto& buffer = buffer_it->second;

        // 构建日志文件路径
        std::string log_path = log_dir + "/" + log_name + ".log";

        // 获取或创建日志文件对象
        auto file_it = log_files.find(log_name);
        if (file_it == log_files.end()) {
            file_it = log_files.emplace(log_name, std::make_unique<LogFile>()).first;
        }
        auto& log_file = file_it->second;

        // 检查文件大小并处理轮换
        size_t current_log_size_limit = log_size_limit.load(std::memory_order_relaxed);
        if (log_file->stream.is_open() && log_file->current_size > current_log_size_limit) {
            log_file->stream.close();

            // 轮换日志文件
            std::string old_log_path = log_path + ".old";

            // 检查旧文件是否存在，如果存在则删除
            if (access(old_log_path.c_str(), F_OK) == 0) {
                if (remove(old_log_path.c_str()) != 0) {
                    std::cerr << "Cannot delete old file during log rotation: " << old_log_path << " (" << strerror(errno) << ")" << std::endl;
                }
            }

            // 重命名当前日志文件为旧文件
            if (access(log_path.c_str(), F_OK) == 0) {
                if (rename(log_path.c_str(), old_log_path.c_str()) != 0) {
                    std::cerr << "Cannot rename file during log rotation: " << log_path << " -> " << old_log_path << " (" << strerror(errno) << ")" << std::endl;
                    std::string cmd = "mv -f \"" + log_path + "\" \"" + old_log_path + "\"";
                    system(cmd.c_str());
                }
            }

            log_file->current_size = 0;
        }

        // 确保文件已打开
        if (!log_file->stream.is_open()) {
            log_file->stream.open(log_path, std::ios::app | std::ios::binary);
            if (!log_file->stream.is_open()) {
                std::cerr << "Cannot open log file for writing: " << log_path << " (" << strerror(errno) << ")" << std::endl;
                buffer->content.clear();
                buffer->size = 0;
                return;
            }

            // 获取当前文件大小
            log_file->stream.seekp(0, std::ios::end);
            std::streampos pos = log_file->stream.tellp();
            if (pos == static_cast<std::streampos>(-1)) {
                log_file->current_size = 0;
                std::cerr << "Warning: Cannot get log file size: " << log_path << std::endl;
            } else {
                log_file->current_size = static_cast<size_t>(pos);
            }
        }

        // 写入缓冲区内容
        log_file->stream.write(buffer->content.c_str(), buffer->content.size());
        if (log_file->stream.fail()) {
            std::cerr << "Failed to write to log file: " << log_path << std::endl;
            log_file->stream.close();
            log_file->current_size = 0;
            buffer->content.clear();
            buffer->size = 0;
        } else {
            log_file->stream.flush();
            log_file->current_size += buffer->size;
            log_file->last_access = Clock::now();

            buffer->content.clear();
            buffer->size = 0;
        }
    }

    // 优化的刷新线程函数
    void flush_thread_func() {
        while (running.load(std::memory_order_relaxed)) {
            std::unique_lock<std::mutex> lock(log_mutex);

            bool is_low_power = low_power_mode.load(std::memory_order_relaxed);
            auto wait_time = is_low_power ? std::chrono::seconds(60) : std::chrono::seconds(15);

            cv.wait_for(lock, wait_time, [this] {
                return !running.load(std::memory_order_relaxed);
            });

            if (!running.load(std::memory_order_relaxed)) {
                break;
            }

            unsigned int current_idle_ms = max_idle_time.load(std::memory_order_relaxed);
            size_t current_max_buffer_size = buffer_max_size.load(std::memory_order_relaxed);
            auto now = Clock::now();

            // 检查每个缓冲区，如果满足条件则刷新
            for (auto it = log_buffers.begin(); it != log_buffers.end(); /* no increment here */) {
                auto current_it = it++;
                if (!current_it->second) continue;

                auto& buffer = current_it->second;
                if (buffer->size == 0) continue;

                auto idle_duration = std::chrono::duration_cast<std::chrono::milliseconds>(
                    now - buffer->last_write);

                if (idle_duration.count() > current_idle_ms || buffer->size > current_max_buffer_size / 2) {
                    flush_buffer_internal(current_it->first);
                }
            }

            // 关闭长时间未使用的文件句柄
            unsigned int file_idle_ms = current_idle_ms * 3;
            for (auto it = log_files.begin(); it != log_files.end(); /* no increment here */) {
                auto current_it = it++;
                if (!current_it->second) {
                    continue;
                }

                if (!current_it->second->stream.is_open()) {
                    continue;
                }

                auto file_idle_duration = std::chrono::duration_cast<std::chrono::milliseconds>(
                    now - current_it->second->last_access);

                if (file_idle_duration.count() > file_idle_ms) {
                    current_it->second->stream.close();
                }
            }
        }
    }
};

// 全局日志实例
static std::unique_ptr<Logger> g_logger;

// 信号处理函数
void signal_handler(int sig) {
    if (g_logger) {
        if (sig == SIGTERM || sig == SIGINT) {
            g_logger->flush_all();
            g_logger->stop();
        }
    }

    if (sig == SIGTERM || sig == SIGINT) {
        _exit(0);
    }
}

// 主函数
int main(int argc, char* argv[]) {
    std::string log_dir = "/data/adb/modules/AMMF2/logs";
    int log_level_int = LOG_INFO;
    std::string command;
    std::string log_name = "main";
    std::string message;
    std::string batch_file;
    bool low_power = false;

    // 解析命令行参数
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "-d" && i + 1 < argc) {
            log_dir = argv[++i];
        } else if (arg == "-l" && i + 1 < argc) {
            try {
                log_level_int = std::stoi(argv[++i]);
                if (log_level_int < LOG_ERROR || log_level_int > LOG_DEBUG) {
                    std::cerr << "Warning: Log level must be between " << LOG_ERROR << "-" << LOG_DEBUG
                              << ", using default " << LOG_INFO << std::endl;
                    log_level_int = LOG_INFO;
                }
            } catch (const std::invalid_argument& e) {
                std::cerr << "Error: Invalid log level argument: " << argv[i] << std::endl;
                return 1;
            } catch (const std::out_of_range& e) {
                std::cerr << "Error: Log level argument out of range: " << argv[i] << std::endl;
                return 1;
            }
        } else if (arg == "-c" && i + 1 < argc) {
            command = argv[++i];
        } else if (arg == "-n" && i + 1 < argc) {
            log_name = argv[++i];
        } else if (arg == "-m" && i + 1 < argc) {
            message = argv[++i];
        } else if (arg == "-b" && i + 1 < argc) {
            batch_file = argv[++i];
        } else if (arg == "-p") {
            low_power = true;
        } else if (arg == "-h" || arg == "--help") {
            std::cout << "Usage: " << argv[0] << " [options]" << std::endl;
            std::cout << "Options:" << std::endl;
            std::cout << "  -d DIR    Specify log directory (default: /data/adb/modules/AMMF2/logs)" << std::endl;
            std::cout << "  -l LEVEL  Set log level (1=Error, 2=Warn, 3=Info, 4=Debug, default: 3)" << std::endl;
            std::cout << "  -c CMD    Execute command (daemon, write, batch, flush, clean)" << std::endl;
            std::cout << "  -n NAME   Specify log name (for write/batch commands, default: system)" << std::endl;
            std::cout << "  -m MSG    Log message content (for write command)" << std::endl;
            std::cout << "  -b FILE   Batch input file, format: level|message (one per line, for batch command)" << std::endl;
            std::cout << "  -p        Enable low power mode (reduce write frequency)" << std::endl;
            std::cout << "  -h        Show help information" << std::endl;
            std::cout << "Example:" << std::endl;
            std::cout << "  Start daemon: " << argv[0] << " -c daemon -d /path/to/logs -l 4 -p" << std::endl;
            std::cout << "  Write log: " << argv[0] << " -c write -n main -m \"Test message\" -l 3" << std::endl;
            std::cout << "  Batch write: " << argv[0] << " -c batch -n errors -b batch_logs.txt" << std::endl;
            std::cout << "  Flush logs: " << argv[0] << " -c flush -d /path/to/logs" << std::endl;
            std::cout << "  Clean logs: " << argv[0] << " -c clean -d /path/to/logs" << std::endl;
            return 0;
        } else {
            std::cerr << "Error: Unknown or invalid argument: " << arg << std::endl;
            return 1;
        }
    }

    // 如果没有指定命令，默认启动守护进程
    if (command.empty()) {
        command = "daemon";
    }

    // 创建日志记录器
    try {
        if (!g_logger) {
            g_logger = std::make_unique<Logger>(log_dir, log_level_int);
            if (low_power) {
                g_logger->set_low_power_mode(true);
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize logging system: " << e.what() << std::endl;
        return 1;
    }

    // 执行命令
    if (command == "daemon") {
        // 设置文件权限掩码
        umask(0022);

        // 设置信号处理
        signal(SIGTERM, signal_handler);
        signal(SIGINT, signal_handler);
        signal(SIGPIPE, SIG_IGN);

        // 写入启动日志
        std::string startup_msg = "Logging system daemon started";
        if (low_power) {
            startup_msg += " (Low power mode)";
        }
        g_logger->write_log("system", LOG_INFO, startup_msg);

        // 优化的主循环
        std::mutex main_mutex;
        std::condition_variable main_cv;
        std::unique_lock<std::mutex> lock(main_mutex);

        // 守护进程主循环
        while (g_logger && g_logger->is_running()) {
            auto wait_duration = std::chrono::hours(1);
            main_cv.wait_for(lock, wait_duration);

            if (!g_logger || !g_logger->is_running()) {
                break;
            }
        }
        
        // 清理
        if (g_logger) {
            g_logger->write_log("system", LOG_INFO, "Logging system daemon is stopping...");
            g_logger->stop();
        }
        return 0;

    } else if (command == "write") {
        // 写入日志
        if (message.empty()) {
            std::cerr << "Error: Writing log requires message content (-m)" << std::endl;
            if (g_logger) g_logger->stop();
            return 1;
        }

        LogLevel level = static_cast<LogLevel>(log_level_int);
        g_logger->write_log(log_name, level, message);

        g_logger->flush_buffer(log_name);
        g_logger->stop();
        return 0;

    } else if (command == "batch") {
        // 批量写入日志
        if (batch_file.empty()) {
            std::cerr << "Error: Batch write requires input file (-b)" << std::endl;
            if (g_logger) g_logger->stop();
            return 1;
        }

        // 读取批处理文件
        std::ifstream batch_in(batch_file);
        if (!batch_in.is_open()) {
            std::cerr << "Error: Cannot open batch file: " << batch_file << " (" << strerror(errno) << ")" << std::endl;
            if (g_logger) g_logger->stop();
            return 1;
        }

        std::vector<std::pair<LogLevel, std::string>> entries;
        std::string line;
        int line_num = 0;

        // 从文件读取日志条目
        while (std::getline(batch_in, line)) {
            line_num++;
            // 跳过空行和注释
            if (line.empty() || line[0] == '#') continue;

            // 查找分隔符 '|'
            size_t pos = line.find('|');
            if (pos == std::string::npos) {
                std::cerr << "Warning: Batch file line " << line_num << " format error (missing '|'): " << line << std::endl;
                continue;
            }

            // 解析日志级别
            std::string level_str = line.substr(0, pos);
            // 移除可能的空格
            level_str.erase(0, level_str.find_first_not_of(" \t"));
            level_str.erase(level_str.find_last_not_of(" \t") + 1);

            LogLevel level = LOG_INFO; // 默认级别
            try {
                int lvl_int = std::stoi(level_str);
                if (lvl_int >= LOG_ERROR && lvl_int <= LOG_DEBUG) {
                    level = static_cast<LogLevel>(lvl_int);
                } else {
                    std::cerr << "Warning: Batch file line " << line_num << " invalid level (" << level_str << "), using INFO" << std::endl;
                }
            } catch (const std::invalid_argument&) {
                // 如果不是数字，尝试匹配字符串
                if (level_str == "ERROR") level = LOG_ERROR;
                else if (level_str == "WARN") level = LOG_WARN;
                else if (level_str == "INFO") level = LOG_INFO;
                else if (level_str == "DEBUG") level = LOG_DEBUG;
                else {
                    std::cerr << "Warning: Batch file line " << line_num << " unrecognized level (" << level_str << "), using INFO" << std::endl;
                }
            } catch (const std::out_of_range&) {
                std::cerr << "Warning: Batch file line " << line_num << " level out of range (" << level_str << "), using INFO" << std::endl;
            }

            // 获取消息内容
            std::string msg = line.substr(pos + 1);
            // 移除消息前导空格
            msg.erase(0, msg.find_first_not_of(" \t"));

            // 添加到条目列表
            entries.emplace_back(level, std::move(msg));
        }

        batch_in.close();

        // 批量写入日志
        if (!entries.empty()) {
            g_logger->batch_write(log_name, entries);
            // 批量写入后立即刷新
            g_logger->flush_buffer(log_name);
        }
        g_logger->stop();
        return 0;

    } else if (command == "flush") {
        // 刷新日志
        g_logger->flush_all();
        g_logger->stop();
        return 0;

    } else if (command == "clean") {
        // 清理日志
        g_logger->clean_logs();
        g_logger->stop();
        return 0;

    } else {
        std::cerr << "Error: Unknown command '" << command << "'" << std::endl;
        std::cerr << "Use -h for help." << std::endl;
        if (g_logger) g_logger->stop();
        return 1;
    }

    return 0;
}