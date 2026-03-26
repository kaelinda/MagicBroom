import { Smartphone, Container, Globe, Code2, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMagicBroom } from '../hooks/useMagicBroom'

const cardClass =
  'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

const environments = [
  { id: 'ios', name: 'iOS 开发', icon: Smartphone, tags: ['ios', 'xcode'], description: 'Xcode、模拟器、构建缓存' },
  { id: 'docker', name: 'Docker 容器', icon: Container, tags: ['docker'], description: '镜像、容器、构建缓存' },
  { id: 'frontend', name: '前端 Node', icon: Globe, tags: ['frontend', 'npm', 'yarn', 'pnpm'], description: 'npm、yarn、pnpm 缓存' },
  { id: 'python', name: 'Python / AI', icon: Code2, tags: ['python', 'pip', 'conda'], description: 'pip、conda、虚拟环境' },
]

export function DeveloperMode() {
  const { state, startScan } = useMagicBroom()
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
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em] mb-1">开发者模式</h1>
          <p className="text-[13px] text-gray-500">智能识别开发环境，按环境深度治理磁盘空间</p>
        </div>
        {!hasData && (
          <button
            onClick={() => startScan('developer')}
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
            <div className="text-[28px] font-semibold text-gray-900 tracking-[-0.02em]">
              {environments.filter((e) => getEnvStats(e.tags).count > 0).length}
            </div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">可释放空间</div>
            <div className="text-[28px] font-semibold text-emerald-600 tracking-[-0.02em]">{formatSize(totalReleasable)}</div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">清理项目</div>
            <div className="text-[28px] font-semibold text-gray-900 tracking-[-0.02em]">
              {state.results.filter((r) => r.exists).length}
            </div>
          </div>
        </div>
      )}

      {/* Environment cards */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold text-gray-900">开发环境</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {environments.map((env) => {
            const stats = getEnvStats(env.tags)
            const Icon = env.icon
            const detected = hasData && stats.count > 0

            return (
              <Link
                key={env.id}
                to={`/environment/${env.id}`}
                className="border border-gray-100/80 rounded-2xl p-5 hover:border-[#6B7FED]/30 hover:shadow-[0_4px_16px_rgba(107,127,237,0.08)] transition-all duration-200 group bg-white/40"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#6B7FED]" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5 group-hover:text-[#6B7FED] transition-colors">
                        {env.name}
                      </h3>
                      <p className="text-[11px] text-gray-400">{env.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#6B7FED] transition-colors mt-1" />
                </div>

                {detected ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50/60 rounded-xl">
                      <div className="text-[11px] text-gray-400 mb-0.5">可释放</div>
                      <div className="text-[18px] font-semibold text-emerald-600 tabular-nums">{formatSize(stats.total)}</div>
                    </div>
                    <div className="p-3 bg-gray-50/60 rounded-xl">
                      <div className="text-[11px] text-gray-400 mb-0.5">项目数</div>
                      <div className="text-[18px] font-semibold text-gray-900 tabular-nums">{stats.count}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50/40 rounded-xl text-center">
                    <p className="text-[12px] text-gray-400">{hasData ? '未检测到此环境' : '扫描后显示数据'}</p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
