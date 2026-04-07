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

## Downloads Inbox v2: 用 last opened 替代 mtime 判断 expired
- **What:** 为 Downloads Inbox 的 expired 判断补充 macOS “last opened” 元数据读取，用更准确的“14 天未打开”替代 v1 的 `mtime` 近似判断
- **Why:** 用户真正关心的是“这个文件我很久没碰了”，不是“这个文件很久没改了”。`last opened` 更接近收件箱式归档的产品心智
- **Context:** 当前 Downloads Inbox v1 的 engineering review 已明确把 scope 收缩为使用 `mtime`，避免被 Spotlight/metadata 读取可靠性拖慢。后续需要调研 `mdls` / Spotlight 元数据是否稳定、是否有权限或缓存缺失问题，并决定缺失值回退策略
- **Depends on:** Downloads Inbox v1 完成并验证基本交互成立后
- **Added:** 2026-04-06 via /plan-eng-review

## 为 Downloads Inbox 补 UI 组件测试基建
- **What:** 引入 jsdom + Testing Library，为 Downloads Inbox 及后续高交互页面提供组件级回归测试能力
- **Why:** 当前项目测试主力是 Node 逻辑测试，足够支撑 Downloads Inbox v1，但随着分组、批量归档、空状态、建议理由等 UI 交互增加，缺组件测试会开始漏掉前端回归
- **Context:** 当前 [vitest.config.ts] 仍是 `environment: 'node'`。这不是当前 PR 的最小范围，适合单开基础设施 PR，避免把功能实现和测试体系重构绑在一起
- **Depends on:** 不阻塞 Downloads Inbox v1；适合作为后续独立任务
- **Added:** 2026-04-06 via /plan-eng-review

## Downloads Inbox 首次进入说明
- **What:** 为 Downloads Inbox 增加一次性的首次进入说明，解释“建议处理”和 `expired` 的区别
- **Why:** 当前设计把 `expired` 提升成一级 tab，第一次使用的人容易把它误解成垃圾桶或第二轮清理区
- **Context:** design review 已确认 `expired` 应该保持 archive 心智，不带强删除动作。discoverability 已通过侧栏入口 + 首页 quick action 解决，但首次心智仍需要轻量引导来防止误解
- **Depends on:** Downloads Inbox 页面结构实现完成后，再决定引导落在 banner、tooltip 还是空状态说明
- **Added:** 2026-04-06 via /plan-design-review
