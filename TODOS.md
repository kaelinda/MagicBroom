# TODOS

## Daily 模式作为可选"深度清理"
- **What:** 将 daily 规则集作为可选的"深度清理"模式加回 UI
- **Why:** 浏览器缓存、系统日志、下载目录等对所有用户有价值，但不应混入开发者清理的默认流程
- **Context:** v0.6.0 的 smart 模式只合并 developer + agent。daily 规则包含 ~/Downloads、Zoom 录像、Final Cut 备份等个人内容，混入会改变"开发者工具"的产品定位。可以在清理页增加一个"深度清理"开关或独立视图。
- **Depends on:** feature/ui-pro 合并后
- **Added:** 2026-03-29 via /plan-eng-review

## 前端组件测试 (jsdom + testing-library)
- **What:** 配置 vitest jsdom 环境 + @testing-library/react，为 CleanPage 添加组件测试
- **Why:** UI 重构变动面大（视图切换、过滤器、选中状态跨视图），无组件测试等于盲发
- **Context:** 当前 vitest 配置 environment: 'node'，只能测后端逻辑。需要新增 jsdom 环境配置（可以用 vitest workspace 或 inline config），安装 @testing-library/react + jsdom。优先覆盖：视图切换保持选中状态、风险过滤器、全选安全项。
- **Depends on:** feature/ui-pro 合并后
- **Added:** 2026-03-29 via /plan-eng-review
