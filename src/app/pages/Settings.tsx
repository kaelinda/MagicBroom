import { useState } from 'react'
import {
  Settings as SettingsIcon, HardDrive, Bell, Palette, Info,
  Trash2, RotateCcw, FolderOpen, XCircle, ExternalLink, Sun,
} from 'lucide-react'

const cardClass =
  'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]'

type SettingsTab = 'general' | 'scan' | 'notification' | 'about'

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-[42px] h-[25px] rounded-full transition-colors duration-200 ${enabled ? 'bg-[#6B7FED]' : 'bg-gray-300'}`}
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
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100/60 last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <div className="text-[13px] text-gray-800">{label}</div>
        {desc && <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${cardClass} mb-4`}>
      <div className="px-5 py-3.5 border-b border-gray-100/80">
        <h3 className="text-[13px] font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
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
  const [excluded, setExcluded] = useState(['~/Documents/重要项目', '~/Pictures', '/Applications'])
  const [notifyComplete, setNotifyComplete] = useState(true)
  const [notifyLowSpace, setNotifyLowSpace] = useState(true)
  const [notifyScheduled, setNotifyScheduled] = useState(true)

  const selectClass =
    'px-3 py-[7px] rounded-lg border border-gray-200/60 text-[12px] text-gray-800 bg-white/60 focus:outline-none focus:border-[#6B7FED] focus:ring-2 focus:ring-[#6B7FED]/10 transition-all'

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em] mb-1">设置</h1>
        <p className="text-[13px] text-gray-500">管理应用偏好和个性化配置</p>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
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
                      : 'text-gray-500 hover:text-gray-700 hover:bg-black/[0.03]'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ strokeWidth: isActive ? 2.2 : 1.8 }} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <>
              <SectionCard title="启动与运行">
                <SettingRow label="开机自动启动" desc="登录 macOS 后自动启动">
                  <Toggle enabled={autoStart} onChange={() => setAutoStart(!autoStart)} />
                </SettingRow>
                <SettingRow label="关闭时最小化到托盘" desc="点击关闭按钮时保留在菜单栏">
                  <Toggle enabled={minimizeToTray} onChange={() => setMinimizeToTray(!minimizeToTray)} />
                </SettingRow>
                <SettingRow label="自动检查更新" desc="有新版本时自动提示">
                  <Toggle enabled={autoUpdate} onChange={() => setAutoUpdate(!autoUpdate)} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="数据管理">
                <SettingRow label="清除应用缓存" desc="不影响扫描结果">
                  <button className="px-3.5 py-[7px] rounded-lg border border-gray-200/60 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                    <Trash2 className="w-3 h-3" />
                    清除
                  </button>
                </SettingRow>
                <SettingRow label="重置所有设置" desc="恢复默认值">
                  <button className="px-3.5 py-[7px] rounded-lg border border-red-200/60 text-[12px] text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5">
                    <RotateCcw className="w-3 h-3" />
                    重置
                  </button>
                </SettingRow>
              </SectionCard>
            </>
          )}

          {activeTab === 'scan' && (
            <>
              <SectionCard title="扫描偏好">
                <SettingRow label="跳过系统关键文件" desc="自动排除 macOS 系统核心文件">
                  <Toggle enabled={skipSystemFiles} onChange={() => setSkipSystemFiles(!skipSystemFiles)} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="清理行为">
                <SettingRow label="删除前确认" desc="执行清理前弹出确认对话框">
                  <Toggle enabled={confirmBeforeDelete} onChange={() => setConfirmBeforeDelete(!confirmBeforeDelete)} />
                </SettingRow>
                <SettingRow label="移到废纸篓而非永久删除" desc="清理的文件先移入废纸篓">
                  <Toggle enabled={moveToTrash} onChange={() => setMoveToTrash(!moveToTrash)} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="排除目录">
                <div className="py-4">
                  <p className="text-[11px] text-gray-400 mb-3">以下目录将不会被扫描和清理</p>
                  <div className="space-y-1.5 mb-3">
                    {excluded.map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-gray-50/60 rounded-xl border border-gray-100/60">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[12px] text-gray-600 font-mono">{p}</span>
                        </div>
                        <button onClick={() => setExcluded((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 transition-colors">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setExcluded((p) => [...p, '~/new-folder'])}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300/60 text-[12px] text-gray-400 hover:border-[#6B7FED] hover:text-[#6B7FED] transition-colors w-full justify-center"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    添加排除目录
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === 'notification' && (
            <SectionCard title="通知偏好">
              <SettingRow label="扫描完成通知" desc="扫描完成后发送系统通知">
                <Toggle enabled={notifyComplete} onChange={() => setNotifyComplete(!notifyComplete)} />
              </SettingRow>
              <SettingRow label="磁盘空间不足警告" desc="可用空间低于阈值时警告">
                <Toggle enabled={notifyLowSpace} onChange={() => setNotifyLowSpace(!notifyLowSpace)} />
              </SettingRow>
              <SettingRow label="定时任务执行通知" desc="定时任务结果通知">
                <Toggle enabled={notifyScheduled} onChange={() => setNotifyScheduled(!notifyScheduled)} />
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
                    <div className="text-[17px] font-semibold text-gray-900 mb-0.5">MagicBroom</div>
                    <div className="text-[12px] text-gray-400 mb-2">专业的磁盘空间治理工具</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[#6B7FED]/10 text-[#6B7FED] rounded-lg text-[11px] font-medium">v0.1.0</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="许可与支持">
                <SettingRow label="使用许可">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-medium border border-emerald-200/60">
                    开源版
                  </span>
                </SettingRow>
                {['查看更新日志', '发送反馈', '帮助文档'].map((item) => (
                  <SettingRow key={item} label={item}>
                    <button className="flex items-center gap-1 text-[12px] text-[#6B7FED] hover:text-[#5468E8] transition-colors">
                      打开
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </SettingRow>
                ))}
              </SectionCard>
              <div className="text-center text-[11px] text-gray-400 mt-5">
                © 2026 MagicBroom · MIT License
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
