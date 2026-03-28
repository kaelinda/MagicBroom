import { useEffect } from 'react'

/**
 * 全局键盘快捷键：
 * - ⌘K: 聚焦搜索框
 * - Esc: 取消当前弹窗 / 失焦搜索框
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

      // Esc — 失焦搜索框
      if (e.key === 'Escape') {
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
