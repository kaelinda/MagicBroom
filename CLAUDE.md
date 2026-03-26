# MagicBroom

Mac 开发者磁盘清理工具。

## 技术栈

- **框架**: Electron + Vite + React 18 + TypeScript
- **样式**: Tailwind CSS 4 + CSS 变量设计系统
- **组件**: Radix UI（无障碍原语）+ Lucide Icons + Recharts
- **构建**: electron-vite 3 + electron-builder
- **测试**: Vitest

## 项目结构

```
electron/main/     → Electron 主进程（Scanner、Cleaner、RulesEngine、IPC）
electron/preload/  → contextBridge 安全 IPC
src/               → React 渲染进程
rules/             → JSON 清理规则（daily + developer/*）
```

## 开发命令

```bash
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run test      # 运行 Vitest 测试
npm run lint      # TypeScript 类型检查
```

## 架构决策

- IPC 安全: preload + contextBridge + sandbox:true，不暴露 ipcRenderer
- 扫描: du spawn 流式处理（非 exec），15s 超时，最大 8 并发
- 清理: shell.trashItem 主进程异步队列（Worker Thread 无法访问 electron）
- 安全: 保护路径黑名单 + symlink resolve，~/.Trash 为 warning + 48h 冷却
- 状态: React Context + useReducer（ScanContext）
- 路由: HashRouter（兼容 Electron file:// 协议）
- 进度: scan:progress 300ms 批量发送

## 规则格式

JSON 文件在 `rules/` 目录，schema 见设计文档。risk: safe | warning | danger。
conditions 支持 app:BundleID、path_exists:、env: 三种。
