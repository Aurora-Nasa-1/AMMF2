#include <iostream>
#include <fstream>
#include <string>
#include <string_view>
#include <vector>
#include <map>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <memory>
#include <csignal>
#include <ctime>

// Linux-specific headers
#include <sys/stat.h>
#include <dirent.h>
#include <unistd.h>
#include <cerrno>

// Log levels
enum class LogLevel {
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
};

class Logger {
private:
    using StringView = std::string_view;
    using Clock = std::chrono::steady_clock;
    using TimePoint = Clock::time_point;

    // Configuration
    std::atomic<bool> running{true};
    std::atomic<bool> low_power_mode{false};
    std::atomic<size_t> buffer_max_size{8192};
    std::atomic<size_t> log_size_limit{102400};
    std::atomic<LogLevel> log_level{LogLevel::INFO};
    std::string log_dir;
    std::mutex log_mutex;
    std::condition_variable cv;
    std::string time_buffer;
    std::mutex time_mutex;

    struct LogFile {
        std::ofstream stream;
        size_t current_size{0};
    };
    std::map<std::string, std::unique_ptr<LogFile>> log_files;

    struct LogBuffer {
        std::string content;
        TimePoint last_write;

        LogBuffer() { content.reserve(16384); }
    };
    std::map<std::string, std::unique_ptr<LogBuffer>> log_buffers;

    std::unique_ptr<std::thread> flush_thread;

public:
    Logger(StringView dir, LogLevel level = LogLevel::INFO, size_t size_limit = 102400)
        : running(true)
        , low_power_mode(false)
        , buffer_max_size(8192)
        , log_size_limit(size_limit)
        , log_level(level)
        , log_dir(dir) {
        create_log_directory();
        time_buffer.resize(32);
        flush_thread = std::make_unique<std::thread>(&Logger::flush_thread_func, this);
    }

    ~Logger() {
        stop();
        if (flush_thread && flush_thread->joinable()) {
            flush_thread->join();
        }
    }

    bool is_running() const noexcept {
        return running.load(std::memory_order_relaxed);
    }

    void stop() {
        if (running.exchange(false)) {
            cv.notify_all();
            flush_all();
            log_files.clear();
            log_buffers.clear();
        }
    }

    void set_buffer_size(size_t size) { buffer_max_size = size; }
    void set_log_level(LogLevel level) { log_level = level; }
    void set_log_size_limit(size_t size) { log_size_limit = size; }
    void set_low_power_mode(bool enabled) {
        low_power_mode = enabled;
        buffer_max_size = enabled ? 32768 : 8192;
        cv.notify_one();
    }

    void write_log(StringView log_name, LogLevel level, StringView message) {
        if (level > log_level || !running) return;

        const char* time_str = get_formatted_time();
        const char* level_str = get_level_string(level);
        std::string log_entry;
        log_entry.reserve(100 + message.size());
        log_entry = time_str;
        log_entry += " [";
        log_entry += level_str;
        log_entry += "] ";
        log_entry += message;
        log_entry += "\n";
        add_to_buffer(std::string(log_name), std::move(log_entry), level);
    }

    void batch_write(StringView log_name, const std::vector<std::pair<LogLevel, std::string>>& entries) {
        if (entries.empty() || !running) return;

        std::string batch_content;
        batch_content.reserve(entries.size() * 100);
        bool has_error = false;
        const char* time_str = get_formatted_time();

        for (const auto& [level, msg] : entries) {
            if (level <= log_level) {
                const char* level_str = get_level_string(level);
                batch_content += time_str;
                batch_content += " [";
                batch_content += level_str;
                batch_content += "] ";
                batch_content += msg;
                batch_content += "\n";
                if (level == LogLevel::ERROR) has_error = true;
            }
        }

        if (!batch_content.empty()) {
            add_to_buffer(std::string(log_name), std::move(batch_content), has_error ? LogLevel::ERROR : LogLevel::INFO);
        }
    }

    void flush_buffer(const std::string& log_name) {
        std::lock_guard lock(log_mutex);
        flush_buffer_internal(log_name);
    }

    void flush_all() {
        std::lock_guard lock(log_mutex);
        for (const auto& [name, buffer] : log_buffers) {
            if (buffer && !buffer->content.empty()) {
                flush_buffer_internal(name);
            }
        }
        for (auto& [_, file] : log_files) {
            if (file && file->stream.is_open()) {
                file->stream.flush();
            }
        }
    }

    void clean_logs() {
        std::lock_guard lock(log_mutex);
        log_files.clear();
        log_buffers.clear();

        if (DIR* dir = opendir(log_dir.c_str())) {
            while (dirent* entry = readdir(dir)) {
                std::string name = entry->d_name;
                if (name != "." && name != ".." && 
                    (name.ends_with(".log") || name.ends_with(".log.old"))) {
                    std::string path = log_dir + "/" + name;
                    if (unlink(path.c_str()) != 0) {
                        std::cerr << "Cannot delete: " << path << " (" << strerror(errno) << ")\n";
                    }
                }
            }
            closedir(dir);
        } else {
            std::cerr << "Cannot open: " << log_dir << " (" << strerror(errno) << ")\n";
        }
    }

private:
    void create_log_directory() {
        struct stat st;
        if (stat(log_dir.c_str(), &st) == 0) {
            if (!S_ISDIR(st.st_mode)) {
                throw std::runtime_error("Log path exists but is not a directory: " + log_dir);
            }
            if (access(log_dir.c_str(), W_OK | X_OK) != 0) {
                chmod(log_dir.c_str(), 0755);
            }
            return;
        }

        if (mkdir(log_dir.c_str(), 0755) != 0 && errno != EEXIST) {
            throw std::runtime_error("Cannot create log directory: " + log_dir + " (" + strerror(errno) + ")");
        }
        chmod(log_dir.c_str(), 0755);
    }

    const char* get_level_string(LogLevel level) const noexcept {
        switch (level) {
            case LogLevel::ERROR: return "ERROR";
            case LogLevel::WARN:  return "WARN";
            case LogLevel::INFO:  return "INFO";
            case LogLevel::DEBUG: return "DEBUG";
            default:              return "UNKNOWN";
        }
    }

    const char* get_formatted_time() {
        std::lock_guard lock(time_mutex);
        auto now = std::chrono::system_clock::now();
        auto now_time = std::chrono::system_clock::to_time_t(now);
        std::tm tm;
        localtime_r(&now_time, &tm);
        strftime(time_buffer.data(), time_buffer.size(), "%Y-%m-%d %H:%M:%S", &tm);
        return time_buffer.c_str();
    }

    void add_to_buffer(std::string log_name, std::string&& content, LogLevel level) {
        std::lock_guard lock(log_mutex);
        auto [it, inserted] = log_buffers.try_emplace(log_name, std::make_unique<LogBuffer>());
        auto& buffer = it->second;
        buffer->content += std::move(content);
        buffer->last_write = Clock::now();

        if (level == LogLevel::ERROR || (!low_power_mode && buffer->content.size() >= buffer_max_size)) {
            flush_buffer_internal(log_name);
        }
        cv.notify_one();
    }

    void flush_buffer_internal(const std::string& log_name) {
        auto it = log_buffers.find(log_name);
        if (it == log_buffers.end() || !it->second || it->second->content.empty()) {
            return;
        }

        auto& buffer = it->second;
        std::string path = log_dir + "/" + log_name + ".log";
        auto [file_it, inserted] = log_files.try_emplace(log_name, std::make_unique<LogFile>());
        auto& file = file_it->second;

        if (file->stream.is_open() && file->current_size > log_size_limit) {
            file->stream.close();
            std::string old_path = path + ".old";
            if (access(old_path.c_str(), F_OK) == 0) {
                unlink(old_path.c_str());
            }
            if (rename(path.c_str(), old_path.c_str()) != 0) {
                std::cerr << "Cannot rename: " << path << " -> " << old_path << " (" << strerror(errno) << ")\n";
            }
            file->current_size = 0;
        }

        if (!file->stream.is_open()) {
            file->stream.open(path, std::ios::app | std::ios::binary);
            if (!file->stream.is_open()) {
                std::cerr << "Cannot open: " << path << " (" << strerror(errno) << ")\n";
                buffer->content.clear();
                return;
            }
            file->stream.seekp(0, std::ios::end);
            file->current_size = static_cast<size_t>(file->stream.tellp());
        }

        file->stream.write(buffer->content.data(), buffer->content.size());
        if (file->stream.fail()) {
            std::cerr << "Failed to write: " << path << "\n";
            file->stream.close();
        } else {
            file->stream.flush();
            file->current_size += buffer->content.size();
            buffer->content.clear();
        }
    }

    void flush_thread_func() {
        while (running) {
            std::unique_lock lock(log_mutex);
            cv.wait_for(lock, low_power_mode ? std::chrono::seconds(60) : std::chrono::seconds(15), 
                        [this] { return !running; });

            if (!running) break;

            auto now = Clock::now();
            for (auto it = log_buffers.begin(); it != log_buffers.end();) {
                auto& buffer = it->second;
                if (!buffer || buffer->content.empty()) {
                    ++it;
                    continue;
                }

                auto idle_time = std::chrono::duration_cast<std::chrono::milliseconds>(
                    now - buffer->last_write).count();
                if (idle_time > 30000 || buffer->content.size() > buffer_max_size / 2) {
                    flush_buffer_internal(it->first);
                }
                ++it;
            }

            for (auto it = log_files.begin(); it != log_files.end();) {
                auto& file = it->second;
                if (file && file->stream.is_open()) {
                    file->stream.flush();
                    ++it;
                } else {
                    it = log_files.erase(it);
                }
            }
        }
    }
};

static std::unique_ptr<Logger> g_logger;

void signal_handler(int sig) {
    if (g_logger && (sig == SIGTERM || sig == SIGINT)) {
        g_logger->flush_all();
        g_logger->stop();
        _exit(0);
    }
}

int main(int argc, char* argv[]) {
    std::string log_dir = "/data/adb/modules/AMMF2/logs";
    LogLevel log_level = LogLevel::INFO;
    std::string command;
    std::string log_name = "main";
    std::string message;
    std::string batch_file;
    bool low_power = false;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "-d" && ++i < argc) log_dir = argv[i];
        else if (arg == "-l" && ++i < argc) {
            try {
                int lvl = std::stoi(argv[i]);
                if (lvl >= static_cast<int>(LogLevel::ERROR) && lvl <= static_cast<int>(LogLevel::DEBUG)) {
                    log_level = static_cast<LogLevel>(lvl);
                } else {
                    std::cerr << "Invalid log level: " << argv[i] << "\n";
                    return 1;
                }
            } catch (const std::exception& e) {
                std::cerr << "Invalid log level: " << argv[i] << "\n";
                return 1;
            }
        }
        else if (arg == "-c" && ++i < argc) command = argv[i];
        else if (arg == "-n" && ++i < argc) log_name = argv[i];
        else if (arg == "-m" && ++i < argc) message = argv[i];
        else if (arg == "-b" && ++i < argc) batch_file = argv[i];
        else if (arg == "-p") low_power = true;
        else if (arg == "-h" || arg == "--help") {
            std::cout << "Usage: " << argv[0] << " [options]\n"
                      << "Options:\n"
                      << "  -d DIR    Log directory (default: /data/adb/modules/AMMF2/logs)\n"
                      << "  -l LEVEL  Log level (1=Error, 2=Warn, 3=Info, 4=Debug, default: 3)\n"
                      << "  -c CMD    Command (daemon, write, batch, flush, clean)\n"
                      << "  -n NAME   Log name (default: main)\n"
                      << "  -m MSG    Log message\n"
                      << "  -b FILE   Batch input file (format: level|message)\n"
                      << "  -p        Low power mode\n"
                      << "  -h        Show help\n";
            return 0;
        } else {
            std::cerr << "Unknown argument: " << arg << "\n";
            return 1;
        }
    }

    if (command.empty()) command = "daemon";

    try {
        g_logger = std::make_unique<Logger>(log_dir, log_level);
        if (low_power) g_logger->set_low_power_mode(true);
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize logger: " << e.what() << "\n";
        return 1;
    }

    if (command == "daemon") {
        umask(0022);
        signal(SIGTERM, signal_handler);
        signal(SIGINT, signal_handler);
        signal(SIGPIPE, SIG_IGN);

        g_logger->write_log("main", LogLevel::INFO, 
                            low_power ? "Daemon started (low power)" : "Daemon started");

        std::mutex mtx;
        std::condition_variable cv;
        std::unique_lock lock(mtx);
        while (g_logger && g_logger->is_running()) {
            cv.wait_for(lock, std::chrono::hours(1));
        }

        g_logger->write_log("main", LogLevel::INFO, "Daemon stopping");
        return 0;
    } else if (command == "write") {
        if (message.empty()) {
            std::cerr << "Message required for write command\n";
            return 1;
        }
        g_logger->write_log(log_name, log_level, message);
        g_logger->flush_buffer(log_name);
    } else if (command == "batch") {
        if (batch_file.empty()) {
            std::cerr << "Batch file required for batch command\n";
            return 1;
        }

        std::ifstream in(batch_file);
        if (!in) {
            std::cerr << "Cannot open batch file: " << batch_file << " (" << strerror(errno) << ")\n";
            return 1;
        }

        std::vector<std::pair<LogLevel, std::string>> entries;
        std::string line;
        int line_num = 0;

        while (std::getline(in, line)) {
            ++line_num;
            if (line.empty() || line[0] == '#') continue;

            size_t pos = line.find('|');
            if (pos == std::string::npos) {
                std::cerr << "Line " << line_num << ": invalid format\n";
                continue;
            }

            std::string level_str = line.substr(0, pos);
            level_str.erase(0, level_str.find_first_not_of(" \t"));
            level_str.erase(level_str.find_last_not_of(" \t") + 1);

            LogLevel level = LogLevel::INFO;
            try {
                int lvl = std::stoi(level_str);
                if (lvl >= static_cast<int>(LogLevel::ERROR) && lvl <= static_cast<int>(LogLevel::DEBUG)) {
                    level = static_cast<LogLevel>(lvl);
                } else {
                    std::cerr << "Line " << line_num << ": invalid level: " << level_str << "\n";
                }
            } catch (const std::exception&) {
                if (level_str == "ERROR") level = LogLevel::ERROR;
                else if (level_str == "WARN") level = LogLevel::WARN;
                else if (level_str == "INFO") level = LogLevel::INFO;
                else if (level_str == "DEBUG") level = LogLevel::DEBUG;
                else {
                    std::cerr << "Line " << line_num << ": invalid level: " << level_str << "\n";
                }
            }

            std::string msg = line.substr(pos + 1);
            msg.erase(0, msg.find_first_not_of(" \t"));
            entries.emplace_back(level, std::move(msg));
        }

        if (!entries.empty()) {
            g_logger->batch_write(log_name, entries);
            g_logger->flush_buffer(log_name);
        }
    } else if (command == "flush") {
        g_logger->flush_all();
    } else if (command == "clean") {
        g_logger->clean_logs();
    } else {
        std::cerr << "Unknown command: " << command << "\n";
        return 1;
    }

    return 0;
}