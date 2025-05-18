
# AMMF2 - Aurora Modular Magisk Framework

[简体中文](README.md) | [English](en/README.md)

<div align="center">
    <img src="https://img.shields.io/github/commit-activity/w/Aurora-Nasa-1/AMMF2" alt="GitHub Commit Activity">
    <img src="https://img.shields.io/github/license/Aurora-Nasa-1/AMMF2" alt="GitHub License">
</div>

## 📋 项目概述

AMMF2 (Aurora Modular Magisk Framework 2) 是一个功能强大的 Magisk 模块开发框架，旨在简化模块开发流程，提供标准化的结构和丰富的功能组件。该框架支持多语言、WebUI 配置界面、自定义脚本等特性，适用于各种类型的 Magisk 模块开发。

[Telegram群组](https://t.me/AuroraNasaModule)
## ✨ 主要特性

- **多语言支持**：内置中文、英文、日语、俄语等多种语言支持
- **WebUI 配置界面**：提供美观的 Material Design 风格 Web 配置界面
- **自定义脚本系统**：灵活的脚本系统，支持安装时和运行时脚本
- **文件监控服务**：内置 filewatch 工具，支持文件变化触发操作
- **日志操作工具**：完整的日志系统，支持日志记录和错误处理
- **用户交互功能**：提供多种用户交互方式，如菜单选择、按键检测等
- **GitHub Action 支持**：内置 GitHub Action 工作流，支持自动构建和发布
- **完善的错误处理**：提供全面的错误处理和日志记录机制

## 🚀 快速开始

### 获取框架

```bash
# 方法1：使用Git克隆仓库
git clone https://github.com/Aurora-Nasa-1/AMMF2.git
cd AMMF2

# 方法2：直接下载ZIP压缩包
# 访问 https://github.com/Aurora-Nasa-1/AMMF2/archive/refs/heads/main.zip

# 其他方法...
```

### 基本配置

1. **如何开发模块**：
  [模块开发指南](module_development.md)

3. **配置 Release 上传**：
   Action 使用`softprops/action-gh-release@v2`上传 Release，需要在仓库设置中配置

4. **提交或提交 Tag(v\*)触发构建,Enjoy**

### 构建模块

1. **本地构建模块**：
   运行 `build.sh` 脚本来构建模块：
   ```bash
   ./build.sh
   ```

2. **Github Action自动构建**:
   提交或提交 Tag(v\*)触发构建
   
### 自定义脚本开发

**为确保后期可更新性，建议不要修改 service.sh 和 customize.sh**

1. **安装脚本**：
   在 `files/scripts/install_custom_script.sh` 中编写模块安装时执行的自定义脚本。

2. **服务脚本**：
   在 `files/scripts/service_script.sh` 中编写模块运行时的服务脚本。

## 📚 更多文档

- [目录结构说明](directory.md) - 详细的项目目录结构说明
- [脚本开发指南](script.md) - 脚本开发和函数使用说明
- [WebUI 开发指南](webui.md) - WebUI 开发和自定义说明

## 🤝 贡献

欢迎提交 PR 或 Issue 来改进这个框架！如果您觉得这个项目有用，请给它一个 Star ⭐

## 📄 许可证

本项目采用 MIT LICENSE 许可证。

## 🙏 感谢

[Pure CSS Material 3 Design](https://github.com/jogemu/md3css)
