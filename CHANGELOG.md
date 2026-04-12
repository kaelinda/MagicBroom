# Changelog

All notable changes to MagicBroom will be documented in this file.

## [1.0.0] - 2026-04-12

### Added
- Lemon 式启动器主窗口：小巧的 720x520 工具卡片网格，一目了然选择工具
- 多窗口架构：每个工具在独立 BrowserWindow 中打开，互不干扰
- 主进程状态中心：跨窗口扫描状态同步，新窗口可接续进行中的扫描
- 工具窗口轻量标题栏：macOS 原生拖拽区 + 工具名称
- Hero 区 4 种状态：idle / scanning / complete / error 动态切换
- window:open-tool 和 window:scan-and-open IPC 通道

### Changed
- 主窗口从 1280x800 侧边栏布局缩小为 720x520 启动器
- IPC 事件从 sender-only 改为 broadcastToAll（所有窗口接收扫描/清理进度）
- ScanContext IPC 监听从 useMagicBroom hook 上提到 ScanProvider 层（每窗口只注册一次）
- Tray 快速扫描从发送事件到主窗口改为直接打开 Smart Scan 工具窗口
- 定时任务页面布局从双栏改为单栏，适配 800x600 工具窗口
- 设置导航从页面内 Link 改为跨窗口 openTool IPC 调用
