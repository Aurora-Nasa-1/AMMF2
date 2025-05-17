#include <string>
#include <unistd.h>
#include <cerrno>
#include <csignal>
#include <sys/inotify.h>
#include <fcntl.h>
#include <poll.h>
#include <sys/resource.h>
#include <sys/stat.h>

#define EVENT_SIZE (sizeof(struct inotify_event))
#define BUF_LEN (256 * (EVENT_SIZE + 16))

static int fd = -1, wd = -1;
static volatile sig_atomic_t running = 1;
static std::string target_file;
static std::string script_path;
static std::string shell_command;
static bool daemon_mode = false;
static bool verbose = false;
static int check_interval = 30;
static bool low_power_mode = true;

struct SleepControl {
    unsigned int base_interval = 500000;  // 0.5s
    unsigned int max_interval = 5000000;  // 5s
    unsigned int current = 500000;
} sleep_control;

void log_message(const char* msg, bool is_error = false) {
    if (!verbose && !is_error) return;
    int fd = is_error ? STDERR_FILENO : STDOUT_FILENO;
    write(fd, msg, strlen(msg));
    write(fd, "\n", 1);
}

void handle_signal(int sig) {
    running = 0;
    char buffer[64];
    snprintf(buffer, sizeof(buffer), "Received signal %d, shutting down", sig); // Use sig parameter
    log_message(buffer, true);
}

void optimize_process() {
    setpriority(PRIO_PROCESS, 0, 19);
    struct rlimit rlim = { BUF_LEN * 2, BUF_LEN * 2 };
    setrlimit(RLIMIT_AS, &rlim);
}

void daemonize() {
    pid_t pid = fork();
    if (pid < 0) _exit(EXIT_FAILURE);
    if (pid > 0) _exit(EXIT_SUCCESS);

    if (setsid() < 0) _exit(EXIT_FAILURE);
    signal(SIGHUP, SIG_IGN);

    pid = fork();
    if (pid < 0) _exit(EXIT_FAILURE);
    if (pid > 0) _exit(EXIT_SUCCESS);

    umask(022);
    chdir("/");
    for (int i = 0; i < 3; ++i) {
        close(i);
        open("/dev/null", O_RDWR);
    }
}

void execute_script() {
    const char* cmd = shell_command.empty() ? script_path.c_str() : shell_command.c_str();
    int ret = system(cmd);
    if (ret != 0) {
        log_message("Script execution failed", true);
    } else if (verbose) {
        log_message("Script executed successfully");
    }
}

void print_usage(const char* prog_name) {
    const char* usage = "Usage: %s [options] <file_to_monitor> <script_to_execute>\n"
                        "Options:\n"
                        "  -d            Run in daemon mode\n"
                        "  -v            Enable verbose logging\n"
                        "  -i <seconds>  Check interval (default: 30s)\n"
                        "  -c <command>  Execute shell command instead of script\n"
                        "  -l            Enable low power mode (default: enabled)\n"
                        "  -h            Show help\n";
    char buffer[512];
    snprintf(buffer, sizeof(buffer), usage, prog_name);
    write(STDOUT_FILENO, buffer, strlen(buffer));
}

void adjust_sleep_interval(bool file_changed) {
    if (!low_power_mode) return;
    sleep_control.current = file_changed 
        ? sleep_control.base_interval 
        : std::min(sleep_control.current * 2, sleep_control.max_interval);
}

bool init_inotify() {
    if (fd >= 0) {
        inotify_rm_watch(fd, wd);
        close(fd);
    }

    fd = inotify_init1(IN_NONBLOCK | IN_CLOEXEC);
    if (fd < 0) {
        log_message("Failed to initialize inotify", true);
        return false;
    }

    wd = inotify_add_watch(fd, target_file.c_str(), IN_MODIFY | IN_ATTRIB | IN_DELETE_SELF);
    if (wd < 0) {
        log_message("Failed to add watch", true);
        close(fd);
        fd = -1;
        return false;
    }
    return true;
}

bool check_file_exists() {
    return access(target_file.c_str(), F_OK) == 0;
}

int main(int argc, char* argv[]) {
    int opt;
    while ((opt = getopt(argc, argv, "dvi:c:lh")) != -1) {
        switch (opt) {
            case 'd': daemon_mode = true; break;
            case 'v': verbose = true; break;
            case 'i': 
                check_interval = atoi(optarg);
                if (check_interval < 1) check_interval = 30;
                break;
            case 'c': shell_command = optarg; break;
            case 'l': low_power_mode = true; break;
            case 'h': print_usage(argv[0]); return 0;
            default: print_usage(argv[0]); return 1;
        }
    }

    if (optind >= argc) {
        log_message("Missing file to monitor", true);
        print_usage(argv[0]);
        return 1;
    }

    target_file = argv[optind];
    if (shell_command.empty() && optind + 1 >= argc) {
        log_message("Missing script or command", true);
        print_usage(argv[0]);
        return 1;
    }

    if (shell_command.empty()) {
        script_path = argv[optind + 1];
    }

    if (!check_file_exists()) {
        log_message("Cannot access monitored file", true);
        return 1;
    }

    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);
    signal(SIGPIPE, SIG_IGN);

    if (daemon_mode) {
        daemonize();
    }

    optimize_process();

    if (!init_inotify()) {
        return 1;
    }

    struct pollfd fds = { fd, POLLIN, 0 };
    char buffer[BUF_LEN] __attribute__((aligned(8)));
    bool file_changed = false;
    int reconnect_attempts = 0;
    const int max_reconnect_attempts = 5;

    while (running) {
        if (!check_file_exists()) {
            log_message("Monitored file disappeared", true);
            if (++reconnect_attempts > max_reconnect_attempts) {
                log_message("Max reconnect attempts reached", true);
                break;
            }
            sleep(5);
            if (check_file_exists() && init_inotify()) {
                reconnect_attempts = 0;
                fds.fd = fd;
                log_message("Reconnected to file");
            }
            continue;
        }

        int timeout = low_power_mode ? check_interval * 1000 / 2 : check_interval * 1000;
        int poll_ret = poll(&fds, 1, timeout);

        if (poll_ret < 0) {
            if (errno == EINTR) continue;
            log_message("Poll error", true);
            break;
        }

        if (poll_ret == 0) {
            if (low_power_mode) {
                adjust_sleep_interval(false);
                usleep(sleep_control.current);
            }
            continue;
        }

        if (fds.revents & POLLIN) {
            int length = read(fd, buffer, BUF_LEN);
            if (length < 0) {
                if (errno == EAGAIN || errno == EWOULDBLOCK || errno == EINTR) continue;
                log_message("Read error", true);
                break;
            }

            file_changed = false;
            for (int i = 0; i < length; ) {
                auto* event = (struct inotify_event*)&buffer[i];
                if (event->mask & (IN_MODIFY | IN_ATTRIB)) {
                    file_changed = true;
                    execute_script();
                }
                if (event->mask & IN_DELETE_SELF) {
                    log_message("File deleted, attempting reconnect");
                    init_inotify();
                    fds.fd = fd;
                }
                i += EVENT_SIZE + event->len;
            }

            if (file_changed && low_power_mode) {
                adjust_sleep_interval(true);
                sleep(2);
            }
        }
    }

    if (fd >= 0) {
        inotify_rm_watch(fd, wd);
        close(fd);
    }

    log_message("Monitor shutting down");
    return 0;
}