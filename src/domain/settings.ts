import {
  isAnalogStyle,
  isDigitalStyle,
  type AnalogStyle,
  type DigitalStyle,
} from './clockStyles'
import { isCalendarScope, type CalendarScope } from './calendarModel'
import {
  isPomodoroDialStyle,
  type PomodoroDialStyle,
} from './pomodoroDial'
import { isScenicFixedPhase, isScenicThemeId } from './scenicTime'

export type AppMode = 'clock' | 'pomodoro' | 'stopwatch' | 'calendar'
export type ClockMode = 'digital' | 'analog' | 'both'
export type { AnalogStyle, DigitalStyle, CalendarScope, PomodoroDialStyle }
export type DateFormat = 'short'
export type HourFormat = '24h' | '12h'
export type FontFamilyId = 'system' | 'serif'

export type ScenicTimeMode = 'live' | 'fixed'
export type ScenicFixedPhase = 'dawn' | 'day' | 'sunset' | 'bluehour' | 'night'
export type Locale = 'en' | 'ko' | 'ja'

const FONT_FAMILY_IDS: FontFamilyId[] = ['system', 'serif']
const LOCALES: Locale[] = ['en', 'ko', 'ja']

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale)
}

export function isFontFamilyId(id: unknown): id is FontFamilyId {
  return typeof id === 'string' && FONT_FAMILY_IDS.includes(id as FontFamilyId)
}

export type CustomTheme = {
  bg: string
  fg: string
  accent: string
  fontFamily: FontFamilyId
}

export type ClockSettings = {
  version: 1
  showSeconds: boolean
  showDate: boolean
  showDayProgress: boolean
  showDayProgressPercent: boolean
  hourFormat: HourFormat
  mode: ClockMode
  appMode: AppMode
  calendarScope: CalendarScope
  pomodoroMinutes: number
  pomodoroDialStyle: PomodoroDialStyle
  themeId: string
  custom: CustomTheme
  digitalStyle: DigitalStyle
  analogStyle: AnalogStyle
  keepScreenOn: boolean
  dateFormat: DateFormat
  scenicTimeMode: ScenicTimeMode
  scenicFixedPhase: ScenicFixedPhase
  locale: Locale
}

export const STORAGE_KEY = 'clock.settings.v1'

export const DEFAULT_POMODORO_MINUTES = 25
export const MIN_POMODORO_MINUTES = 1
export const MAX_POMODORO_MINUTES = 180

export const DEFAULT_SETTINGS: ClockSettings = {
  version: 1,
  showSeconds: false,
  showDate: false,
  showDayProgress: true,
  showDayProgressPercent: true,
  hourFormat: '24h',
  mode: 'digital',
  appMode: 'clock',
  calendarScope: 'month',
  pomodoroMinutes: DEFAULT_POMODORO_MINUTES,
  pomodoroDialStyle: 'classic',
  themeId: 'slate',
  custom: {
    bg: '#141218',
    fg: '#f0e8e0',
    accent: '#c6a58a',
    fontFamily: 'system',
  },
  digitalStyle: 'minimal',
  analogStyle: 'classic',
  keepScreenOn: false,
  dateFormat: 'short',
  scenicTimeMode: 'live',
  scenicFixedPhase: 'day',
  locale: 'en',
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function clampPomodoroMinutes(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POMODORO_MINUTES
  return Math.min(MAX_POMODORO_MINUTES, Math.max(MIN_POMODORO_MINUTES, Math.round(value)))
}

function migrate(raw: unknown): ClockSettings {
  if (!isObject(raw)) return { ...DEFAULT_SETTINGS, custom: { ...DEFAULT_SETTINGS.custom } }

  const customRaw = isObject(raw.custom) ? raw.custom : {}
  const custom: CustomTheme = {
    bg: typeof customRaw.bg === 'string' ? customRaw.bg : DEFAULT_SETTINGS.custom.bg,
    fg: typeof customRaw.fg === 'string' ? customRaw.fg : DEFAULT_SETTINGS.custom.fg,
    accent:
      typeof customRaw.accent === 'string' ? customRaw.accent : DEFAULT_SETTINGS.custom.accent,
    fontFamily: isFontFamilyId(customRaw.fontFamily)
      ? customRaw.fontFamily
      : DEFAULT_SETTINGS.custom.fontFamily,
  }

  const appMode =
    raw.appMode === 'pomodoro' ||
    raw.appMode === 'stopwatch' ||
    raw.appMode === 'clock' ||
    raw.appMode === 'calendar'
      ? raw.appMode
      : DEFAULT_SETTINGS.appMode

  return {
    version: 1,
    showSeconds: Boolean(raw.showSeconds ?? DEFAULT_SETTINGS.showSeconds),
    showDate: Boolean(raw.showDate ?? DEFAULT_SETTINGS.showDate),
    showDayProgress: Boolean(raw.showDayProgress ?? DEFAULT_SETTINGS.showDayProgress),
    showDayProgressPercent: Boolean(
      raw.showDayProgressPercent ?? DEFAULT_SETTINGS.showDayProgressPercent,
    ),
    hourFormat: raw.hourFormat === '12h' || raw.hourFormat === '24h'
      ? raw.hourFormat
      : DEFAULT_SETTINGS.hourFormat,
    mode: (raw.mode as ClockMode) ?? DEFAULT_SETTINGS.mode,
    appMode,
    calendarScope: isCalendarScope(raw.calendarScope)
      ? raw.calendarScope
      : DEFAULT_SETTINGS.calendarScope,
    pomodoroMinutes: clampPomodoroMinutes(
      typeof raw.pomodoroMinutes === 'number'
        ? raw.pomodoroMinutes
        : DEFAULT_SETTINGS.pomodoroMinutes,
    ),
    pomodoroDialStyle: isPomodoroDialStyle(raw.pomodoroDialStyle)
      ? raw.pomodoroDialStyle
      : raw.pomodoroDialStyle === 'notch'
        ? 'retro'
        : DEFAULT_SETTINGS.pomodoroDialStyle,
    themeId: (() => {
      const id = typeof raw.themeId === 'string' ? raw.themeId : DEFAULT_SETTINGS.themeId
      if (id === 'ocean' || id === 'harbor' || id === 'midnight') return 'slate'
      if (id === 'graphite' || id === 'charcoal') return 'ash'
      if (id === 'bone') return 'chalk'
      return id
    })(),
    custom,
    digitalStyle: isDigitalStyle(raw.digitalStyle)
      ? raw.digitalStyle
      : DEFAULT_SETTINGS.digitalStyle,
    analogStyle: isAnalogStyle(raw.analogStyle)
      ? raw.analogStyle
      : DEFAULT_SETTINGS.analogStyle,
    keepScreenOn: Boolean(raw.keepScreenOn ?? DEFAULT_SETTINGS.keepScreenOn),
    dateFormat: (raw.dateFormat as DateFormat) ?? DEFAULT_SETTINGS.dateFormat,
    scenicTimeMode:
      raw.scenicTimeMode === 'live' || raw.scenicTimeMode === 'fixed'
        ? raw.scenicTimeMode
        : DEFAULT_SETTINGS.scenicTimeMode,
    scenicFixedPhase: isScenicFixedPhase(raw.scenicFixedPhase)
      ? raw.scenicFixedPhase
      : DEFAULT_SETTINGS.scenicFixedPhase,
    locale: isLocale(raw.locale) ? raw.locale : DEFAULT_SETTINGS.locale,
  }
}

export function loadSettings(): ClockSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS, custom: { ...DEFAULT_SETTINGS.custom } }
    return migrate(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_SETTINGS, custom: { ...DEFAULT_SETTINGS.custom } }
  }
}

export function saveSettings(settings: ClockSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

/** True when ticker should fire every second. */
export function needsSecondTicks(settings: ClockSettings): boolean {
  if (settings.appMode === 'pomodoro' || settings.appMode === 'stopwatch') return true
  if (isScenicThemeId(settings.themeId)) {
    return settings.scenicTimeMode === 'live'
  }
  return settings.showSeconds
}
