export interface SupportLink {
  id: 'changelog' | 'feedback' | 'docs'
  label: string
  href: string
}

export const aboutSupportLinks: SupportLink[] = [
  {
    id: 'changelog',
    label: '查看更新日志',
    href: 'https://github.com/kaelinda/MagicBroom/releases',
  },
  {
    id: 'feedback',
    label: '发送反馈',
    href: 'https://github.com/kaelinda/MagicBroom/issues',
  },
  {
    id: 'docs',
    label: '帮助文档',
    href: 'https://github.com/kaelinda/MagicBroom/blob/main/README.md',
  },
]
