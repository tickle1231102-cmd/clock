import type { DateFormat, HourFormat } from './settings'

export type ClockSnapshot = {
  hours: number
  minutes: number
  seconds: number
  hours12: number
  padHours: string
  padMinutes: string
  padSeconds: string
  period: 'AM' | 'PM' | ''
  digitalTime: string
  dateLabel: string
  hourAngle: number
  minuteAngle: number
  secondAngle: number
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

export function formatDateLabel(date: Date, _format: DateFormat = 'short'): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS_KO[date.getDay()]
  return `${month}월 ${day}일 · ${weekday}`
}

export function getClockSnapshot(
  date: Date = new Date(),
  options: {
    showSeconds: boolean
    hourFormat?: HourFormat
    dateFormat?: DateFormat
  } = {
    showSeconds: false,
  },
): ClockSnapshot {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const hours12 = hours % 12 || 12
  const use12h = options.hourFormat === '12h'
  const displayHours = use12h ? hours12 : hours
  const padHours = use12h ? String(displayHours) : pad2(displayHours)
  const padMinutes = pad2(minutes)
  const padSeconds = pad2(seconds)

  const core = options.showSeconds
    ? `${padHours}:${padMinutes}:${padSeconds}`
    : `${padHours}:${padMinutes}`
  // 12h: show hours without AM/PM suffix.
  const digitalTime = core

  // Stepped angles (no continuous sub-second motion)
  const secondAngle = seconds * 6
  const minuteAngle = minutes * 6 + seconds * 0.1
  const hourAngle = (hours % 12) * 30 + minutes * 0.5

  return {
    hours,
    minutes,
    seconds,
    hours12,
    padHours,
    padMinutes,
    padSeconds,
    period: '',
    digitalTime,
    dateLabel: formatDateLabel(date, options.dateFormat ?? 'short'),
    hourAngle,
    minuteAngle,
    secondAngle,
  }
}
