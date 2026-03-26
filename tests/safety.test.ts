import { describe, it, expect } from 'vitest'
import { isProtectedPath } from '../electron/main/safety'

describe('isProtectedPath', () => {
  it('应该保护 /Applications', () => {
    expect(isProtectedPath('/Applications')).toBe(true)
  })

  it('应该保护 /Applications 下的子路径', () => {
    expect(isProtectedPath('/Applications/Xcode.app')).toBe(true)
  })

  it('应该保护 /System', () => {
    expect(isProtectedPath('/System')).toBe(true)
  })

  it('应该保护 ~/Documents', () => {
    const home = process.env.HOME || '/Users/test'
    expect(isProtectedPath(`${home}/Documents`)).toBe(true)
  })

  it('应该保护 ~/Desktop', () => {
    const home = process.env.HOME || '/Users/test'
    expect(isProtectedPath(`${home}/Desktop`)).toBe(true)
  })

  it('应该保护 ~/.ssh', () => {
    const home = process.env.HOME || '/Users/test'
    expect(isProtectedPath(`${home}/.ssh`)).toBe(true)
  })

  it('应该保护用户主目录本身', () => {
    const home = process.env.HOME || '/Users/test'
    expect(isProtectedPath(home)).toBe(true)
  })

  it('应该保护根目录', () => {
    expect(isProtectedPath('/')).toBe(true)
  })

  it('应该允许 ~/Library/Caches（不在保护名单）', () => {
    const home = process.env.HOME || '/Users/test'
    expect(isProtectedPath(`${home}/Library/Caches`)).toBe(false)
  })

  it('应该允许 ~/Library/Developer/Xcode/DerivedData', () => {
    const home = process.env.HOME || '/Users/test'
    expect(isProtectedPath(`${home}/Library/Developer/Xcode/DerivedData`)).toBe(false)
  })

  it('应该允许 ~/.npm', () => {
    const home = process.env.HOME || '/Users/test'
    expect(isProtectedPath(`${home}/.npm`)).toBe(false)
  })

  it('应该允许 ~/.Trash', () => {
    const home = process.env.HOME || '/Users/test'
    expect(isProtectedPath(`${home}/.Trash`)).toBe(false)
  })
})
