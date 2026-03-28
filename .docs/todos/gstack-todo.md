# gstack 审查遗留项 — v2 需求与后续优化

> 来源：/office-hours 设计文档、/plan-eng-review 工程审查、/plan-design-review 设计审查、Codex 独立审查
> 设计文档：~/.gstack/projects/MagicBroom/nowcoder-main-design-20260326-232816.md
> 审查状态：ENG CLEAN + DESIGN CLEAN (2026-03-27)

---

## 一、v2 核心功能（设计文档 Roadmap）

### 1. Agent 模式 ⭐ 最高优先级差异化功能
自动识别并清理 AI 编码工具缓存。

| 工具 | 路径 | 风险 |
|------|------|------|
| ClaudeCode 会话历史 | `~/.claude/projects/` | warning（对话不可找回） |
| ClaudeCode 工具缓存 | `~/.claude/.cache/` | safe |
| Cursor 全局配置/会话 | `~/.cursor/` | warning |
| OpenAI Codex 记录 | `~/.codex/` | safe |
| GitHub Copilot 缓存 | `~/Library/Application Support/GitHub Copilot/` | safe |
| Continue 缓存 | `~/.continue/` | safe |
| Codeium 缓存 | `~/.codeium/` | safe |

**实现要点：**
- 规则文件：`rules/agent/*.json`
- 风险提示重点：对话历史删除不可恢复，必须标注 `risk: warning`
- IPC scan:start 的 mode 类型需扩展（当前只支持 `daily` | `developer`）
- 新增 AgentMode 页面（类似 DeveloperMode 卡片墙）
- **注意：** 当前 `~/.claude`、`~/.cursor`、`~/.codex` 已在排除目录预设中，Agent 模式需要特殊处理排除逻辑

### 2. Flow Mode（Codex 冷读建议的差异化功能）
git 仓库感知的智能清理。

**实现思路：**
1. 扫描 `~/code/`、`~/projects/`、`~/Developer/` 等常见开发目录
2. 找出所有 git 仓库，按 `git log -1 --format=%ct` 获取最后 commit 时间
3. 分类：热仓库（30 天内）→ 保护；冷仓库（>90 天）→ 提示清理
4. 冷仓库对应的 DerivedData、.gradle、node_modules、__pycache__ 可安全提示
5. 一键回滚：清理前将路径写入日志，7 天内支持恢复提示

**技术挑战：**
- 需要递归扫描文件系统找 `.git` 目录，性能敏感
- 需要新的 Scanner 模式（不是基于 JSON 规则的固定路径）
- UI 需要新的展示形式（按仓库分组，而非按工具分组）

### 3. 定时任务（ScheduledTasks 页面）
- 使用 launchd plist（轻量，系统原生）而非后台守护进程
- 场景：每周日凌晨自动扫描 + 发送 macOS 通知（不自动删除，只通知）
- Figma 设计稿中已有 ScheduledTasks 页面（6 个预设任务 + 日志 + 新建表单）
- 当前页面文件未创建，需从 Figma 导出重新实现

---

## 二、v1 遗留的体验打磨

### 来自 /plan-design-review（设计审查 4→7/10）

- [x] **键盘快捷键** — ⌘K 搜索、⌘⌫ 删除选中项、Enter 确认、Esc 取消 ✅
- [x] **侧边栏折叠** — 窗口 < 1100px 自动收起为 64px 图标模式 + 手动收起按钮 + Tooltip ✅
- [x] **错误 toast 通知** — 扫描/清理/命令执行 toast 提示 ✅
- [x] **暗色模式** — CSS 变量层 + prefers-color-scheme 自动检测 + .dark 类手动切换 ✅

### 来自 /plan-eng-review（工程审查 8 issues）

- [ ] **E2E 测试** — 设计文档要求 dry-run 0 字节验证 + 完整扫描清理流程，目前只有单元测试 22 个
- [ ] **Scanner/Cleaner 单元测试** — 当前测试只覆盖 safety + rules JSON，缺核心逻辑测试
- [ ] **JSON 规则在线更新** — 从 GitHub raw 拉最新规则，fallback 到内嵌版本
- [ ] **扫描性能基准** — 成功标准要求 "10GB < 5s, 内存 < 200MB"，未验证

### 来自 Codex 独立审查（17 findings, 全部已修复 but 启发后续）

- [ ] **规则信任边界加固** — 当前有保护路径黑名单，但缺少规则签名验证（社区 PR 的规则可能恶意）
- [ ] **`version_hint` 运行时验证** — 当前仅作注释展示，不做版本判断。未来可选：检测工具版本，过期规则标记 stale

---

## 三、分发与运营

### 代码签名（Open Question #1，首个公开 Release 前必须关闭）
- [ ] 当前：ad-hoc 签名，用户首次打开需右键→打开
- [ ] 目标：Apple Developer Program ($99/年) + notarization
- [ ] 影响：没有公证的 .dmg 在 macOS 15+ 会被 Gatekeeper 拦截，严重影响下载转化率

### Homebrew Cask 分发
- [ ] `brew install --cask magicbroom`
- [ ] 需提交到 `homebrew-cask` 官方仓库或维护自己的 tap
- [ ] 前置依赖：代码签名完成

### CI/CD 增强
- [ ] 当前 Release 工作流只在 tag push 时触发，缺少 PR 级别的构建验证
- [ ] 考虑矩阵构建：macOS 14 + macOS 15 验证

---

## 四、设计审查未达满分项

| 维度 | 当前分 | 满分需要 |
|------|--------|---------|
| 信息架构 | 7/10 | 无重大缺陷 |
| 交互状态 | 7/10 | ~~错误 toast~~ ✅、清理进度条细化 |
| 用户旅程 | 8/10 | 无重大缺陷 |
| AI Slop | 6/10 | Emoji 替换为 Lucide 图标已决定但部分页面未执行 |
| 设计系统 | 5/10 | 缺少 DESIGN.md 文档化，建议运行 `/design-consultation` |
| 响应式/无障碍 | 6/10 | ~~侧边栏折叠~~ ✅，~~键盘导航~~ ✅，~~ARIA 标签~~ ✅ |

---

## 五、Codex 冷读的战略洞察（值得长期思考）

> "一次错误的'安全'推荐就能毁掉开发环境。信任一旦丢失，几乎无法挽回。"

- **信任层** 是产品的核心护城河，不是清理本身
- **规则准确性** 比规则数量更重要
- **命令型清理**（`brew cleanup`、`docker system prune`）比直接删文件更安全
- **Flow Mode** 是最有差异化的 v2 特性 — 市场上没有 git 仓库感知的清理工具

---

## 六、优先级总结

| 优先级 | 任务 | 类型 |
|--------|------|------|
| **v2-P0** | ~~Agent 模式（AI 工具缓存清理）~~ | ✅ 已完成 |
| **v2-P0** | Apple 代码签名 + 公证 | 分发 |
| **v2-P1** | Flow Mode（git 仓库感知） | 新功能 |
| **v2-P1** | 定时任务（launchd + ScheduledTasks 页面） | 新功能 |
| **v2-P1** | 暗色模式 | 体验 |
| **v1-P0** | ~~键盘快捷键（⌘K/Esc）~~ | ✅ 已完成 |
| **v1-P0** | ~~错误 toast 通知~~ | ✅ 已完成 |
| **v1-P1** | 侧边栏折叠 | 体验 |
| **v1-P1** | E2E 测试 + Scanner 单元测试 | 质量 |
| **v1-P2** | JSON 规则在线更新 | 功能 |
| **v1-P2** | DESIGN.md 设计系统文档 | 文档 |
| **长期** | Homebrew Cask 分发 | 分发 |
| **长期** | 规则签名验证 | 安全 |
| **长期** | 命令型安全清理 | 安全 |
