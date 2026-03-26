import { homedir } from 'os'
import { PROTECTED_PATHS } from './types'

/**
 * 检查路径是否在保护名单中
 * 所有规则路径必须 resolve symlink 后再检查
 */
export function isProtectedPath(resolvedPath: string): boolean {
  const home = homedir()

  for (const protectedPath of PROTECTED_PATHS) {
    // 展开 ~ 为用户主目录
    const fullProtected = protectedPath.startsWith('/')
      ? protectedPath
      : home + protectedPath

    // 精确匹配或者是保护路径的直接子目录
    if (resolvedPath === fullProtected || resolvedPath.startsWith(fullProtected + '/')) {
      // 特殊情况：允许清理 ~/Library 下的 Caches 等子目录
      // 但不允许清理 ~/Documents、~/Desktop 等
      if (fullProtected === home + '/Library') {
        // ~/Library/Caches, ~/Library/Logs 等是允许的
        return false
      }
      return true
    }
  }

  // 不允许清理用户主目录本身
  if (resolvedPath === home) return true

  // 不允许清理根目录
  if (resolvedPath === '/') return true

  return false
}
