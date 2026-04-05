export interface ScheduleShape {
  weekday: number
  hour: number
  minute: number
}

export const WEEKDAY_OPTIONS = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
]

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, value) => ({
  value,
  label: String(value).padStart(2, '0'),
}))

export const MINUTE_OPTIONS = Array.from({ length: 6 }, (_, index) => {
  const value = index * 10
  return {
  value,
  label: String(value).padStart(2, '0'),
  }
})

export function buildUpdatedSchedule(
  current: ScheduleShape,
  patch: Partial<ScheduleShape>,
): ScheduleShape {
  return {
    ...current,
    ...patch,
  }
}

export function normalizeMinuteInput(value: string): number | null {
  if (!/^-?\d+$/.test(value.trim())) return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return Math.min(59, Math.max(0, parsed))
}

export function resolveMinuteDraft(draft: string, fallback: number): number {
  const normalized = normalizeMinuteInput(draft)
  return normalized ?? fallback
}
