import { Smartphone, TabletSmartphone, Container, Globe, Code2, Beer, Gem, Cog, Zap, Coffee, Brackets, Feather, Puzzle, ChevronRight, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { cardClass } from '../styles'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

const environments = [
  { id: 'ios', name: 'iOS 开发', icon: Smartphone, tags: ['ios', 'xcode', 'cocoapods', 'carthage', 'swift', 'simulator'], description: 'Xcode、模拟器、SPM、CocoaPods、Carthage' },
  { id: 'android', name: 'Android 开发', icon: TabletSmartphone, tags: ['android', 'gradle', 'maven', 'android-studio', 'sdk', 'emulator', 'avd', 'ndk'], description: 'Gradle、SDK、AVD 模拟器、Maven' },
  { id: 'docker', name: 'Docker 容器', icon: Container, tags: ['docker'], description: '镜像、容器、构建缓存' },
  { id: 'frontend', name: '前端 Node', icon: Globe, tags: ['frontend', 'npm', 'yarn', 'pnpm', 'nvm', 'fnm', 'bun'], description: 'npm、yarn、pnpm、NVM、fnm、Bun' },
  { id: 'python', name: 'Python / AI', icon: Code2, tags: ['python', 'pip', 'conda', 'uv', 'pyenv', 'ai', 'poetry'], description: 'pip、conda、uv、pyenv、HuggingFace' },
  { id: 'rust', name: 'Rust 开发', icon: Cog, tags: ['rust', 'cargo', 'rustup'], description: 'Cargo、rustup 工具链和缓存' },
  { id: 'go', name: 'Go 开发', icon: Zap, tags: ['go'], description: 'Go 模块缓存、构建缓存' },
  { id: 'java', name: 'Java / JDK', icon: Coffee, tags: ['java', 'sdkman', 'gradle'], description: 'SDKMAN、Gradle JDK、Maven' },
  { id: 'ruby', name: 'Ruby 开发', icon: Gem, tags: ['ruby', 'gem', 'bundler', 'rvm', 'rbenv'], description: 'Gem、Bundler、RVM、rbenv' },
  { id: 'dotnet', name: '.NET 开发', icon: Brackets, tags: ['dotnet', 'nuget'], description: 'NuGet 包缓存、.NET SDK' },
  { id: 'flutter', name: 'Flutter / Dart', icon: Feather, tags: ['flutter', 'dart'], description: 'Flutter SDK、Dart 包缓存' },
  { id: 'jetbrains', name: 'JetBrains IDE', icon: Puzzle, tags: ['jetbrains'], description: 'IDEA/WebStorm/PyCharm 缓存和插件' },
  { id: 'homebrew', name: 'Homebrew', icon: Beer, tags: ['homebrew', 'cask'], description: '包缓存、Cask 下载、旧版本' },
]

export function DeveloperMode() {
  const { state, startScan } = useMagicBroom()
  const navigate = useNavigate()
  const hasData = state.status === 'complete'

  // 按 tag 分组统计
  function getEnvStats(tags: string[]) {
    if (!hasData) return { total: 0, count: 0 }
    const items = state.results.filter((r) => r.exists && r.tags.some((t) => tags.includes(t)))
    return {
      total: items.reduce((sum, r) => sum + r.size, 0),
      count: items.length,
    }
  }

  const totalReleasable = hasData ? state.totalBytes : 0

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">开发者模式</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">智能识别开发环境，按环境深度治理磁盘空间</p>
        </div>
        {!hasData && (
          <button
            onClick={() => { startScan('developer'); navigate('/') }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white rounded-xl text-[12px] font-medium shadow-[0_2px_8px_rgba(107,127,237,0.3)] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            扫描开发环境
          </button>
        )}
      </div>

      {/* Summary */}
      {hasData && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">已识别环境</div>
            <div className="text-[28px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">
              {environments.filter((e) => getEnvStats(e.tags).count > 0).length}
            </div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">可释放空间</div>
            <div className="text-[28px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-[-0.02em]">{formatSize(totalReleasable)}</div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">清理项目</div>
            <div className="text-[28px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">
              {state.results.filter((r) => r.exists).length}
            </div>
          </div>
        </div>
      )}

      {/* Environment cards */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">开发环境</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {environments.map((env) => {
            const stats = getEnvStats(env.tags)
            const Icon = env.icon
            const detected = hasData && stats.count > 0
            const canNavigate = detected

            const card = (
              <div
                className={`border rounded-2xl p-5 transition-all duration-200 group ${
                  canNavigate
                    ? 'border-gray-100/80 dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.04] hover:border-[#6B7FED]/30 hover:shadow-[0_4px_16px_rgba(107,127,237,0.08)] cursor-pointer'
                    : 'border-gray-100/60 dark:border-white/[0.05] bg-gray-50/30 dark:bg-white/[0.02] opacity-70 cursor-default'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${canNavigate ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-[#6B7FED]/20 dark:to-[#5468E8]/10' : 'bg-gray-100/60 dark:bg-white/[0.06]'}`}>
                      <Icon className={`w-5 h-5 ${canNavigate ? 'text-[#6B7FED]' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className={`text-[15px] font-semibold mb-0.5 transition-colors ${canNavigate ? 'text-gray-900 dark:text-gray-100 group-hover:text-[#6B7FED]' : 'text-gray-500 dark:text-gray-500'}`}>
                        {env.name}
                      </h3>
                      <p className="text-[11px] text-gray-400">{env.description}</p>
                    </div>
                  </div>
                  {canNavigate && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-[#6B7FED] transition-colors mt-1" />}
                </div>

                {detected ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50/60 dark:bg-white/[0.04] rounded-xl">
                      <div className="text-[11px] text-gray-400 mb-0.5">可释放</div>
                      <div className="text-[18px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatSize(stats.total)}</div>
                    </div>
                    <div className="p-3 bg-gray-50/60 dark:bg-white/[0.04] rounded-xl">
                      <div className="text-[11px] text-gray-400 mb-0.5">项目数</div>
                      <div className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{stats.count}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50/40 dark:bg-white/[0.03] rounded-xl text-center">
                    <p className="text-[12px] text-gray-400">{hasData ? '未检测到此环境' : '请先扫描开发环境'}</p>
                  </div>
                )}
              </div>
            )

            return canNavigate ? (
              <Link key={env.id} to={`/environment/${env.id}`}>{card}</Link>
            ) : (
              <div key={env.id}>{card}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
