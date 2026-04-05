import { useEffect, useMemo, useState } from 'react'
import { Clock3, LoaderCircle, Play, Bell, ShieldCheck, TerminalSquare, ChevronDown, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cardClass } from '../styles'
import { useToast } from '../context/ToastContext'
import { formatSize } from '../utils'
import {
  buildUpdatedSchedule,
  HOUR_OPTIONS,
  resolveMinuteDraft,
  WEEKDAY_OPTIONS,
} from './scheduled-task-form'

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

function formatWeekday(weekday: number): string {
  return WEEKDAY_OPTIONS.find((option) => option.value === weekday)?.label ?? '未知'
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: ScheduledTaskLog['status']): string {
  return {
    success: '成功',
    partial: '部分完成',
    failed: '失败',
  }[status]
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: number
  options: Array<{ value: number; label: string }>
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <label className="block min-w-0">
      <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.02] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</div>
        <div className="relative">
          <select
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full h-[54px] appearance-none rounded-[18px] border border-white/[0.08] dark:border-white/[0.08] bg-black/[0.12] dark:bg-black/[0.18] px-4 pr-11 text-[18px] font-semibold font-mono tracking-[0.08em] text-gray-900 dark:text-gray-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
    </label>
  )
}

function MinuteInput({
  value,
  disabled,
  onChange,
}: {
  value: number
  disabled?: boolean
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value).padStart(2, '0'))

  useEffect(() => {
    setDraft(String(value).padStart(2, '0'))
  }, [value])

  function commit(nextDraft: string) {
    const nextMinute = resolveMinuteDraft(nextDraft, value)
    setDraft(String(nextMinute).padStart(2, '0'))
    if (nextMinute !== value) onChange(nextMinute)
  }

  return (
    <div className="min-w-0">
      <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.02] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">分钟</div>
          <div className="text-[11px] text-gray-500 dark:text-gray-500">支持输入 0-59</div>
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            disabled={disabled}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d]/g, '').slice(0, 2)
              setDraft(raw)
            }}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commit((event.target as HTMLInputElement).value)
              }
            }}
            className="w-full h-[54px] rounded-[18px] border border-white/[0.08] dark:border-white/[0.08] bg-black/[0.12] dark:bg-black/[0.18] px-4 text-[18px] font-semibold font-mono tracking-[0.08em] text-gray-900 dark:text-gray-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}

function SchedulePicker({
  task,
  busy,
  onScheduleChange,
}: {
  task: ScheduledTaskView
  busy: boolean
  onScheduleChange: (patch: Partial<ScheduledTaskView['schedule']>) => void
}) {
  return (
    <div className="mt-4 rounded-[30px] border border-white/[0.08] dark:border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] dark:bg-[radial-gradient(circle_at_top_right,rgba(107,127,237,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 dark:text-gray-200">
          <CalendarDays className="w-4 h-4 text-[#6B7FED]" />
          计划执行时间
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white/[0.04] text-[#98A6FF] text-[12px] font-medium border border-white/[0.08] dark:border-[#6B7FED]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          每{formatWeekday(task.schedule.weekday)} {formatTime(task.schedule.hour, task.schedule.minute)}
        </div>
      </div>

      <div className="rounded-[24px] bg-black/[0.08] dark:bg-black/[0.14] border border-white/[0.04] p-2 mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_OPTIONS.map((option) => {
            const active = task.schedule.weekday === option.value
            return (
              <button
                key={option.value}
                type="button"
                disabled={busy}
                onClick={() => onScheduleChange({ weekday: option.value })}
                className={`w-full min-w-0 h-[44px] px-0 rounded-[14px] text-[13px] font-medium transition-all border ${
                  active
                    ? 'bg-[#6B7FED] text-white border-[#6B7FED] shadow-[0_10px_24px_rgba(107,127,237,0.24)]'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent hover:bg-white/[0.04] hover:text-[#A4B0FF]'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-[160px_28px_minmax(0,1fr)] items-start gap-4 max-[880px]:grid-cols-1">
        <SelectField
          label="小时"
          value={task.schedule.hour}
          options={HOUR_OPTIONS}
          onChange={(hour) => onScheduleChange({ hour })}
          disabled={busy}
        />
        <div className="flex items-center justify-center pt-11 text-[22px] font-semibold text-gray-500/50 max-[880px]:hidden">:</div>
        <div className="min-w-0">
          <MinuteInput
            value={task.schedule.minute}
            onChange={(minute) => onScheduleChange({ minute })}
            disabled={busy}
          />
        </div>
      </div>
    </div>
  )
}

export function ScheduledTasks() {
  const { addToast } = useToast()
  const [tasks, setTasks] = useState<ScheduledTaskView[]>([])
  const [logs, setLogs] = useState<ScheduledTaskLog[]>([])
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifyScheduled, setNotifyScheduled] = useState(true)

  const groupedLogs = useMemo(() => logs.slice(0, 12), [logs])

  async function reload() {
    setLoading(true)
    try {
      const [nextTasks, nextLogs, settings] = await Promise.all([
        window.api?.schedule.list() ?? Promise.resolve([]),
        window.api?.schedule.logs() ?? Promise.resolve([]),
        window.api?.settings.get() ?? Promise.resolve({}),
      ])

      setTasks(nextTasks)
      setLogs(nextLogs)
      setNotifyScheduled((settings.notifyScheduled as boolean | undefined) ?? true)
    } catch (error) {
      addToast(`加载定时任务失败：${String(error)}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleToggle(task: ScheduledTaskView) {
    setBusyTaskId(task.id)
    try {
      const nextTasks = await window.api?.schedule.toggle(task.id, !task.enabled)
      if (nextTasks) setTasks(nextTasks)
      const nextLogs = await window.api?.schedule.logs()
      if (nextLogs) setLogs(nextLogs)
    } catch (error) {
      addToast(`切换任务失败：${String(error)}`, 'error')
    } finally {
      setBusyTaskId(null)
    }
  }

  async function handleScheduleChange(
    task: ScheduledTaskView,
    patch: Partial<ScheduledTaskView['schedule']>,
  ) {
    setBusyTaskId(task.id)
    try {
      const nextTasks = await window.api?.schedule.update(task.id, {
        schedule: buildUpdatedSchedule(task.schedule, patch),
      })
      if (nextTasks) setTasks(nextTasks)
    } catch (error) {
      addToast(`更新计划失败：${String(error)}`, 'error')
    } finally {
      setBusyTaskId(null)
    }
  }

  async function handleNotifyToggle(task: ScheduledTaskView) {
    setBusyTaskId(task.id)
    try {
      const nextTasks = await window.api?.schedule.update(task.id, {
        notify: !task.notify,
      })
      if (nextTasks) setTasks(nextTasks)
    } catch (error) {
      addToast(`更新通知偏好失败：${String(error)}`, 'error')
    } finally {
      setBusyTaskId(null)
    }
  }

  async function handleRunNow(task: ScheduledTaskView) {
    setBusyTaskId(task.id)
    addToast(`开始执行 ${task.name}`, 'info')
    try {
      const result = await window.api?.schedule.runNow(task.id)
      if (result) {
        setTasks(result.tasks)
        const nextLogs = await window.api?.schedule.logs()
        if (nextLogs) setLogs(nextLogs)
        addToast(`${task.name} 执行完成`, result.log.status === 'failed' ? 'warning' : 'success')
      }
    } catch (error) {
      addToast(`立即执行失败：${String(error)}`, 'error')
    } finally {
      setBusyTaskId(null)
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">定时任务</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">用 macOS 原生 launchd 定时扫描和安全清理，不常驻后台守护进程。</p>
      </div>

      {!notifyScheduled && (
        <div className={`${cardClass} p-4 mb-5 border-amber-200/70 dark:border-amber-500/20`}>
          <div className="flex items-start gap-3">
            <Bell className="w-4 h-4 text-amber-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100">全局定时任务通知已关闭</div>
              <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">
                任务仍会按计划执行，但不会发送系统通知。你可以去 <Link className="text-[#6B7FED] hover:text-[#5468E8]" to="/settings">设置 → 通知</Link> 重新开启。
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] gap-5 items-start">
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100/80 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">预设任务</h2>
              <p className="text-[12px] text-gray-400 mt-1">v1 只提供预设模板，可编辑执行时间和通知偏好。</p>
            </div>
            {loading && <LoaderCircle className="w-4 h-4 animate-spin text-gray-400" />}
          </div>

          <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">
            {tasks.map((task) => {
              const isBusy = busyTaskId === task.id
              return (
                <div key={task.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{task.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${task.action === 'safe-clean' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-500/[0.12] dark:text-blue-300'}`}>
                          {task.action === 'safe-clean' ? '安全清理' : '仅扫描'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${task.installed ? 'bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300' : 'bg-gray-50 text-gray-400 dark:bg-white/[0.04] dark:text-gray-500'}`}>
                          {task.installed ? '已安装 launchd' : '未安装'}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3">{task.description}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gray-50/80 dark:bg-white/[0.04] border border-gray-100/80 dark:border-white/[0.06] px-3 py-2.5">
                          <div className="text-[10px] uppercase tracking-[0.08em] text-gray-400 mb-1">执行计划</div>
                          <div className="text-[13px] text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Clock3 className="w-3.5 h-3.5 text-[#6B7FED]" />
                            {formatWeekday(task.schedule.weekday)} {formatTime(task.schedule.hour, task.schedule.minute)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-gray-50/80 dark:bg-white/[0.04] border border-gray-100/80 dark:border-white/[0.06] px-3 py-2.5">
                          <div className="text-[10px] uppercase tracking-[0.08em] text-gray-400 mb-1">最近执行</div>
                          <div className="text-[13px] text-gray-800 dark:text-gray-200">
                            {task.lastRun ? `${statusLabel(task.lastRun.status)} · ${formatDateTime(task.lastRun.finishedAt)}` : '尚未执行'}
                          </div>
                        </div>
                      </div>

                      <SchedulePicker
                        task={task}
                        busy={isBusy}
                        onScheduleChange={(patch) => handleScheduleChange(task, patch)}
                      />

                      <div className="mt-4 flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
                          <Bell className="w-3.5 h-3.5" />
                          任务通知
                          <Toggle enabled={task.notify} onChange={() => handleNotifyToggle(task)} />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <Toggle enabled={task.enabled} onChange={() => handleToggle(task)} />
                      <button
                        onClick={() => handleRunNow(task)}
                        disabled={isBusy}
                        className="h-[36px] px-4 rounded-xl bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white text-[12px] font-medium shadow-[0_2px_8px_rgba(107,127,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isBusy ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        立即执行
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100/80 dark:border-white/[0.06]">
            <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">最近日志</h2>
            <p className="text-[12px] text-gray-400 mt-1">保留最近 50 次执行记录，便于排查 launchd 和清理结果。</p>
          </div>

          {groupedLogs.length === 0 ? (
            <div className="p-6 text-[12px] text-gray-400">暂无执行记录。</div>
          ) : (
            <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">
              {groupedLogs.map((logEntry) => (
                <div key={logEntry.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{logEntry.taskName}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${logEntry.status === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300' : logEntry.status === 'partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/[0.12] dark:text-amber-300' : 'bg-red-50 text-red-700 dark:bg-red-500/[0.12] dark:text-red-300'}`}>
                          {statusLabel(logEntry.status)}
                        </span>
                      </div>
                      <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-2">
                        {formatDateTime(logEntry.startedAt)} 开始 · {formatDateTime(logEntry.finishedAt)} 完成
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/[0.04] text-[11px] text-gray-500 dark:text-gray-400">
                          命中 {logEntry.matchedCount} 项
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/[0.04] text-[11px] text-gray-500 dark:text-gray-400">
                          已清理 {logEntry.cleanedCount} 项
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/[0.04] text-[11px] text-gray-500 dark:text-gray-400">
                          释放 {formatSize(logEntry.freedBytes)}
                        </span>
                        {logEntry.skippedCommandCount > 0 && (
                          <span className="px-2 py-1 rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/[0.12] dark:text-violet-300 text-[11px] flex items-center gap-1">
                            <TerminalSquare className="w-3 h-3" />
                            手动处理 {logEntry.skippedCommandCount} 项
                          </span>
                        )}
                      </div>
                      {logEntry.errors.length > 0 && (
                        <div className="mt-2 text-[11px] text-red-500 dark:text-red-400">
                          {logEntry.errors[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 text-[11px] text-gray-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {logEntry.action === 'safe-clean' ? 'safe-only' : 'scan-only'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
