import { formatMonthTitle, getLocale, msg, t } from '../i18n'

export type CalendarScope = 'month' | 'year'

export type CalendarDayCell = {
  date: Date
  day: number
  inMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

export type MonthGrid = {
  year: number
  month: number // 0–11
  title: string
  subtitle: string
  weekdayLabels: string[]
  weeks: CalendarDayCell[][]
}

export type YearMonthCard = {
  month: number
  label: string
  shortLabel: string
  isCurrentMonth: boolean
  days: CalendarDayCell[]
}

export type YearViewModel = {
  year: number
  title: string
  subtitle: string
  months: YearMonthCard[]
}

const MONTHS_POETIC_KO = [
  '고요한 시작',
  '아직 이른 봄',
  '바람이 풀리는',
  '꽃이 머무는',
  '초록이 번지는',
  '해가 긴',
  '그늘이 깊은',
  '빛이 무른',
  '공기가 맑은',
  '잎이 물드는',
  '밤이 길어지는',
  '한 해가 앉는',
]

const MONTHS_POETIC_EN = [
  'Quiet start',
  'Early spring',
  'Wind opening',
  'Flowers lingering',
  'Green spreading',
  'Long sun',
  'Deep shade',
  'Soft light',
  'Clear air',
  'Leaves turning',
  'Longer nights',
  'Year settling',
]

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isCalendarScope(value: unknown): value is CalendarScope {
  return value === 'month' || value === 'year'
}

export function shiftMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1)
}

export function shiftYear(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear() + delta, anchor.getMonth(), 1)
}

export function buildMonthGrid(anchor: Date, today = new Date()): MonthGrid {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = first.getDay() // Sunday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const todayStart = startOfDay(today)

  const cells: CalendarDayCell[] = []
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startOffset + 1
    let date: Date
    let inMonth = true
    if (dayNum < 1) {
      date = new Date(year, month - 1, prevDays + dayNum)
      inMonth = false
    } else if (dayNum > daysInMonth) {
      date = new Date(year, month + 1, dayNum - daysInMonth)
      inMonth = false
    } else {
      date = new Date(year, month, dayNum)
    }
    const dow = date.getDay()
    cells.push({
      date,
      day: date.getDate(),
      inMonth,
      isToday: sameDay(date, todayStart),
      isWeekend: dow === 0 || dow === 6,
    })
  }

  const weeks: CalendarDayCell[][] = []
  for (let w = 0; w < 6; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7))
  }

  return {
    year,
    month,
    title: formatMonthTitle(year, month),
    subtitle: getLocalePoetic(month),
    weekdayLabels: msg().weekdays,
    weeks,
  }
}

function getLocalePoetic(month: number): string {
  return getLocale() === 'en'
    ? MONTHS_POETIC_EN[month] ?? ''
    : MONTHS_POETIC_KO[month] ?? ''
}

export function buildYearView(anchor: Date, today = new Date()): YearViewModel {
  const year = anchor.getFullYear()
  const todayStart = startOfDay(today)
  const months: YearMonthCard[] = []

  for (let m = 0; m < 12; m++) {
    const firstDow = new Date(year, m, 1).getDay()
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    const days: CalendarDayCell[] = []
    for (let pad = 0; pad < firstDow; pad++) {
      days.push({
        date: new Date(year, m, 0),
        day: 0,
        inMonth: false,
        isToday: false,
        isWeekend: false,
      })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m, d)
      const dow = date.getDay()
      days.push({
        date,
        day: d,
        inMonth: true,
        isToday: sameDay(date, todayStart),
        isWeekend: dow === 0 || dow === 6,
      })
    }
    months.push({
      month: m,
      label: msg().months[m] ?? String(m + 1),
      shortLabel: String(m + 1),
      isCurrentMonth: today.getFullYear() === year && today.getMonth() === m,
      days,
    })
  }

  return {
    year,
    title: String(year),
    subtitle: t('calendar.yearSubtitle'),
    months,
  }
}
