# MagicBroom

专为 Mac 用户和开发者设计的磁盘空间清理和下载归档工具。

不是传统的"垃圾清理"工具。MagicBroom 帮你看清磁盘空间被谁占用，按场景安全清理；也能把 Downloads 里该处理的文件先给建议，再归档沉底。

## 特性

### 三种扫描模式

- **日常模式** — 浏览器、通讯工具、系统缓存等 43 条日常清理规则
- **开发者模式** — 自动识别 13 种开发环境，按环境分类深度治理
- **Agent 模式** — 识别 AI 编码工具缓存、本地模型、会话历史，智能区分孤儿会话和陈旧会话

### 核心能力

- **164 条清理规则** — 覆盖日常 + 13 种开发环境 + 24 款 AI 工具/Agent
- **Downloads Inbox** — 单独处理 `~/Downloads` 顶层文件，给出“安装包 / 文档 / 图片”建议归档，而不是一把删掉
- **建议理由 + expired 沉底** — 每条建议都告诉你为什么该处理，超过 14 天未改动的文件会进入各分组下的 `expired/`
- **物理归档目录** — 归档到 `~/Downloads/_MagicBroom/Installers|Documents|Images[/expired]`，Finder 里看得见，心智稳定
- **风险分级系统** — 每个清理项标注 安全/警告/危险 + 删除后影响说明 + 风险/大小排序
- **命令型安全清理** — Homebrew/Docker/Simulator 推荐运行原生命令（`brew cleanup`、`docker system prune`），比直接删文件更安全
- **Scanner 去重** — 自动检测父子路径重叠，避免重复计数虚高
- **通配符路径** — 自动匹配版本号变化的目录（如 Android Studio 多版本）
- **定时任务** — 基于 macOS launchd 的每日自动扫描，可自定义执行时间和清理模式
- **废纸篓安全** — 所有删除操作走废纸篓（可恢复），废纸篓清理保留 48h 冷却期
- **保护路径** — 硬编码保护 ~/Documents、~/Desktop、~/.ssh 等重要目录
- **排除目录** — 自定义排除路径，默认保护 AI 工具工作目录
- **暗色模式** — 跟随系统 / 手动浅色 / 手动暗色，全页面适配，设置中可切换
- **侧边栏折叠** — 窗口 < 1100px 自动折叠为 64px 图标模式，支持手动收起
- **就地可操作** — Dashboard Top 5 和 SpaceAnalysis 分类卡片直接清理/排除/Finder，不用跳转页面
- **⌘K 命令面板** — clean safe 一键清理安全项、filter ios/docker/agent 快速过滤分类
- **饼图/柱状图切换** — SpaceAnalysis 分类视图支持柱状图和饼图两种展示模式
- **键盘快捷键** — ⌘K 搜索、⌘⌫ 删除选中项、Enter 确认、Esc 取消
- **无障碍** — ARIA 标签（role/aria-label/aria-current/aria-modal）
- **错误通知** — 扫描/清理/命令执行 toast 通知
- **Settings 持久化** — 所有设置（含主题）保存到本地，重启不丢失
- **状态栏托盘** — macOS 菜单栏常驻，关闭窗口时最小化到托盘
- **自动更新** — 通过 GitHub Releases 自动检测和下载新版本
- **Show in Finder** — 每个清理项可直接在 Finder 中定位
- **JSON 规则引擎** — 社区可 PR 贡献新工具的清理规则

## 安装

### 从 GitHub Releases 下载

前往 [Releases](https://github.com/kaelinda/MagicBroom/releases) 下载最新的 `.dmg` 文件：

- **Apple Silicon Mac** (M1/M2/M3/M4) → `magicbroom-x.x.x-arm64.dmg`
- **Intel Mac** → `magicbroom-x.x.x-x64.dmg`

当前版本未做 Apple Developer ID 签名和公证，首次打开时 macOS 可能会提示“无法验证开发者”。

### macOS 未签名应用如何打开

如果你下载的是 Releases 里的 `.dmg`，推荐按下面的顺序操作：

1. 打开 `.dmg`，将 `MagicBroom.app` 拖到“应用程序”目录。
2. 不要直接双击，先在“应用程序”里找到 `MagicBroom.app`。
3. 右键应用，选择“打开”。
4. 系统弹窗里再次点击“打开”。

如果你已经双击过一次并被 Gatekeeper 拦截，可以这样处理：

1. 打开“系统设置” → “隐私与安全性”。
2. 滚动到页面底部，找到“已阻止使用 MagicBroom”之类的提示。
3. 点击“仍要打开”。
4. 再次启动应用，并在弹窗中确认“打开”。

如果你更习惯终端，也可以手动去掉隔离属性：

```bash
xattr -dr com.apple.quarantine /Applications/MagicBroom.app
```

然后重新打开应用即可。

说明：

- 这是因为应用当前没有经过 Apple 公证，不代表应用本身一定有问题。
- 只建议对你确认来源可信的应用执行以上操作。

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

### Agent 模式（24 条 + 动态会话检测）

| 工具 | 规则数 | 说明 |
|------|--------|------|
| Claude Code | 1 + 动态 | 工具缓存 (safe) + 孤儿/陈旧会话动态检测 |
| Cursor | 3 | 扩展缓存 / CachedData (safe) + 配置与会话 (warning) |
| Codex CLI | 2 | 缓存 (safe) + 会话记录 (warning) |
| Ollama | 1 | 本地模型（5-100 GB） |
| LM Studio | 1 | 本地模型（5-100 GB） |
| OpenClaw | 2 | 数据 (warning) + 缓存 (safe) |
| HermesAgent | 1 | 配置与工具链 (warning) |
| Goose Agent | 2 | 数据 (warning) + 缓存 (safe) |
| Devon / SWE-agent / Amp / Cline | 4 | 各自配置与会话 (warning) |
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
- **测试**: Vitest（101 个测试用例）
- **构建**: electron-vite 3 + electron-builder

## 项目结构

```
electron/main/     → Electron 主进程（Scanner、Cleaner、ArchiveService、RulesEngine、ScheduledTasks、Store、Tray、Updater）
electron/preload/  → contextBridge 安全 IPC
src/               → React 渲染进程（Dashboard、Clean、DownloadsInbox、SpaceAnalysis、ScheduledTasks、Settings）
rules/daily.json   → 日常模式规则（43 条）
rules/developer/   → 开发者模式规则（13 个环境，97 条）
rules/agent/       → Agent 模式规则（24 条）
tests/             → Vitest 测试（101 个）
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
