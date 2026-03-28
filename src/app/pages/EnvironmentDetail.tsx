import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, AlertCircle, FolderOpen, ArrowUpDown, Terminal } from 'lucide-react'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { useToast } from '../context/ToastContext'
import { RiskBadge } from '../components/RiskBadge'
import { CleanConfirmDialog } from '../components/CleanConfirmDialog'
import { CelebrationScreen } from '../components/CelebrationScreen'
import { cardClass } from '../styles'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

const envConfig: Record<string, { name: string; tags: string[]; description: string }> = {
  ios: { name: 'iOS 开发环境', tags: ['ios', 'xcode', 'cocoapods', 'carthage', 'swift', 'simulator', 'preview-cache', 'playground'], description: 'Xcode、模拟器、SPM、CocoaPods、Carthage 缓存' },
  android: { name: 'Android 开发环境', tags: ['android', 'gradle', 'maven', 'android-studio', 'sdk', 'emulator', 'avd', 'ndk'], description: 'Gradle、Android SDK、AVD 模拟器、Maven 缓存' },
  docker: { name: 'Docker 容器环境', tags: ['docker', 'volumes', 'image-cache'], description: 'Docker 镜像、数据卷和构建缓存' },
  frontend: { name: '前端开发环境', tags: ['frontend', 'npm', 'yarn', 'pnpm', 'nvm', 'fnm', 'bun', 'playwright', 'browser-cache'], description: 'npm、yarn、pnpm、NVM、fnm、Bun、Playwright' },
  python: { name: 'Python / AI 环境', tags: ['python', 'pip', 'conda', 'uv', 'pyenv', 'ai', 'model-cache', 'poetry'], description: 'pip、conda、uv、pyenv、HuggingFace 模型缓存' },
  rust: { name: 'Rust 开发环境', tags: ['rust', 'cargo', 'rustup'], description: 'Cargo 注册表、rustup 工具链和下载缓存' },
  go: { name: 'Go 开发环境', tags: ['go', 'module-cache', 'build-cache', 'lint-cache'], description: 'Go 模块缓存、构建缓存、golangci-lint' },
  java: { name: 'Java / JDK 环境', tags: ['java', 'sdkman', 'gradle'], description: 'SDKMAN JDK 版本、Gradle JDK、Maven 仓库' },
  ruby: { name: 'Ruby 开发环境', tags: ['ruby', 'gem', 'bundler', 'rvm', 'rbenv'], description: 'Gem、Bundler、RVM、rbenv 缓存和版本' },
  dotnet: { name: '.NET 开发环境', tags: ['dotnet', 'nuget'], description: 'NuGet 包缓存、.NET SDK 运行时' },
  flutter: { name: 'Flutter / Dart 环境', tags: ['flutter', 'dart'], description: 'Flutter SDK 缓存、Dart 包缓存、分析服务器' },
  jetbrains: { name: 'JetBrains IDE', tags: ['jetbrains', 'ide-cache'], description: 'IDEA/WebStorm/PyCharm 缓存、插件、日志' },
  homebrew: { name: 'Homebrew', tags: ['homebrew', 'cask'], description: 'Homebrew 包缓存、Cask 下载和旧版本' },
}

export function EnvironmentDetail() {
  const { envId } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useMagicBroom()
  const { addToast } = useToast()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [cleanResult, setCleanResult] = useState<{ freed: number; count: number; failed: number } | null>(null)
  const [sortBy, setSortBy] = useState<'default' | 'risk' | 'size'>('default')

  const config = envConfig[envId || ''] || { name: '未知环境', tags: [], description: '' }
  const envItemsRaw = state.results.filter((r) => r.exists && r.tags.some((t) => config.tags.includes(t)))

  const riskOrder = { danger: 0, warning: 1, safe: 2 } as const
  const envItems = useMemo(() => {
    const items = [...envItemsRaw]
    if (sortBy === 'risk') items.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk])
    else if (sortBy === 'size') items.sort((a, b) => b.size - a.size)
    return items
  }, [envItemsRaw, sortBy])

  const totalSize = envItems.reduce((sum, r) => sum + r.size, 0)

  const toggleItem = (id: string) => {
    const next = new Set(selectedItems)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedItems(next)
  }

  const selectedSize = envItems.filter((i) => selectedItems.has(i.id)).reduce((sum, i) => sum + i.size, 0)

  if (cleanResult) {
    return (
      <CelebrationScreen
        freedBytes={cleanResult.freed}
        itemCount={cleanResult.count}
        failedCount={cleanResult.failed}
        onDone={() => {
          setCleanResult(null)
          dispatch({ type: 'RESET' })
          navigate('/')
        }}
      />
    )
  }

  const handleClean = async () => {
    setShowConfirm(false)
    const paths = envItems.filter((i) => selectedItems.has(i.id)).map((i) => i.path)
    try {
      const result = await window.api?.clean.execute(paths)
      if (result) {
        setCleanResult({ freed: result.freed, count: result.succeeded.length, failed: result.failed.length })
      }
    } catch (err) {
      addToast(`清理出错：${String(err)}`, 'error')
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Link
        to="/developer"
        className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回开发者模式
      </Link>

      {/* Header */}
      <div className={`${cardClass} p-6 mb-5`}>
        <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">{config.name}</h1>
        <p className="text-[13px] text-gray-400 mb-4">{config.description}</p>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">总占用空间</div>
            <div className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">{formatSize(totalSize)}</div>
          </div>
          <div className="w-px h-10 bg-gray-100 dark:bg-white/[0.08]" />
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">清理项目</div>
            <div className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">{envItems.length}</div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className={`${cardClass} p-4 mb-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5 text-[12px] text-gray-500 dark:text-gray-400">
            <span>
              已选择 <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedItems.size}</span> / {envItems.length} 项
            </span>
            <span>
              可清理 <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatSize(selectedSize)}</span>
            </span>
            <button
              onClick={() => setSelectedItems(new Set(envItems.map((i) => i.id)))}
              className="text-[#6B7FED] hover:text-[#5468E8] font-medium transition-colors"
            >
              全选
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors"
            >
              取消全选
            </button>
          </div>
          <button
            disabled={selectedItems.size === 0}
            data-clean-trigger
            onClick={() => setShowConfirm(true)}
            className="h-[36px] px-4 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center gap-2 text-[12px] font-medium shadow-[0_2px_6px_rgba(16,185,129,0.3)] disabled:from-gray-200 disabled:to-gray-200 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            清理该环境
          </button>
        </div>
      </div>

      {/* Items */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="p-4 border-b border-gray-100/80 dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">可清理项目</h2>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            {(['default', 'risk', 'size'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortBy(mode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  sortBy === mode
                    ? 'bg-[#6B7FED]/10 text-[#6B7FED]'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                }`}
              >
                {{ default: '默认', risk: '按风险', size: '按大小' }[mode]}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">
          {envItems.map((item) => (
            <div key={item.id} className="p-5 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.06] transition-colors duration-150">
              <div className="flex items-start gap-4">
                <label className="mt-1 relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="peer sr-only"
                  />
                  <div className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-gray-300 dark:border-gray-600 peer-checked:border-[#6B7FED] peer-checked:bg-[#6B7FED] flex items-center justify-center transition-all">
                    {selectedItems.has(item.id) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                    <RiskBadge level={item.risk} />
                    <div className="ml-auto text-[16px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatSize(item.size)}</div>
                  </div>
                  <div className="flex items-center gap-2 mb-2 min-w-0">
                    <span className="text-[12px] font-mono text-gray-400 truncate flex-1 min-w-0">{item.path}</span>
                    <button
                      onClick={() => window.api?.shell.showInFinder(item.path)}
                      className="ml-auto flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50/80 dark:bg-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-[10px] text-gray-500 dark:text-gray-400 hover:text-[#6B7FED] transition-colors border border-gray-100/60 dark:border-white/[0.08]"
                    >
                      <FolderOpen className="w-3 h-3" />
                      在 Finder 中显示
                    </button>
                  </div>
                  {item.clean_command && (
                    <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-emerald-50/60 dark:bg-emerald-500/[0.08] border border-emerald-100/60 dark:border-emerald-500/20 rounded-xl">
                      <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <code className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono flex-1 truncate">{item.clean_command}</code>
                      <button
                        onClick={async () => {
                          addToast(`正在执行 ${item.clean_command}...`, 'info')
                          const res = await window.api?.clean.runCommand(item.clean_command!)
                          if (res?.success) {
                            addToast(`命令执行成功`, 'success')
                          } else {
                            addToast(`命令失败：${res?.output || '未知错误'}`, 'error')
                          }
                        }}
                        className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-medium transition-colors"
                      >
                        运行命令
                      </button>
                    </div>
                  )}
                  <div className="bg-amber-50/50 dark:bg-amber-500/[0.08] border border-amber-100/60 dark:border-amber-500/20 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 mb-0.5">删除影响</div>
                        <div className="text-[12px] text-amber-700 dark:text-amber-300/80 leading-relaxed">{item.impact}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {envItems.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-[13px] text-gray-400">未检测到此环境的可清理项目</p>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <CleanConfirmDialog
          items={envItems.filter((i) => selectedItems.has(i.id))}
          totalSize={selectedSize}
          onConfirm={handleClean}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
