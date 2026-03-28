# MagicBroom

专为 Mac 用户和开发者设计的磁盘空间清理工具。

不是传统的"垃圾清理"工具 —— MagicBroom 帮你看清磁盘空间被谁占用，按场景安全清理，每个清理项都有风险等级和删除影响说明。

## 特性

### 三种扫描模式

- **日常模式** — 浏览器、通讯工具、系统缓存等 43 条日常清理规则
- **开发者模式** — 自动识别 13 种开发环境，按环境分类深度治理
- **Agent 模式** — 识别 AI 编码工具缓存、本地模型、会话历史，智能区分孤儿会话和陈旧会话

### 核心能力

- **155 条清理规则** — 覆盖日常 + 13 种开发环境 + 15 款 AI 工具
- **风险分级系统** — 每个清理项标注 安全/警告/危险 + 删除后影响说明 + 风险/大小排序
- **命令型安全清理** — Homebrew/Docker/Simulator 推荐运行原生命令（`brew cleanup`、`docker system prune`），比直接删文件更安全
- **Scanner 去重** — 自动检测父子路径重叠，避免重复计数虚高
- **通配符路径** — 自动匹配版本号变化的目录（如 Android Studio 多版本）
- **废纸篓安全** — 所有删除操作走废纸篓（可恢复），废纸篓清理保留 48h 冷却期
- **保护路径** — 硬编码保护 ~/Documents、~/Desktop、~/.ssh 等重要目录
- **排除目录** — 自定义排除路径，默认保护 AI 工具工作目录
- **错误通知** — 扫描/清理失败时 toast 提示，不再静默处理
- **键盘快捷键** — ⌘K 聚焦搜索、Esc 取消
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

### 日常模式（43 条）

| 场景 | 规则数 | 覆盖内容 |
|------|--------|---------|
| 浏览器 | 5 | Safari / Chrome / Firefox / Edge / Arc 缓存 |
| 通讯工具 | 9 | 微信 / QQ / 钉钉 / 飞书 / Slack / Telegram / Discord / 企业微信 / 旺旺 |
| Apple 生态 | 3 | iOS 设备备份 / iOS 固件更新 / iCloud 本地缓存 |
| 邮件 | 2 | 邮件附件 / 邮件数据缓存 |
| 媒体 | 3 | Spotify / VLC / Apple Music 缓存 |
| 系统 | 7 | 日志 / 崩溃报告 / Spotlight 索引 / 应用缓存 / 下载安装包 / 废纸篓 / Xcode 残留 |

### 开发者模式（97 条 / 13 种环境）

| 环境 | 规则数 | 覆盖工具 |
|------|--------|---------|
| iOS | 19 | Xcode DerivedData / Archives / DeviceSupport / Simulator / 运行时 / SPM / CocoaPods / Carthage / Previews / 模块缓存 / 索引 |
| Android | 14 | Gradle / SDK / NDK / AVD / Android Studio（通配符多版本）/ Maven / CMake |
| Python / AI | 12 | pip / conda（miniconda + anaconda）/ uv / pyenv / HuggingFace 模型 / Poetry |
| Ruby | 11 | Gem / Bundler / RVM / rbenv / ruby-build |
| Frontend | 10 | npm / npx / yarn（v1 + Berry）/ pnpm / NVM / fnm / Bun / Playwright |
| Homebrew | 7 | 下载缓存 / Cask / Caskroom / Cellar（ARM + Intel）/ 日志 / 临时文件 |
| Docker | 5 | 虚拟磁盘 / 构建缓存 / 数据卷 / 镜像层 / BuildX |
| Rust | 4 | Cargo registry / Git 依赖 / rustup 工具链 / 下载缓存 |
| Go | 3 | 模块缓存 / 构建缓存 / golangci-lint |
| Java | 3 | SDKMAN JDK / SDKMAN 归档 / Gradle JDK |
| .NET | 3 | NuGet 包缓存 / NuGet HTTP 缓存 / .NET SDK |
| Flutter / Dart | 3 | Flutter SDK 缓存 / pub 包缓存 / Dart 分析服务器 |
| JetBrains IDE | 3 | IDE 缓存 (2-20GB) / 插件配置 / 日志 |

### Agent 模式（15 条 + 动态会话检测）

| 工具 | 规则数 | 说明 |
|------|--------|------|
| Claude Code | 1 + 动态 | 工具缓存 (safe) + 孤儿/陈旧会话动态检测 |
| Cursor | 3 | 扩展缓存 / CachedData (safe) + 配置与会话 (warning) |
| Codex CLI | 2 | 缓存 (safe) + 会话记录 (warning) |
| Ollama | 1 | 本地模型（5-100 GB） |
| LM Studio | 1 | 本地模型（5-100 GB） |
| 其他 | 7 | Copilot / Continue / Codeium·Windsurf / Aider / Tabby / Gemini CLI / Tabnine |

**Claude Code 智能会话检测**：通过读取 `.jsonl` 中的 `cwd` 字段判定真实项目路径，自动分类为：
- 孤儿会话 — 项目目录已不存在
- 陈旧会话 — 超过 30 天未活跃
- 活跃会话不显示，避免误删

### 命令型安全清理

部分规则推荐运行原生 CLI 命令替代直接删文件：

| 场景 | 命令 | 优势 |
|------|------|------|
| Homebrew 旧版本 | `brew cleanup` | 只清旧版本，保留当前版本 |
| Homebrew 缓存 | `brew cleanup --prune=all` | 清理过期下载 |
| Docker 未使用资源 | `docker system prune -f` | 只删未使用的镜像和容器 |
| Docker 数据卷 | `docker system prune --volumes -f` | 只删未使用的卷 |
| iOS 模拟器运行时 | `xcrun simctl delete unavailable` | 只删已失效的运行时 |

命令执行有白名单限制，防止注入。

## 技术栈

- **框架**: Electron 33 + Vite 6 + React 18 + TypeScript
- **样式**: Tailwind CSS 4 + CSS 变量设计系统
- **组件**: Radix UI + Lucide Icons + Recharts
- **持久化**: electron-store（设置）+ JSON（规则）
- **更新**: electron-updater (GitHub Releases)
- **测试**: Vitest（38 个测试用例）
- **构建**: electron-vite 3 + electron-builder

## 项目结构

```
electron/main/     → Electron 主进程（Scanner、Cleaner、RulesEngine、Store、Tray、Updater）
electron/preload/  → contextBridge 安全 IPC
src/               → React 渲染进程（Dashboard、ScanResults、DeveloperMode、AgentMode、SpaceAnalysis、Settings）
rules/daily.json   → 日常模式规则（43 条）
rules/developer/   → 开发者模式规则（13 个环境，97 条）
rules/agent/       → Agent 模式规则（15 条）
tests/             → Vitest 测试（38 个）
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
  "tags": ["category", "tool"],
  "clean_command": "tool cleanup"
}
```

- `risk`: `safe`（安全）、`warning`（注意）、`danger`（危险）
- `conditions`: `app:BundleID`、`path_exists:路径`、`env:变量名`
- `tags`: 用于环境分类匹配
- `path` 支持通配符 `*`（如 `~/Caches/Google/AndroidStudio*`，自动匹配多版本）
- `clean_command`（可选）: 推荐的安全清理命令，比直接删文件更可靠

## 开发

```bash
npm run dev       # Electron 开发服务器（HMR）
npm run build     # 构建生产版本
npm run test      # 运行 Vitest 测试
npm run lint      # TypeScript 类型检查
```

## License

MIT
