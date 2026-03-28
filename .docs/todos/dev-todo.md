# 开发者模式待改进项

> 来源：Codex 独立分析 (2026-03-27)
> 当前状态：60 条开发者规则，7 个环境卡

---

## 一、缺失的开发环境（新增环境卡 + 规则文件）

### 优先级 P0（高价值、高覆盖）

#### 1. Rust / Cargo
- `~/.cargo/registry` — Crate 注册表缓存（safe，1-10 GB）
- `~/.cargo/git` — Git 依赖克隆（safe，500 MB - 5 GB）
- `~/.rustup/toolchains` — 已安装的 Rust 工具链版本（warning，1-10 GB）
- `~/.rustup/downloads` — 工具链下载缓存（safe，200 MB - 2 GB）
- 文件：`rules/developer/rust.json`
- UI：DeveloperMode + EnvironmentDetail 新增 Rust 卡片

#### 2. Go
- `~/go/pkg/mod` — Go 模块缓存（safe，1-10 GB）
- `~/Library/Caches/go-build` — 构建缓存（safe，500 MB - 5 GB）
- `~/.cache/golangci-lint` — Lint 缓存（safe，100 MB - 1 GB）
- 文件：`rules/developer/go.json`

#### 3. Java / JDK
- `~/.sdkman/candidates/java` — SDKMAN 安装的 JDK 版本（warning，2-15 GB）
- `~/.sdkman/archives` — SDKMAN 下载归档（safe，500 MB - 3 GB）
- `~/.gradle/jdks` — Gradle 下载的 JDK（safe，1-5 GB）
- 文件：`rules/developer/java.json`

### 优先级 P1（常见但用户量稍少）

#### 4. .NET
- `~/.nuget/packages` — NuGet 包缓存（safe，1-10 GB）
- `~/Library/Caches/NuGet` — NuGet HTTP 缓存（safe，200 MB - 2 GB）
- `~/.dotnet` — .NET SDK 运行时（warning，1-5 GB）
- 文件：`rules/developer/dotnet.json`

#### 5. Flutter / Dart
- `~/flutter/bin/cache` — Flutter SDK 缓存（safe，2-5 GB）
- `~/.pub-cache` — Dart 包缓存（safe，500 MB - 5 GB）
- `~/.dartServer` — Dart 分析服务器缓存（safe，200 MB - 1 GB）
- 文件：`rules/developer/flutter.json`

#### 6. JetBrains IDE（通用，非 Android Studio）
- `~/Library/Caches/JetBrains` — 所有 JetBrains IDE 缓存（safe，2-20 GB）
- `~/Library/Application Support/JetBrains` — 插件和配置数据（warning，500 MB - 5 GB）
- `~/Library/Logs/JetBrains` — IDE 日志（safe，100 MB - 1 GB）
- 文件：`rules/developer/jetbrains.json`

### 优先级 P2（小众）

#### 7. Lua
- `~/.luarocks` — LuaRocks 包管理（safe，100 MB - 1 GB）

---

## 二、现有环境缺失的重要路径

### iOS ✅ 全部补全
- [x] `~/Library/Developer/CoreSimulator/Profiles/Runtimes` — 模拟器运行时
- [x] `~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex` — 模块缓存
- [x] `~/Library/Developer/Xcode/DerivedData/Index.noindex` — 索引数据
- [x] `~/Library/Caches/com.apple.dt.Xcode` — Xcode 自身缓存

### Android ✅ 全部补全
- [x] `~/.gradle/jdks` — Gradle 自动下载的 JDK（在 java.json）
- [x] `~/.gradle/native` — 原生构建缓存
- [x] `~/Library/Android/sdk/cmake` — CMake 工具
- [x] **修复**：Android Studio 版本号通配匹配

### Docker ✅ 全部补全
- [x] `~/Library/Containers/com.docker.docker/Data/docker/volumes` — 数据卷
- [x] `~/Library/Containers/com.docker.docker/Data/docker/image` — 镜像层缓存
- [x] `~/.docker/buildx` — BuildX 构建器缓存

### Frontend ✅ 全部补全
- [x] `~/.yarn/berry/cache` — Yarn Berry (v2+) 缓存
- [x] `~/.npm/_npx` — npx 执行缓存
- [x] `~/Library/Caches/ms-playwright` — Playwright 浏览器二进制

### Python ✅ 全部补全
- [x] `~/anaconda3/pkgs` — Anaconda 包缓存
- [x] `~/anaconda3/envs` — Anaconda 环境
- [x] `~/Library/Caches/pypoetry` — Poetry 缓存
- [x] `~/.cache/huggingface` — HuggingFace 模型缓存

### Ruby ✅ 补全
- [x] `~/.cache/ruby-build` — ruby-build 下载缓存

### Homebrew ✅ 全部补全
- [x] `/usr/local/Cellar` — Intel Mac 安装目录
- [x] `/opt/homebrew/Caskroom` — Cask 安装目录

---

## 三、Scanner 引擎问题

### 3.1 规则路径重叠（重复计数） ✅ 已修复
- [x] `xcode-derived-data` 覆盖了 `spm-repositories`（DerivedData/SourcePackages 是子目录）
- [x] `xcode-derived-data` 覆盖了 `xcode-logs`（DerivedData/Logs 是子目录）
- [x] `android-avd` 与 `android-emulator-snapshots` 指向相同路径 `~/.android/avd`
- [x] `homebrew-cache` 覆盖了 `homebrew-cask-cache`（Cask 是 Homebrew Caches 子目录）
- **解决方案**：Scanner 新增 `deduplicateOverlaps()` 后处理，从父路径减去子路径大小；移除 android-emulator-snapshots 重复规则

### 3.2 路径动态化 ✅ 已修复
- [x] Android Studio 版本号硬编码 `2024.3` → 改为通配匹配 `AndroidStudio*`（RulesEngine 自动展开）
- [x] Conda 安装位置假设 `~/miniconda3` → 新增 `~/anaconda3` 变体规则
- [x] Homebrew 路径假设 `/opt/homebrew` → 新增 Intel Mac `/usr/local/Cellar` 规则

### 3.3 命令型清理（v2 特性）
- [ ] Homebrew 应建议运行 `brew cleanup` 而非直接删 Cellar
- [ ] Docker 应建议 `docker system prune` 而非直接删文件
- [ ] iOS Simulator 应建议 `xcrun simctl delete unavailable`

---

## 四、UI/UX 问题

- [x] 环境卡片没有扫描数据时不可点击（应提示"先扫描"而非进入空详情页） ✅
- [x] EnvironmentDetail 页面缺少"全选"和"反选"按钮 ✅
- [x] 缺少按风险等级排序/分组的能力 ✅
- [ ] 清理完成后应自动刷新 DeveloperMode 页面的统计数据
- [x] 缺少"上次扫描时间"显示 ✅

---

## 五、优先级总结

| 优先级 | 任务 | 预估工作量 |
|--------|------|-----------|
| **P0** | ~~修复规则路径重叠（重复计数）~~ | ✅ 已完成 |
| **P0** | ~~新增 Rust/Go/Java 环境 + 规则~~ | ✅ 已完成 |
| **P0** | ~~补全 HuggingFace 模型缓存、Docker volumes、Simulator Runtimes~~ | ✅ 已完成 |
| **P1** | ~~路径动态化（Android Studio 版本、Conda 路径、Homebrew Intel）~~ | ✅ 已完成 |
| **P1** | ~~新增 .NET/Flutter/JetBrains 环境~~ | ✅ 已完成 |
| **P1** | ~~EnvironmentDetail 全选/反选 + 风险排序~~ | ✅ 已完成 |
| **P2** | 命令型清理建议（brew cleanup、docker prune）| 3h |
| **P2** | ~~上次扫描时间显示~~ | ✅ 已完成 |
