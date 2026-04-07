import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Inbox,
  Package,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useDownloadsInbox } from '../hooks/useDownloadsInbox'
import { cardClass } from '../styles'
import { formatSize } from '../utils'

type InboxTab = 'suggested' | 'expired'
type StreamKey = DownloadInboxStream

const streamMeta: Record<StreamKey, { label: string; icon: typeof Package; empty: string }> = {
  installers: {
    label: '安装包',
    icon: Package,
    empty: '没有待处理的安装包',
  },
  documents: {
    label: '文档',
    icon: FileText,
    empty: '没有待处理的文档',
  },
  images: {
    label: '图片',
    icon: ImageIcon,
    empty: '没有待处理的图片',
  },
}

export function DownloadsInbox() {
  const { addToast } = useToast()
  const { suggestions, archived, loading, error, archiving, refresh, archiveItems } = useDownloadsInbox()
  const [activeTab, setActiveTab] = useState<InboxTab>('suggested')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [collapsedSuggestedGroups, setCollapsedSuggestedGroups] = useState<Set<StreamKey>>(
    () => new Set(['installers', 'documents', 'images']),
  )
  const [collapsedArchivedGroups, setCollapsedArchivedGroups] = useState<Set<StreamKey>>(
    () => new Set(['installers', 'documents', 'images']),
  )

  useEffect(() => {
    setSelectedIds((current) => new Set([...current].filter((id) => suggestions.some((item) => item.id === id))))
  }, [suggestions])

  const suggestionGroups = useMemo(() => groupSuggestionsByStream(suggestions), [suggestions])
  const archivedGroups = useMemo(() => groupArchivedByStream(archived), [archived])
  const suggestionCount = suggestions.length
  const selectedSuggestions = suggestions.filter((item) => selectedIds.has(item.id))
  const suggestionExpiredCount = suggestions.filter((item) => item.expired).length

  async function handleArchive(items: DownloadInboxSuggestion[]) {
    const result = await archiveItems(items.map((item) => ({ id: item.id, path: item.path, targetPath: item.targetPath })))
    if (!result) return

    const failedCount = result.failed.length
    const successCount = result.succeeded.length

    if (successCount > 0) {
      addToast(`已归档 ${successCount} 个文件`, 'success')
    }
    if (failedCount > 0) {
      const message = result.failed[0]?.error ?? '未知错误'
      addToast(`${failedCount} 个文件归档失败：${message}`, 'error')
    }

    setSelectedIds((current) => {
      const next = new Set(current)
      result.succeeded.forEach((item) => next.delete(item.id))
      return next
    })

    await refresh()
  }

  function toggleItem(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleGroup(items: DownloadInboxSuggestion[]) {
    const ids = items.map((item) => item.id)
    const shouldSelect = ids.some((id) => !selectedIds.has(id))

    setSelectedIds((current) => {
      const next = new Set(current)
      ids.forEach((id) => {
        if (shouldSelect) next.add(id)
        else next.delete(id)
      })
      return next
    })
  }

  function toggleSuggestedGroup(stream: StreamKey) {
    setCollapsedSuggestedGroups((current) => {
      const next = new Set(current)
      if (next.has(stream)) next.delete(stream)
      else next.add(stream)
      return next
    })
  }

  function toggleArchivedGroup(stream: StreamKey) {
    setCollapsedArchivedGroups((current) => {
      const next = new Set(current)
      if (next.has(stream)) next.delete(stream)
      else next.add(stream)
      return next
    })
  }

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className={`${cardClass} p-10 text-center`}>
          <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 mb-1">正在整理下载收件箱</h2>
          <p className="text-[13px] text-gray-400">只扫描 Downloads 顶层文件，并读取已归档的 expired 文件</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className={`${cardClass} p-10 text-center`}>
          <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 mb-1">收件箱读取失败</h2>
          <p className="text-[13px] text-gray-400 mb-5">{error}</p>
          <button
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 h-[40px] px-4 rounded-xl border border-gray-200/70 dark:border-white/[0.1] text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:border-[#6B7FED] hover:text-[#6B7FED] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重新读取
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">下载收件箱</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            先给建议，再归档。`expired` 只负责沉底旧归档，不会替你删除文件。
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 h-[38px] px-3.5 rounded-xl border border-gray-200/70 dark:border-white/[0.1] text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-[#6B7FED] hover:border-[#6B7FED]/40 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className={`${cardClass} p-5 mb-5`}>
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-8 flex-wrap">
            <SummaryBlock label="待处理建议" value={`${suggestionCount}`} hint="只看 Downloads 顶层文件" />
            <SummaryBlock label="将进入 expired" value={`${suggestionExpiredCount}`} hint="超过 14 天未改动" />
            <SummaryBlock label="已归档旧文件" value={`${archived.length}`} hint="位于 _MagicBroom/*/expired" />
          </div>
          {activeTab === 'suggested' && (
            <button
              onClick={() => void handleArchive(suggestions)}
              disabled={suggestionCount === 0 || archiving}
              className="h-[40px] px-4 rounded-xl border border-gray-200/70 dark:border-white/[0.1] text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:border-[#6B7FED] hover:text-[#6B7FED] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {archiving ? '归档中...' : '归档全部建议项'}
            </button>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <div className="border-b border-gray-100/80 dark:border-white/[0.06] px-3 pt-3">
          <div className="flex gap-1">
            {([
              { id: 'suggested' as InboxTab, label: '建议处理', count: suggestionCount, icon: Sparkles },
              { id: 'expired' as InboxTab, label: 'expired', count: archived.length, icon: Archive },
            ]).map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[12px] font-medium transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'text-[#6B7FED] border-[#6B7FED] bg-[#6B7FED]/[0.04]'
                      : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-[#6B7FED]/10 text-[#6B7FED]' : 'bg-gray-100/80 dark:bg-white/[0.06]'}`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'suggested' ? (
            suggestionCount === 0 ? (
              <div className="py-10 text-center">
                <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h2 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 mb-1">当前没有待处理下载项</h2>
                <p className="text-[13px] text-gray-400 mb-5">收件箱已经清空，旧文件都在 expired 里沉底了。</p>
                <button
                  onClick={() => setActiveTab('expired')}
                  className="inline-flex items-center gap-2 h-[40px] px-4 rounded-xl border border-gray-200/70 dark:border-white/[0.1] text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:border-[#6B7FED] hover:text-[#6B7FED] transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  查看 expired
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {(['installers', 'documents', 'images'] as StreamKey[]).map((stream) => {
                  const items = suggestionGroups[stream]
                  const meta = streamMeta[stream]
                  return (
                    <SuggestionGroup
                      key={stream}
                      stream={stream}
                      label={meta.label}
                      items={items}
                      selectedIds={selectedIds}
                      disabled={archiving}
                      collapsed={collapsedSuggestedGroups.has(stream)}
                      onToggleCollapse={() => toggleSuggestedGroup(stream)}
                      onToggleItem={toggleItem}
                      onToggleGroup={() => toggleGroup(items)}
                      onArchiveItems={(groupItems) => void handleArchive(groupItems)}
                    />
                  )
                })}
              </div>
            )
          ) : archived.length === 0 ? (
            <div className="py-10 text-center">
              <Archive className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 mb-1">还没有沉到底部的旧归档</h2>
              <p className="text-[13px] text-gray-400">等建议项被归档到 expired 后，这里会按分组展示历史文件。</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-100/80 dark:border-white/[0.08] bg-gray-50/70 dark:bg-white/[0.03] px-4 py-3 text-[12px] text-gray-500 dark:text-gray-400">
                这里是旧归档浏览区。文件还在 Downloads 体系里，只是被沉到底部，不会自动删除。
              </div>
              {(['installers', 'documents', 'images'] as StreamKey[]).map((stream) => {
                const items = archivedGroups[stream]
                const meta = streamMeta[stream]
                return (
                  <ArchivedGroup
                    key={stream}
                    label={meta.label}
                    items={items}
                    emptyLabel={meta.empty}
                    collapsed={collapsedArchivedGroups.has(stream)}
                    onToggleCollapse={() => toggleArchivedGroup(stream)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'suggested' && suggestionCount > 0 && (
        <div className={`${cardClass} p-4 mt-5`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5 text-[12px] text-gray-500 dark:text-gray-400">
              <span>
                已选择 <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedSuggestions.length}</span> / {suggestionCount} 项
              </span>
              <span>
                预计移动 <span className="font-semibold text-[#6B7FED]">{formatSize(selectedSuggestions.reduce((sum, item) => sum + item.size, 0))}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set(suggestions.map((item) => item.id)))}
                className="text-[12px] text-[#6B7FED] hover:text-[#5468E8] font-medium transition-colors"
              >
                全选建议项
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors"
              >
                取消全选
              </button>
              <button
                onClick={() => void handleArchive(selectedSuggestions)}
                disabled={selectedSuggestions.length === 0 || archiving}
                className="h-[36px] px-4 bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white rounded-xl flex items-center gap-2 text-[12px] font-medium shadow-[0_2px_6px_rgba(107,127,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {archiving ? '归档中...' : '归档已选'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryBlock({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <div className="text-[12px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">{value}</div>
      <div className="text-[11px] text-gray-400 mt-0.5">{hint}</div>
    </div>
  )
}

function SuggestionGroup({
  stream,
  label,
  items,
  selectedIds,
  disabled,
  collapsed,
  onToggleCollapse,
  onToggleItem,
  onToggleGroup,
  onArchiveItems,
}: {
  stream: StreamKey
  label: string
  items: DownloadInboxSuggestion[]
  selectedIds: Set<string>
  disabled: boolean
  collapsed: boolean
  onToggleCollapse: () => void
  onToggleItem: (id: string) => void
  onToggleGroup: () => void
  onArchiveItems: (items: DownloadInboxSuggestion[]) => void
}) {
  const Icon = streamMeta[stream].icon
  const groupSize = items.reduce((sum, item) => sum + item.size, 0)
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))

  return (
    <div className="rounded-2xl border border-gray-100/80 dark:border-white/[0.08] overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100/80 dark:border-white/[0.06] flex items-center justify-between gap-4 flex-wrap bg-gray-50/40 dark:bg-white/[0.02]">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-3 text-left"
        >
          <div className="text-gray-400">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#6B7FED]/10 text-[#6B7FED] flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{label}</div>
            <div className="text-[11px] text-gray-400">{items.length} 项，{formatSize(groupSize)}</div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleGroup}
            disabled={items.length === 0}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-[#6B7FED] hover:bg-[#6B7FED]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {allSelected ? '取消全选' : '全选建议项'}
          </button>
          <button
            onClick={() => onArchiveItems(items)}
            disabled={items.length === 0 || disabled}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#6B7FED] hover:bg-[#6B7FED]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            归档本组
          </button>
        </div>
      </div>

      {collapsed ? null : items.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-gray-400">{streamMeta[stream].empty}</div>
      ) : (
        <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">
          {items.map((item) => (
            <SuggestionItem
              key={item.id}
              item={item}
              checked={selectedIds.has(item.id)}
              disabled={disabled}
              onToggle={() => onToggleItem(item.id)}
              onArchive={() => onArchiveItems([item])}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SuggestionItem({
  item,
  checked,
  disabled,
  onToggle,
  onArchive,
}: {
  item: DownloadInboxSuggestion
  checked: boolean
  disabled: boolean
  onToggle: () => void
  onArchive: () => void
}) {
  return (
    <div className="p-4 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.06] transition-colors duration-150">
      <div className="flex items-start gap-3">
        <label className="mt-1 relative flex items-center cursor-pointer">
          <input type="checkbox" checked={checked} onChange={onToggle} className="peer sr-only" />
          <div className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-gray-300 dark:border-gray-600 peer-checked:border-[#6B7FED] peer-checked:bg-[#6B7FED] flex items-center justify-center transition-all">
            {checked && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </label>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
            <span className="inline-flex items-center rounded-full bg-gray-100/80 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
              {item.typeLabel}
            </span>
            {item.expired && (
              <span className="inline-flex items-center rounded-full bg-amber-100/80 dark:bg-amber-500/[0.12] px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                将进入 expired
              </span>
            )}
          </div>
          <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 mb-2">{item.reason}</div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
            <span>{formatSize(item.size)}</span>
            <span>{item.modifiedLabel}</span>
            <span className="font-mono truncate max-w-[520px]" title={item.targetPath}>
              → {item.targetPath}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
          <button
            onClick={() => window.api?.shell.showInFinder(item.path)}
            className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-[#6B7FED] transition-colors"
          >
            <FolderOpen className="w-3 h-3" />
            Finder
          </button>
          <button
            onClick={onArchive}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6B7FED] hover:bg-[#5468E8] text-white text-[10px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            归档
          </button>
        </div>
      </div>
    </div>
  )
}

function ArchivedGroup({
  label,
  items,
  emptyLabel,
  collapsed,
  onToggleCollapse,
}: {
  label: string
  items: ArchivedDownloadItem[]
  emptyLabel: string
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const Icon = label === '安装包' ? Package : label === '图片' ? ImageIcon : FileText
  const totalSize = items.reduce((sum, item) => sum + item.size, 0)

  return (
    <div className="rounded-2xl border border-gray-100/80 dark:border-white/[0.08] overflow-hidden">
      <button
        onClick={onToggleCollapse}
        className="w-full px-4 py-3 border-b border-gray-100/80 dark:border-white/[0.06] flex items-center gap-3 bg-gray-50/40 dark:bg-white/[0.02] text-left"
      >
        <div className="text-gray-400">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        <div className="w-9 h-9 rounded-xl bg-gray-100/80 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{label}</div>
          <div className="text-[11px] text-gray-400">{items.length} 项，{formatSize(totalSize)}</div>
        </div>
      </button>

      {collapsed ? null : items.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-gray-400">{emptyLabel}</div>
      ) : (
        <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">
          {items.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                    <span className="inline-flex items-center rounded-full bg-gray-100/80 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                      {item.typeLabel}
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-2">旧归档，已从 Downloads 顶层沉到底部</div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                    <span>{formatSize(item.size)}</span>
                    <span>{item.modifiedLabel}</span>
                    <span className="font-mono truncate max-w-[520px]" title={item.path}>
                      {item.path}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => window.api?.shell.showInFinder(item.path)}
                  className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-[#6B7FED] transition-colors flex-shrink-0"
                >
                  <FolderOpen className="w-3 h-3" />
                  Finder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupSuggestionsByStream(items: DownloadInboxSuggestion[]) {
  return {
    installers: items.filter((item) => item.stream === 'installers'),
    documents: items.filter((item) => item.stream === 'documents'),
    images: items.filter((item) => item.stream === 'images'),
  } satisfies Record<StreamKey, DownloadInboxSuggestion[]>
}

function groupArchivedByStream(items: ArchivedDownloadItem[]) {
  return {
    installers: items.filter((item) => item.stream === 'installers'),
    documents: items.filter((item) => item.stream === 'documents'),
    images: items.filter((item) => item.stream === 'images'),
  } satisfies Record<StreamKey, ArchivedDownloadItem[]>
}
