import type { AnalogStyle, DigitalStyle } from '../domain/clockStyles'
import type { PomodoroDialStyle } from '../domain/pomodoroDial'
import type { ScenicFixedPhase } from '../domain/settings'
import { MESSAGES, type Locale, type Messages } from './messages'

export type { Locale, Messages }

const LOCALES: Locale[] = ['en', 'ko', 'ja']

let activeLocale: Locale = 'en'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale)
}

export function getLocale(): Locale {
  return activeLocale
}

export function setLocale(locale: Locale): void {
  activeLocale = locale
  document.documentElement.lang = locale
}

export function msg(): Messages {
  return MESSAGES[activeLocale]
}

export function t(
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split('.')
  let node: unknown = MESSAGES[activeLocale]
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as object)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  if (typeof node !== 'string') return key
  if (!params) return node
  return node.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{${name}}`,
  )
}

export function digitalStyleLabel(id: DigitalStyle): string {
  return msg().digitalStyle[id] ?? id
}

export function analogStyleLabel(id: AnalogStyle): string {
  return msg().analogStyle[id] ?? id
}

export function pomodoroDialLabel(id: PomodoroDialStyle): string {
  return msg().pomodoroDial[id] ?? id
}

export function scenicPhaseLabel(id: ScenicFixedPhase): string {
  return msg().scenicPhase[id] ?? id
}

export function formatDateLabel(date: Date): string {
  const m = msg()
  const month = m.months[date.getMonth()] ?? String(date.getMonth() + 1)
  const day = date.getDate()
  const weekday = m.weekdays[date.getDay()] ?? ''
  return t('date.label', { month, day, weekday })
}

export function formatMonthTitle(year: number, month: number): string {
  const m = msg()
  if (activeLocale === 'en') {
    return `${m.months[month] ?? month + 1} ${year}`
  }
  if (activeLocale === 'ja') {
    return `${year}年${m.months[month] ?? `${month + 1}月`}`
  }
  return `${year}. ${m.months[month] ?? `${month + 1}월`}`
}

export function formatCalendarMonthHeading(month: number): string {
  const m = msg()
  if (activeLocale === 'en') {
    return m.months[month] ?? String(month + 1)
  }
  if (activeLocale === 'ja') {
    return m.months[month] ?? `${month + 1}月`
  }
  return `${month + 1}월`
}

export function formatPomodoroMinutes(n: number): string {
  return t('pomodoro.minutes', { n })
}
