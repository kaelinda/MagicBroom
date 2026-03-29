import { useState, useEffect, useCallback } from 'react'
import {
  Settings as SettingsIcon, HardDrive, Bell, Info,
  Trash2, RotateCcw, FolderOpen, XCircle, ExternalLink, Plus, Shield,
  Sun, Moon, Monitor,
} from 'lucide-react'
import { cardClass } from '../styles'

type SettingsTab = 'general' | 'scan' | 'notification' | 'about'

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-[42px] h-[25px] rounded-full transition-colors duration-200 ${enabled ? 'bg-[#6B7FED]' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <div
        className={`absolute top-[2.5px] w-[20px] h-[20px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform duration-200 ${
          enabled ? 'translate-x-[19px]' : 'translate-x-[2.5px]'
        }`}
      />
    </button>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100/60 dark:border-white/[0.06] last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <div className="text-[13px] text-gray-800 dark:text-gray-200">{label}</div>
        {desc && <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${cardClass} mb-4`}>
      <div className="px-5 py-3.5 border-b border-gray-100/80 dark:border-white/[0.06]">
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

function PresetTag({ path, excluded, onAdd }: { path: string; excluded: string[]; onAdd: (p: string) => void }) {
  const added = excluded.includes(path)
  return (
    <button
      disabled={added}
      onClick={() => !added && onAdd(path)}
      className={`px-2.5 py-1 rounded-lg text-[10px] transition-colors ${
        added
          ? 'bg-gray-100/40 dark:bg-white/[0.04] text-gray-300 dark:text-gray-600 cursor-not-allowed'
          : 'bg-gray-50/60 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-[#6B7FED]/10 hover:text-[#6B7FED] border border-gray-100/60 dark:border-white/[0.08]'
      }`}
    >
      {added ? '✓' : '+'} {path.replace(/^~\//, '').replace(/^~\/Library\/Application Support\//, '')}
    </button>
  )
}

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: '通用', icon: SettingsIcon },
  { id: 'scan', label: '扫描与清理', icon: HardDrive },
  { id: 'notification', label: '通知', icon: Bell },
  { id: 'about', label: '关于', icon: Info },
]

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [autoStart, setAutoStart] = useState(true)
  const [minimizeToTray, setMinimizeToTray] = useState(true)
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [skipSystemFiles, setSkipSystemFiles] = useState(true)
  const [confirmBeforeDelete, setConfirmBeforeDelete] = useState(true)
  const [moveToTrash, setMoveToTrash] = useState(true)
  const [excluded, setExcluded] = useState<string[]>([])
  const [notifyComplete, setNotifyComplete] = useState(true)
  const [notifyLowSpace, setNotifyLowSpace] = useState(true)
  const [notifyScheduled, setNotifyScheduled] = useState(true)
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')

  // 应用主题到 DOM
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'light') root.classList.add('light')
  }, [theme])

  useEffect(() => {
    window.api?.settings.get().then((s: any) => {
      if (s) {
        setAutoStart(s.autoStart ?? true)
        setMinimizeToTray(s.minimizeToTray ?? true)
        setAutoUpdate(s.autoUpdate ?? true)
        setSkipSystemFiles(s.skipSystemFiles ?? true)
        setConfirmBeforeDelete(s.confirmBeforeDelete ?? true)
        setMoveToTrash(s.moveToTrash ?? true)
        setExcluded(s.excludedPaths ?? [])
        setNotifyComplete(s.notifyComplete ?? true)
        setNotifyLowSpace(s.notifyLowSpace ?? true)
        setNotifyScheduled(s.notifyScheduled ?? true)
        if (s.theme) setTheme(s.theme)
      }
    }).catch(() => {})
  }, [])

  const persist = useCallback((key: string, value: unknown) => {
    window.api?.settings.update({ [key]: value })
  }, [])

  const updateExcluded = useCallback((updater: (prev: string[]) => string[]) => {
    setExcluded((prev) => {
      const next = updater(prev)
      window.api?.settings.update({ excludedPaths: next })
      return next
    })
  }, [])

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">设置</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">管理应用偏好和个性化配置</p>
      </div>

      <div className="flex gap-6">
        <div className="w-[190px] flex-shrink-0">
          <div className={`${cardClass} p-2`}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] transition-all duration-200 mb-0.5 last:mb-0 ${
                    isActive
                      ? 'bg-[#6B7FED] text-white font-medium shadow-[0_2px_8px_rgba(107,127,237,0.3)]'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ strokeWidth: isActive ? 2.2 : 1.8 }} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <>
              <SectionCard title="外观">
                <SettingRow label="主题模式" desc="切换浅色、暗色或跟随系统">
                  <div className="flex gap-1">
                    {([
                      { id: 'system' as const, icon: Monitor, label: '跟随系统' },
                      { id: 'light' as const, icon: Sun, label: '浅色' },
                      { id: 'dark' as const, icon: Moon, label: '暗色' },
                    ]).map((opt) => {
                      const Icon = opt.icon
                      const active = theme === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => { setTheme(opt.id); persist('theme', opt.id) }}
                          className={`flex items-center gap-1.5 px-3 py-[6px] rounded-lg text-[11px] font-medium transition-all ${
                            active
                              ? 'bg-[#6B7FED] text-white shadow-[0_1px_4px_rgba(107,127,237,0.3)]'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/[0.06] border border-gray-200/60 dark:border-white/[0.1]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </SettingRow>
              </SectionCard>
              <SectionCard title="启动与运行">
                <SettingRow label="开机自动启动" desc="登录 macOS 后自动启动">
                  <Toggle enabled={autoStart} onChange={() => { setAutoStart(!autoStart); persist('autoStart', !autoStart) }} />
                </SettingRow>
                <SettingRow label="自动检查更新" desc="有新版本时自动提示">
                  <Toggle enabled={autoUpdate} onChange={() => { setAutoUpdate(!autoUpdate); persist('autoUpdate', !autoUpdate) }} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="状态栏托盘">
                <SettingRow label="关闭时最小化到托盘" desc="点击关闭按钮时隐藏到菜单栏，而不是退出应用">
                  <Toggle enabled={minimizeToTray} onChange={() => { const n = !minimizeToTray; setMinimizeToTray(n); window.api?.tray.updateConfig({ minimizeToTray: n }) }} />
                </SettingRow>
                <SettingRow label="托盘图标" desc="在 macOS 菜单栏显示 MagicBroom 图标">
                  <span className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 bg-emerald-50 dark:bg-emerald-500/[0.1] rounded-lg border border-emerald-200/60 dark:border-emerald-500/20">已启用</span>
                </SettingRow>
                <SettingRow label="托盘菜单" desc="右键托盘图标可快速扫描、打开设置或退出">
                  <span className="text-[11px] text-gray-400">右键点击托盘图标</span>
                </SettingRow>
              </SectionCard>
              <SectionCard title="数据管理">
                <SettingRow label="清除应用缓存" desc="不影响扫描结果">
                  <button className="px-3.5 py-[7px] rounded-lg border border-gray-200/60 dark:border-white/[0.1] text-[12px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5">
                    <Trash2 className="w-3 h-3" />清除
                  </button>
                </SettingRow>
                <SettingRow label="重置所有设置" desc="恢复默认值">
                  <button className="px-3.5 py-[7px] rounded-lg border border-red-200/60 dark:border-red-500/20 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/[0.08] transition-colors flex items-center gap-1.5">
                    <RotateCcw className="w-3 h-3" />重置
                  </button>
                </SettingRow>
              </SectionCard>
            </>
          )}

          {activeTab === 'scan' && (
            <>
              <SectionCard title="扫描偏好">
                <SettingRow label="跳过系统关键文件" desc="自动排除 macOS 系统核心文件">
                  <Toggle enabled={skipSystemFiles} onChange={() => { setSkipSystemFiles(!skipSystemFiles); persist('skipSystemFiles', !skipSystemFiles) }} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="清理行为">
                <SettingRow label="删除前确认" desc="执行清理前弹出确认对话框">
                  <Toggle enabled={confirmBeforeDelete} onChange={() => { setConfirmBeforeDelete(!confirmBeforeDelete); persist('confirmBeforeDelete', !confirmBeforeDelete) }} />
                </SettingRow>
                <SettingRow label="移到废纸篓而非永久删除" desc="清理的文件先移入废纸篓">
                  <Toggle enabled={moveToTrash} onChange={() => { setMoveToTrash(!moveToTrash); persist('moveToTrash', !moveToTrash) }} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="排除目录">
                <div className="py-4">
                  <div className="flex items-start gap-2 p-3 bg-blue-50/60 dark:bg-blue-500/[0.08] rounded-xl border border-blue-100/40 dark:border-blue-500/20 mb-4">
                    <Shield className="w-4 h-4 text-[#6B7FED] mt-0.5 flex-shrink-0" />
                    <p className="text-[12px] text-blue-700 dark:text-blue-300 leading-relaxed">以下目录将不会被扫描和清理。默认已保护用户文档、桌面、图片等重要目录。</p>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {excluded.map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-gray-50/60 dark:bg-white/[0.04] rounded-xl border border-gray-100/60 dark:border-white/[0.08] group">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[12px] text-gray-600 dark:text-gray-300 font-mono">{p}</span>
                        </div>
                        <button onClick={() => updateExcluded((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 hover:!text-red-500 transition-colors" title="移除排除">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { const path = await window.api?.shell.selectDirectory(); if (path && !excluded.includes(path)) updateExcluded((prev) => [...prev, path]) }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300/60 dark:border-white/[0.15] text-[12px] text-gray-500 dark:text-gray-400 hover:border-[#6B7FED] hover:text-[#6B7FED] transition-colors">
                      <FolderOpen className="w-3.5 h-3.5" />浏览选择目录
                    </button>
                    <button onClick={() => { const presets = ['~/Projects','~/Code','~/Work','~/.config','~/Library/Keychains','~/.claude','~/.cursor','~/.codex','~/.github-copilot','~/.continue','~/.vscode','~/.zed']; const a = presets.filter((p) => !excluded.includes(p)); if (a.length > 0) updateExcluded((prev) => [...prev, a[0]]) }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200/60 dark:border-white/[0.1] text-[12px] text-gray-500 dark:text-gray-400 hover:text-[#6B7FED] hover:border-[#6B7FED]/30 transition-colors">
                      <Plus className="w-3.5 h-3.5" />快速添加
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">工作目录</div>
                      <div className="flex flex-wrap gap-1.5">
                        {['~/Projects', '~/Code', '~/Work', '~/.config', '~/Library/Keychains'].map((preset) => (
                          <PresetTag key={preset} path={preset} excluded={excluded} onAdd={(p) => updateExcluded((prev) => [...prev, p])} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">AI 编程工具</div>
                      <div className="flex flex-wrap gap-1.5">
                        {['~/.claude','~/.cursor','~/.codex','~/.github-copilot','~/.continue','~/.codeium','~/.tabnine'].map((preset) => (
                          <PresetTag key={preset} path={preset} excluded={excluded} onAdd={(p) => updateExcluded((prev) => [...prev, p])} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">编辑器 / IDE</div>
                      <div className="flex flex-wrap gap-1.5">
                        {['~/.vscode','~/.zed','~/Library/Application Support/JetBrains'].map((preset) => (
                          <PresetTag key={preset} path={preset} excluded={excluded} onAdd={(p) => updateExcluded((prev) => [...prev, p])} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === 'notification' && (
            <SectionCard title="通知偏好">
              <SettingRow label="扫描完成通知" desc="扫描完成后发送系统通知">
                <Toggle enabled={notifyComplete} onChange={() => { setNotifyComplete(!notifyComplete); persist('notifyComplete', !notifyComplete) }} />
              </SettingRow>
              <SettingRow label="磁盘空间不足警告" desc="可用空间低于阈值时警告">
                <Toggle enabled={notifyLowSpace} onChange={() => { setNotifyLowSpace(!notifyLowSpace); persist('notifyLowSpace', !notifyLowSpace) }} />
              </SettingRow>
              <SettingRow label="定时任务执行通知" desc="定时任务结果通知">
                <Toggle enabled={notifyScheduled} onChange={() => { setNotifyScheduled(!notifyScheduled); persist('notifyScheduled', !notifyScheduled) }} />
              </SettingRow>
            </SectionCard>
          )}

          {activeTab === 'about' && (
            <>
              <SectionCard title="应用信息">
                <div className="py-5 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#6B7FED] to-[#5468E8] rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(107,127,237,0.3)]">
                    <HardDrive className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-0.5">MagicBroom</div>
                    <div className="text-[12px] text-gray-400 mb-2">专业的磁盘空间治理工具</div>
                    <span className="px-2 py-1 bg-[#6B7FED]/10 text-[#6B7FED] rounded-lg text-[11px] font-medium">v0.5.0</span>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="许可与支持">
                <SettingRow label="使用许可">
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-400 rounded-lg text-[11px] font-medium border border-emerald-200/60 dark:border-emerald-500/20">开源版</span>
                </SettingRow>
                {['查看更新日志', '发送反馈', '帮助文档'].map((item) => (
                  <SettingRow key={item} label={item}>
                    <button className="flex items-center gap-1 text-[12px] text-[#6B7FED] hover:text-[#5468E8] transition-colors">打开<ExternalLink className="w-3 h-3" /></button>
                  </SettingRow>
                ))}
              </SectionCard>
              <div className="text-center text-[11px] text-gray-400 mt-5">© 2026 MagicBroom · MIT License</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
