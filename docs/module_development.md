# AMMF2 模块开发指南

## 📚 目录

- [基础知识](#基础知识)
- [使用AMMF2-overlay快速开发](#使用ammf2-overlay快速开发)
- [使用AMMF2框架开发](#使用ammf2框架开发)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 基础知识

在开始开发之前，请确保您已经了解：

- Magisk模块的基本结构和工作原理
- [AMMF脚本开发指南](script.md)
- Shell脚本编程基础
- Git基本操作

## 使用AMMF2-overlay快速开发

AMMF2-overlay是一个基于AMMF2框架的快速模块开发工具，它简化了开发流程。

### 1. 克隆overlay仓库

```bash
git clone https://github.com/Aurora-Nasa-1/AMMF2-overlay.git
cd AMMF2-overlay
```

### 2. 开发流程

1. 修改配置文件
2. 常规Magisk模块开发流程
3. 自定义WebUI（可选）
4. 提交代码并创建标签
5. 等待GitHub Action自动构建

## 最佳实践

### 错误处理

- 始终检查错误并提供有意义的错误消息
- 对关键错误使用 `Aurora_abort`
- 使用日志系统记录错误详情

### 文件路径

- 使用带有变量的绝对路径，如 `$MODPATH`
- 在 `$TMP_FOLDER` 中创建临时文件
- 检查文件是否存在后再访问

### 用户交互

- 在请求用户输入时提供清晰的指示
- 根据脚本类型使用适当的函数
- 记录用户选择到日志中

### 日志记录

- 为每个脚本设置唯一的日志文件名
- 使用适当的日志级别（error, warn, info, debug）
- 在关键操作后使用 `flush_log` 确保日志被写入

## 使用AMMF2框架直接开发

### 1. 获取框架

```bash
# 方法1：使用Git克隆仓库
git clone https://github.com/Aurora-Nasa-1/AMMF2.git
cd AMMF2

# 方法2：直接下载ZIP压缩包
# 访问 https://github.com/Aurora-Nasa-1/AMMF2/archive/refs/heads/main.zip
```

### 2. 配置模块信息

编辑 `module_settings/config.sh` 文件，设置以下基本信息：

```bash
action_id="Module_ID"
action_name="Module Name"
action_author="Module Author"
action_description="Module Description"
# Github仓库
Github_update_repo="your_name/your_repo"
updateJson="XXXX/update.json"
```

### 3. 开发自定义脚本

在 `files/scripts/` 目录下创建您的自定义脚本：

- `install_custom_script.sh`：安装时执行的脚本
- `service_script.sh`：后台服务脚本

### 4. 开发WebUI（可选）

如果需要WebUI界面，可以在 `webroot/pages/` 目录下创建新的页面模块。

## 常见问题

### Q: 如何调试模块？

A: 使用AMMF2提供的日志系统，查看 `/data/adb/modules/your_module_id/logs/` 目录下的日志文件。

### Q: 如何处理不同Android版本的兼容性？

A: 使用AMMF2提供的环境检测函数，根据不同版本编写条件逻辑。

### Q: 如何添加新的设置选项？

A: 在 `module_settings/settings.json` 中添加新的设置项，并在WebUI中实现对应的控制界面。

---

## 更多资源

- [AMMF2 GitHub仓库](https://github.com/Aurora-Nasa-1/AMMF2)
- [Magisk官方文档](https://topjohnwu.github.io/Magisk/)
- [Shell脚本编程指南](https://github.com/dylanaraps/pure-bash-bible)

如有问题或建议，欢迎在GitHub提交issue或联系开发团队。