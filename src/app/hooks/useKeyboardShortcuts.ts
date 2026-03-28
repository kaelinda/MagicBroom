import { useEffect } from 'react'

/**
 * 全局键盘快捷键：
 * - ⌘K: 聚焦搜索框
 * - ⌘⌫: 触发清理选中项（点击确认按钮）
 * - Enter: 确认弹窗操作
 * - Esc: 取消弹窗 / 失焦搜索框
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // ⌘K — 聚焦搜索框
      if (e.metaKey && e.key === 'k') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('[data-search-input]')
        input?.focus()
      }

      // ⌘⌫ — 触发清理（点击页面中的 data-clean-trigger 按钮）
      if (e.metaKey && e.key === 'Backspace') {
        e.preventDefault()
        const btn = document.querySelector<HTMLButtonElement>('[data-clean-trigger]:not(:disabled)')
        btn?.click()
      }

      // Enter — 确认弹窗（点击 data-confirm-action 按钮）
      if (e.key === 'Enter' && !e.metaKey && !e.shiftKey) {
        const confirmBtn = document.querySelector<HTMLButtonElement>('[data-confirm-action]')
        if (confirmBtn) {
          e.preventDefault()
          confirmBtn.click()
        }
      }

      // Esc — 关闭弹窗 / 失焦搜索框
      if (e.key === 'Escape') {
        const cancelBtn = document.querySelector<HTMLButtonElement>('[data-cancel-action]')
        if (cancelBtn) {
          e.preventDefault()
          cancelBtn.click()
          return
        }
        const active = document.activeElement as HTMLElement | null
        if (active?.matches('[data-search-input]')) {
          active.blur()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
