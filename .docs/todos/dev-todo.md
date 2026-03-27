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

### iOS（当前 15 条，建议补 4 条）
- [ ] `~/Library/Developer/CoreSimulator/Profiles/Runtimes` — 模拟器运行时（warning，5-30 GB，**高价值**）
- [ ] `~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex` — 模块缓存（safe，500 MB - 3 GB）
- [ ] `~/Library/Developer/Xcode/DerivedData/Index.noindex` — 索引数据（safe，500 MB - 2 GB）
- [ ] `~/Library/Caches/com.apple.dt.Xcode` — Xcode 自身缓存（safe，200 MB - 2 GB）

### Android（当前 13 条，建议补 3 条）
- [ ] `~/.gradle/jdks` — Gradle 自动下载的 JDK（safe，1-5 GB）
- [ ] `~/.gradle/native` — 原生构建缓存（safe，200 MB - 2 GB）
- [ ] `~/Library/Android/sdk/cmake` — CMake 工具（safe，500 MB - 2 GB）
- [ ] **修复**：Android Studio 版本号硬编码（`2024.3`）→ 应动态匹配或用通配

### Docker（当前 2 条，建议补 3 条）
- [ ] `~/Library/Containers/com.docker.docker/Data/docker/volumes` — 数据卷（danger，1-50 GB）
- [ ] `~/Library/Containers/com.docker.docker/Data/docker/image` — 镜像层缓存（warning，2-30 GB）
- [ ] `~/.docker/buildx` — BuildX 构建器缓存（safe，500 MB - 5 GB）

### Frontend（当前 7 条，建议补 3 条）
- [ ] `~/.yarn/berry/cache` — Yarn Berry (v2+) 缓存（safe，500 MB - 5 GB）
- [ ] `~/.npm/_npx` — npx 执行缓存（safe，100 MB - 1 GB）
- [ ] `~/Library/Caches/ms-playwright` — Playwright 浏览器二进制（safe，1-5 GB）

### Python（当前 8 条，建议补 4 条）
- [ ] `~/anaconda3/pkgs` — Anaconda 包缓存（safe，1-10 GB）
- [ ] `~/anaconda3/envs` — Anaconda 环境（warning，2-20 GB）
- [ ] `~/Library/Caches/pypoetry` — Poetry 缓存（safe，200 MB - 3 GB）
- [ ] `~/.cache/huggingface` — HuggingFace 模型缓存（warning，5-100 GB，**极高价值**）

### Ruby（当前 10 条，OK）
- [ ] `~/.cache/ruby-build` — ruby-build 下载缓存（safe，100 MB - 500 MB）

### Homebrew（当前 5 条，建议补 2 条）
- [ ] `/usr/local/Cellar` — Intel Mac 安装目录（warning，同 /opt/homebrew/Cellar）
- [ ] `/opt/homebrew/Caskroom` — Cask 安装目录（warning，1-10 GB）

---

## 三、Scanner 引擎问题

### 3.1 规则路径重叠（重复计数）
- [ ] `xcode-derived-data` 覆盖了 `spm-repositories`（DerivedData/SourcePackages 是子目录）
- [ ] `xcode-derived-data` 覆盖了 `xcode-logs`（DerivedData/Logs 是子目录）
- [ ] `android-avd` 与 `android-emulator-snapshots` 指向相同路径 `~/.android/avd`
- [ ] `homebrew-cache` 覆盖了 `homebrew-cask-cache`（Cask 是 Homebrew Caches 子目录）
- **解决方案**：Scanner 扫描前去重 — 如果规则 A 是规则 B 的子目录，跳过规则 A 的独立计算

### 3.2 路径动态化
- [ ] Android Studio 版本号硬编码 `2024.3` → 应改为通配匹配（遍历 `~/Library/Caches/Google/` 找 AndroidStudio*）
- [ ] Conda 安装位置假设 `~/miniconda3` → 也可能在 `~/anaconda3`、`/opt/anaconda3`
- [ ] Homebrew 路径假设 `/opt/homebrew` → Intel Mac 在 `/usr/local`

### 3.3 命令型清理（v2 特性）
- [ ] Homebrew 应建议运行 `brew cleanup` 而非直接删 Cellar
- [ ] Docker 应建议 `docker system prune` 而非直接删文件
- [ ] iOS Simulator 应建议 `xcrun simctl delete unavailable`

---

## 四、UI/UX 问题

- [ ] 环境卡片没有扫描数据时不可点击（应提示"先扫描"而非进入空详情页）
- [ ] EnvironmentDetail 页面缺少"全选"和"反选"按钮
- [ ] 缺少按风险等级排序/分组的能力
- [ ] 清理完成后应自动刷新 DeveloperMode 页面的统计数据
- [ ] 缺少"上次扫描时间"显示

---

## 五、优先级总结

| 优先级 | 任务 | 预估工作量 |
|--------|------|-----------|
| **P0** | 修复规则路径重叠（重复计数） | 2h |
| **P0** | 新增 Rust/Go/Java 环境 + 规则 | 1h |
| **P0** | 补全 HuggingFace 模型缓存、Docker volumes、Simulator Runtimes | 30min |
| **P1** | 路径动态化（Android Studio 版本、Conda 路径、Homebrew Intel） | 2h |
| **P1** | 新增 .NET/Flutter/JetBrains 环境 | 1h |
| **P1** | EnvironmentDetail 全选/反选 + 风险排序 | 1h |
| **P2** | 命令型清理建议（brew cleanup、docker prune）| 3h |
| **P2** | 上次扫描时间显示 | 30min |
