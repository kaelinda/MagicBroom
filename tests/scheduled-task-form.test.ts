import { describe, expect, it } from 'vitest'
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  WEEKDAY_OPTIONS,
  buildUpdatedSchedule,
  normalizeMinuteInput,
  resolveMinuteDraft,
} from '../src/app/pages/scheduled-task-form'

describe('scheduled task form options', () => {
  it('exposes seven weekday options in sunday-first order', () => {
    expect(WEEKDAY_OPTIONS).toHaveLength(7)
    expect(WEEKDAY_OPTIONS[0]).toEqual({ value: 0, label: '周日' })
    expect(WEEKDAY_OPTIONS[6]).toEqual({ value: 6, label: '周六' })
  })

  it('provides padded hour and minute options for custom pickers', () => {
    expect(HOUR_OPTIONS[0]).toEqual({ value: 0, label: '00' })
    expect(HOUR_OPTIONS[23]).toEqual({ value: 23, label: '23' })
    expect(MINUTE_OPTIONS[0]).toEqual({ value: 0, label: '00' })
    expect(MINUTE_OPTIONS).toHaveLength(6)
    expect(MINUTE_OPTIONS[1]).toEqual({ value: 10, label: '10' })
    expect(MINUTE_OPTIONS[5]).toEqual({ value: 50, label: '50' })
  })
})

describe('buildUpdatedSchedule', () => {
  it('merges partial schedule updates without losing untouched fields', () => {
    expect(
      buildUpdatedSchedule(
        { weekday: 0, hour: 3, minute: 0 },
        { weekday: 2, minute: 30 },
      ),
    ).toEqual({ weekday: 2, hour: 3, minute: 30 })
  })
})

describe('normalizeMinuteInput', () => {
  it('accepts manual minute input between 0 and 59 and clamps invalid values', () => {
    expect(normalizeMinuteInput('7')).toBe(7)
    expect(normalizeMinuteInput('59')).toBe(59)
    expect(normalizeMinuteInput('99')).toBe(59)
    expect(normalizeMinuteInput('-1')).toBe(0)
    expect(normalizeMinuteInput('abc')).toBe(null)
  })
})

describe('resolveMinuteDraft', () => {
  it('commits valid draft and falls back on empty or invalid input', () => {
    expect(resolveMinuteDraft('7', 0)).toBe(7)
    expect(resolveMinuteDraft('70', 0)).toBe(59)
    expect(resolveMinuteDraft('', 20)).toBe(20)
    expect(resolveMinuteDraft('abc', 20)).toBe(20)
  })
})
