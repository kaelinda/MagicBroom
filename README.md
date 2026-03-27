# MagicBroom

专为 Mac 用户和开发者设计的磁盘空间清理工具。

不是传统的"垃圾清理"工具 —— MagicBroom 帮你看清磁盘空间被谁占用，按场景安全清理，每个清理项都有风险等级和删除影响说明。

## 特性

- **日常模式** — 浏览器缓存、微信/钉钉/飞书聊天缓存、邮件附件、iOS 备份、下载安装包等 24 种常见清理场景
- **开发者模式** — 自动识别 Xcode/Docker/npm/pip/Gradle 等 7 种开发环境，按环境分类深度治理
- **84 条清理规则** — 覆盖日常 + iOS/Android/前端/Python/Ruby/Docker/Homebrew
- **风险分级系统** — 每个清理项标注 安全/警告/危险 + 删除后影响说明
- **废纸篓安全** — 所有删除操作走废纸篓（可恢复），废纸篓清理保留 48h 冷却期
- **保护路径** — 硬编码保护 ~/Documents、~/Desktop、~/.ssh 等重要目录
- **排除目录** — 自定义排除路径，默认保护 AI 工具工作目录（ClaudeCode/Cursor/Codex）
- **Settings 持久化** — 所有设置保存到本地，重启不丢失
- **状态栏托盘** — macOS 菜单栏常驻，关闭窗口时最小化到托盘
- **自动更新** — 通过 GitHub Releases 自动检测和下载新版本
- **Show in Finder** — 每个清理项可直接在 Finder 中定位
- **JSON 规则引擎** — 社区可 PR 贡献新工具的清理规则

## 安装

### 从 GitHub Releases 下载

前往 [Releases](https://github.com/kaelinda/MagicBroom/releases) 下载最新的 `.dmg` 文件：

- **Apple Silicon Mac** (M1/M2/M3/M4) → `magicbroom-x.x.x-arm64.dmg`
- **Intel Mac** → `magicbroom-x.x.x-x64.dmg`

首次打开需右键 → 打开（ad-hoc 签名，未经 Apple 公证）。

### 从源码构建

```bash
git clone https://github.com/kaelinda/MagicBroom.git
cd MagicBroom
npm install
npm run dev      # 开发模式（HMR 热更新）
npm run build    # 构建生产版本
```

## 清理规则覆盖

### 日常模式（24 条）

| 场景 | 规则数 | 覆盖内容 |
|------|--------|---------|
| 浏览器 | 5 | Safari / Chrome / Firefox / Edge / Arc 缓存 |
| 通讯工具 | 5 | 微信 / QQ / 钉钉 / 飞书 / Slack 缓存 |
| Apple 生态 | 3 | iOS 设备备份 / iOS 固件更新 / iCloud 本地缓存 |
| 邮件 | 2 | 邮件附件 / 邮件数据缓存 |
| 媒体 | 2 | Spotify 离线缓存 / Apple Music 缓存 |
| 系统 | 7 | 日志 / 崩溃报告 / Spotlight 索引 / 应用缓存 / 下载安装包 / 废纸篓 / Xcode 残留 |

### 开发者模式（60 条）

| 环境 | 规则数 | 覆盖工具 |
|------|--------|---------|
| iOS | 15 | Xcode DerivedData/Archives/DeviceSupport/Simulator/SPM/CocoaPods/Carthage/Previews |
| Android | 13 | Gradle/SDK/NDK/AVD/Android Studio/Maven |
| Ruby | 10 | Gem/Bundler/RVM/rbenv |
| Python | 8 | pip/conda/uv/pyenv |
| Frontend | 7 | npm/yarn/pnpm/NVM/fnm/Bun |
| Homebrew | 5 | 下载缓存/Cask/旧版本/日志 |
| Docker | 2 | 虚拟磁盘/构建缓存 |

## 技术栈

- **框架**: Electron 33 + Vite 6 + React 18 + TypeScript
- **样式**: Tailwind CSS 4 + CSS 变量设计系统
- **组件**: Radix UI + Lucide Icons + Recharts
- **持久化**: electron-store（设置）+ JSON（规则）
- **更新**: electron-updater (GitHub Releases)
- **测试**: Vitest (22 个测试用例)
- **构建**: electron-vite 3 + electron-builder

## 项目结构

```
electron/main/     → Electron 主进程（Scanner、Cleaner、RulesEngine、Store、Tray、Updater）
electron/preload/  → contextBridge 安全 IPC
src/               → React 渲染进程（Dashboard、ScanResults、DeveloperMode、SpaceAnalysis、Settings 等）
rules/             → JSON 清理规则（9 个文件，84 条规则）
tests/             → Vitest 测试
```

## 贡献清理规则

规则文件在 `rules/` 目录，格式：

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

- `risk`: `safe`（安全）、`warning`（注意）、`danger`（危险）
- `conditions`: `app:BundleID`、`path_exists:路径`、`env:变量名`
- `tags`: 用于环境分类匹配

## 开发

```bash
npm run dev       # Electron 开发服务器（HMR）
npm run build     # 构建生产版本
npm run test      # 运行 Vitest 测试
npm run lint      # TypeScript 类型检查
```

## License

MIT
