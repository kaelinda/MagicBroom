import { Smartphone, TabletSmartphone, Container, Globe, Code2, Beer, Gem, Cog, Zap, Coffee, Brackets, Feather, Puzzle, Bot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface EnvironmentConfig {
  id: string
  name: string
  icon: LucideIcon
  tags: string[]
  description: string
}

/**
 * 开发环境定义。tags 用于匹配扫描结果的 ScanItem.tags。
 * 来源合并自 EnvironmentDetail（丰富 tags）和 DeveloperMode（icon）。
 */
export const environments: EnvironmentConfig[] = [
  { id: 'ios', name: 'iOS 开发', icon: Smartphone, tags: ['ios', 'xcode', 'cocoapods', 'carthage', 'swift', 'simulator', 'preview-cache', 'playground'], description: 'Xcode、模拟器、SPM、CocoaPods、Carthage' },
  { id: 'android', name: 'Android 开发', icon: TabletSmartphone, tags: ['android', 'gradle', 'maven', 'android-studio', 'sdk', 'emulator', 'avd', 'ndk'], description: 'Gradle、SDK、AVD 模拟器、Maven' },
  { id: 'docker', name: 'Docker 容器', icon: Container, tags: ['docker', 'volumes', 'image-cache'], description: '镜像、容器、构建缓存' },
  { id: 'frontend', name: '前端 Node', icon: Globe, tags: ['frontend', 'npm', 'yarn', 'pnpm', 'nvm', 'fnm', 'bun', 'playwright', 'browser-cache'], description: 'npm、yarn、pnpm、NVM、fnm、Bun' },
  { id: 'python', name: 'Python / AI', icon: Code2, tags: ['python', 'pip', 'conda', 'uv', 'pyenv', 'ai', 'model-cache', 'poetry'], description: 'pip、conda、uv、pyenv、HuggingFace' },
  { id: 'rust', name: 'Rust 开发', icon: Cog, tags: ['rust', 'cargo', 'rustup'], description: 'Cargo、rustup 工具链和缓存' },
  { id: 'go', name: 'Go 开发', icon: Zap, tags: ['go', 'module-cache', 'build-cache', 'lint-cache'], description: 'Go 模块缓存、构建缓存' },
  { id: 'java', name: 'Java / JDK', icon: Coffee, tags: ['java', 'sdkman', 'gradle'], description: 'SDKMAN、Gradle JDK、Maven' },
  { id: 'ruby', name: 'Ruby 开发', icon: Gem, tags: ['ruby', 'gem', 'bundler', 'rvm', 'rbenv'], description: 'Gem、Bundler、RVM、rbenv' },
  { id: 'dotnet', name: '.NET 开发', icon: Brackets, tags: ['dotnet', 'nuget'], description: 'NuGet 包缓存、.NET SDK' },
  { id: 'flutter', name: 'Flutter / Dart', icon: Feather, tags: ['flutter', 'dart'], description: 'Flutter SDK、Dart 包缓存' },
  { id: 'jetbrains', name: 'JetBrains IDE', icon: Puzzle, tags: ['jetbrains', 'ide-cache'], description: 'IDEA/WebStorm/PyCharm 缓存和插件' },
  { id: 'homebrew', name: 'Homebrew', icon: Beer, tags: ['homebrew', 'cask'], description: '包缓存、Cask 下载、旧版本' },
  { id: 'agent', name: 'Agent', icon: Bot, tags: ['agent', 'claude-code', 'cursor', 'codex', 'copilot', 'continue', 'codeium', 'aider', 'ollama', 'lm-studio', 'tabby', 'gemini', 'tabnine', 'openclaw', 'hermes-agent', 'goose', 'devon', 'swe-agent'], description: 'AI 编程助手、Agent 框架缓存和会话' },
]

/** 所有已知环境的 tags 集合，用于判断"其他"分组 */
const allKnownTags = new Set(environments.flatMap((e) => e.tags))

/** 判断一个 ScanItem 的 tags 是否匹配任何已知环境 */
export function matchesAnyEnvironment(tags: string[]): boolean {
  return tags.some((t) => allKnownTags.has(t))
}
