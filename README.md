# MagicBroom

专为 Mac 开发者设计的磁盘空间清理工具。

不是传统的"垃圾清理"工具 —— MagicBroom 帮你看清磁盘空间被谁占用，按开发环境安全清理，每个清理项都有风险等级和删除影响说明。

## 特性

- **开发者模式** — 自动识别 Xcode/Docker/npm/pip/Gradle 等开发环境，按环境分类展示可清理空间
- **风险分级系统** — 每个清理项标注 安全/警告/危险 + 删除后影响说明
- **64 条清理规则** — 覆盖 iOS、Android、前端、Python、Ruby、Docker、Homebrew 等
- **废纸篓安全** — 所有删除操作走废纸篓（可恢复），不直接删除
- **保护路径** — 硬编码保护 ~/Documents、~/Desktop、~/.ssh 等重要目录
- **状态栏托盘** — macOS 菜单栏常驻，关闭窗口时最小化到托盘
- **自动更新** — 通过 GitHub Releases 自动检测和下载新版本
- **JSON 规则引擎** — 社区可 PR 贡献新工具的清理规则

## 截图

启动后点击"开始扫描"即可体验完整功能。

## 安装

### 从 GitHub Releases 下载

前往 [Releases](https://github.com/kaelinda/MagicBroom/releases) 下载最新的 `.dmg` 文件。

### 从源码构建

```bash
git clone https://github.com/kaelinda/MagicBroom.git
cd MagicBroom
npm install
npm run dev      # 开发模式
npm run build    # 构建生产版本
```

## 技术栈

- **框架**: Electron 33 + Vite 6 + React 18 + TypeScript
- **样式**: Tailwind CSS 4 + CSS 变量设计系统
- **组件**: Radix UI + Lucide Icons + Recharts
- **测试**: Vitest (22 个测试用例)
- **更新**: electron-updater (GitHub Releases)
- **构建**: electron-vite 3 + electron-builder

## 支持的开发环境

| 环境 | 规则数 | 覆盖工具 |
|------|--------|---------|
| iOS | 15 | Xcode DerivedData/Archives/DeviceSupport/Simulator/SPM/CocoaPods/Carthage |
| Android | 13 | Gradle/SDK/NDK/AVD/Android Studio/Maven |
| Ruby | 10 | Gem/Bundler/RVM/rbenv |
| Python | 8 | pip/conda/uv/pyenv |
| Frontend | 7 | npm/yarn/pnpm/NVM/fnm/Bun |
| Homebrew | 5 | 下载缓存/Cask/旧版本/日志 |
| Docker | 2 | 虚拟磁盘/构建缓存 |
| 日常 | 4 | Safari/Chrome/系统日志/废纸篓 |

## 项目结构

```
electron/main/     → Electron 主进程（Scanner、Cleaner、RulesEngine、Tray、Updater）
electron/preload/  → contextBridge 安全 IPC
src/               → React 渲染进程（7 个页面）
rules/             → JSON 清理规则（8 个文件，64 条规则）
tests/             → Vitest 测试
```

## 贡献清理规则

规则文件在 `rules/developer/` 目录，格式：

```json
{
  "id": "tool-cache-name",
  "name": "工具缓存名称",
  "path": "~/Library/Caches/tool",
  "risk": "safe",
  "size_estimate": "500 MB - 3 GB",
  "impact": "删除后的影响说明",
  "conditions": ["path_exists:~/Library/Caches/tool"],
  "tags": ["category", "tool"]
}
```

`risk` 级别：`safe`（安全删除）、`warning`（需要注意）、`danger`（可能丢失数据）

## 开发

```bash
npm run dev       # 启动 Electron 开发服务器（HMR）
npm run build     # 构建生产版本
npm run test      # 运行测试
npm run test:run  # 单次运行测试
npm run lint      # TypeScript 类型检查
```

## License

MIT
