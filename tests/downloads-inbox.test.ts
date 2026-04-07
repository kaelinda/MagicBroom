import { describe, expect, it } from 'vitest'
import {
  buildDownloadSuggestion,
  classifyDownloadFile,
  isExpiredByModifiedAt,
} from '../electron/main/downloads-inbox'

const NOW = new Date('2026-04-06T12:00:00Z').getTime()

describe('classifyDownloadFile', () => {
  it('classifies installer files into the installers stream', () => {
    expect(classifyDownloadFile({ name: 'Raycast.dmg' })).toEqual(
      expect.objectContaining({ stream: 'installers', kind: 'dmg', typeLabel: 'DMG' }),
    )
    expect(classifyDownloadFile({ name: 'Notion.pkg' })).toEqual(
      expect.objectContaining({ stream: 'installers', kind: 'pkg', typeLabel: 'PKG' }),
    )
    expect(classifyDownloadFile({ name: 'Arc.zip' })).toEqual(
      expect.objectContaining({ stream: 'installers', kind: 'zip', typeLabel: 'ZIP' }),
    )
  })

  it('classifies screenshot and general image files into the images stream', () => {
    expect(classifyDownloadFile({ name: 'Screenshot 2026-04-01 at 10.00.00.png' })).toEqual(
      expect.objectContaining({ stream: 'images', kind: 'screenshot', typeLabel: '截图' }),
    )
    expect(classifyDownloadFile({ name: '屏幕快照 2026-04-01 10.00.00.png' })).toEqual(
      expect.objectContaining({ stream: 'images', kind: 'screenshot', typeLabel: '截图' }),
    )
    expect(classifyDownloadFile({ name: 'wallpaper.heic' })).toEqual(
      expect.objectContaining({ stream: 'images', kind: 'image', typeLabel: '图片' }),
    )
  })

  it('classifies pdf files into the documents stream', () => {
    expect(classifyDownloadFile({ name: 'contract.pdf' })).toEqual(
      expect.objectContaining({ stream: 'documents', kind: 'pdf', typeLabel: 'PDF' }),
    )
  })

  it('ignores unsupported files so the inbox stays high signal', () => {
    expect(classifyDownloadFile({ name: 'notes.txt' })).toBeNull()
    expect(classifyDownloadFile({ name: 'spreadsheet.xlsx' })).toBeNull()
  })
})

describe('buildDownloadSuggestion', () => {
  it('builds an expired installer suggestion with an expired target path', () => {
    const suggestion = buildDownloadSuggestion(
      {
        path: '/Users/test/Downloads/Raycast.dmg',
        name: 'Raycast.dmg',
        size: 1024,
        modifiedAt: NOW - 20 * 24 * 60 * 60 * 1000,
      },
      '/Users/test/Downloads',
      NOW,
    )

    expect(suggestion).toEqual(
      expect.objectContaining({
        stream: 'installers',
        expired: true,
        targetPath: '/Users/test/Downloads/_MagicBroom/Installers/expired/Raycast.dmg',
      }),
    )
    expect(suggestion?.reason).toContain('建议归档到 expired')
  })

  it('builds a fresh document suggestion without forcing it into expired', () => {
    const suggestion = buildDownloadSuggestion(
      {
        path: '/Users/test/Downloads/spec.pdf',
        name: 'spec.pdf',
        size: 2048,
        modifiedAt: NOW - 2 * 24 * 60 * 60 * 1000,
      },
      '/Users/test/Downloads',
      NOW,
    )

    expect(suggestion).toEqual(
      expect.objectContaining({
        stream: 'documents',
        expired: false,
        targetPath: '/Users/test/Downloads/_MagicBroom/Documents/spec.pdf',
      }),
    )
    expect(suggestion?.reason).toContain('PDF')
  })

  it('builds a fresh image suggestion into the images archive path', () => {
    const suggestion = buildDownloadSuggestion(
      {
        path: '/Users/test/Downloads/wallpaper.heic',
        name: 'wallpaper.heic',
        size: 4096,
        modifiedAt: NOW - 3 * 24 * 60 * 60 * 1000,
      },
      '/Users/test/Downloads',
      NOW,
    )

    expect(suggestion).toEqual(
      expect.objectContaining({
        stream: 'images',
        expired: false,
        targetPath: '/Users/test/Downloads/_MagicBroom/Images/wallpaper.heic',
      }),
    )
    expect(suggestion?.reason).toContain('图片分组')
  })
})

describe('isExpiredByModifiedAt', () => {
  it('uses the 14-day mtime rule agreed in v1', () => {
    expect(isExpiredByModifiedAt(NOW - 14 * 24 * 60 * 60 * 1000, NOW)).toBe(true)
    expect(isExpiredByModifiedAt(NOW - 13 * 24 * 60 * 60 * 1000, NOW)).toBe(false)
  })
})
