import { homedir } from 'os'
import { PROTECTED_SYSTEM_PATHS, PROTECTED_HOME_PATHS } from './types'

/**
 * 检查路径是否在保护名单中
 * 所有规则路径必须 resolve symlink 后再检查
 */
export function isProtectedPath(resolvedPath: string): boolean {
  const home = homedir()

  // 不允许清理根目录或用户主目录本身
  if (resolvedPath === '/' || resolvedPath === home) return true

  // 系统绝对路径保护
  for (const sysPath of PROTECTED_SYSTEM_PATHS) {
    if (resolvedPath === sysPath || resolvedPath.startsWith(sysPath + '/')) {
      return true
    }
  }

  // 用户目录保护（相对于 $HOME）
  for (const relPath of PROTECTED_HOME_PATHS) {
    const fullPath = home + relPath
    if (resolvedPath === fullPath || resolvedPath.startsWith(fullPath + '/')) {
      return true
    }
  }

  // 特殊：允许 ~/Library 下的子目录（Caches、Logs、Developer 等）
  // 但不允许直接清理 ~/Library 本身
  if (resolvedPath === home + '/Library') return true

  return false
}
