import { scenicNightStarsOpacity } from './scenicTime'

/** Nook theme — cozy indoor desk room with a window to the sky. */

export const NOOK_THEME_ID = 'nook'

export type NookSceneState = {
  wall: string
  wallShadow: string
  desk: string
  wood: string
  floor: string
  skyTop: string
  skyMid: string
  skyBottom: string
  frame: string
  lamp: string
  lampGlow: number
  plant: string
  book: string
  starsOpacity: number
  fg: string
  accent: string
}

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n))
}

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return null
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return [r, g, b]
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function mix(a: string, b: string, t: number): string {
  const A = parseHex(a)
  const B = parseHex(b)
  if (!A || !B) return a
  const u = clamp(t)
  return toHex(
    A[0] + (B[0] - A[0]) * u,
    A[1] + (B[1] - A[1]) * u,
    A[2] + (B[2] - A[2]) * u,
  )
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0))
  return t * t * (3 - 2 * t)
}

function dayHour(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
}

type NookKeyframe = {
  hour: number
  wall: string
  wallShadow: string
  desk: string
  wood: string
  floor: string
  skyTop: string
  skyMid: string
  skyBottom: string
  frame: string
  lamp: string
  lampGlow: number
  plant: string
  book: string
  fg: string
  accent: string
}

const KEYFRAMES: NookKeyframe[] = [
  {
    hour: 0,
    wall: '#2a221c',
    wallShadow: '#1a1612',
    desk: '#3a2c22',
    wood: '#4a3828',
    floor: '#1c1410',
    skyTop: '#101828',
    skyMid: '#182838',
    skyBottom: '#243848',
    frame: '#1e1814',
    lamp: '#f0c878',
    lampGlow: 0.92,
    plant: '#2a4030',
    book: '#6a3840',
    fg: '#f4ece2',
    accent: '#e8b878',
  },
  {
    hour: 5.5,
    wall: '#3a322c',
    wallShadow: '#2a2420',
    desk: '#4a3a2e',
    wood: '#5a4634',
    floor: '#2a1c14',
    skyTop: '#4a5870',
    skyMid: '#c89078',
    skyBottom: '#f0c8a0',
    frame: '#2a221c',
    lamp: '#e8c090',
    lampGlow: 0.45,
    plant: '#3a5040',
    book: '#7a4850',
    fg: '#fff6ee',
    accent: '#e0a878',
  },
  {
    hour: 8,
    wall: '#f6eee2',
    wallShadow: '#e8dcc8',
    desk: '#c4a078',
    wood: '#b08a62',
    floor: '#8a5a32',
    skyTop: '#7ec8ec',
    skyMid: '#a8dcf4',
    skyBottom: '#f0e8d0',
    frame: '#8a7058',
    lamp: '#e8d0a0',
    lampGlow: 0.08,
    plant: '#4a7a58',
    book: '#c06060',
    fg: '#3a2c22',
    accent: '#c48848',
  },
  {
    hour: 12,
    wall: '#f8f2e8',
    wallShadow: '#ece0cc',
    desk: '#d0ae84',
    wood: '#c49a6e',
    floor: '#945e34',
    skyTop: '#6ab8e4',
    skyMid: '#98d4f0',
    skyBottom: '#d8eef8',
    frame: '#8a7058',
    lamp: '#ead8b0',
    lampGlow: 0,
    plant: '#3e8a52',
    book: '#c85858',
    fg: '#3a2c22',
    accent: '#c08048',
  },
  {
    hour: 16,
    wall: '#f4e8d6',
    wallShadow: '#e4d4bc',
    desk: '#c8a47a',
    wood: '#b89268',
    floor: '#8c5a30',
    skyTop: '#6aa8c8',
    skyMid: '#88b8c8',
    skyBottom: '#d0d8d0',
    frame: '#7a624c',
    lamp: '#e8d0a0',
    lampGlow: 0.12,
    plant: '#3a7848',
    book: '#b85050',
    fg: '#3a2c22',
    accent: '#b87840',
  },
  {
    hour: 17.8,
    wall: '#c8a888',
    wallShadow: '#a88868',
    desk: '#8a6a48',
    wood: '#7a5a3a',
    floor: '#5a3a22',
    skyTop: '#4a5880',
    skyMid: '#e07850',
    skyBottom: '#f0a878',
    frame: '#5a4030',
    lamp: '#f0c070',
    lampGlow: 0.55,
    plant: '#3a5840',
    book: '#a04848',
    fg: '#fff4ea',
    accent: '#e8a060',
  },
  {
    hour: 19.5,
    wall: '#3a3028',
    wallShadow: '#2a221c',
    desk: '#4a382c',
    wood: '#5a4434',
    floor: '#241810',
    skyTop: '#1c2848',
    skyMid: '#485878',
    skyBottom: '#887888',
    frame: '#241c18',
    lamp: '#f0c070',
    lampGlow: 0.82,
    plant: '#2a4030',
    book: '#7a3840',
    fg: '#f4ece2',
    accent: '#e8b070',
  },
  {
    hour: 22,
    wall: '#241c18',
    wallShadow: '#161210',
    desk: '#322820',
    wood: '#423428',
    floor: '#18120e',
    skyTop: '#0e1624',
    skyMid: '#162030',
    skyBottom: '#223040',
    frame: '#181410',
    lamp: '#f0c878',
    lampGlow: 0.95,
    plant: '#243428',
    book: '#5a3038',
    fg: '#f2e8dc',
    accent: '#e8b878',
  },
  {
    hour: 24,
    wall: '#2a221c',
    wallShadow: '#1a1612',
    desk: '#3a2c22',
    wood: '#4a3828',
    floor: '#1c1410',
    skyTop: '#101828',
    skyMid: '#182838',
    skyBottom: '#243848',
    frame: '#1e1814',
    lamp: '#f0c878',
    lampGlow: 0.92,
    plant: '#2a4030',
    book: '#6a3840',
    fg: '#f4ece2',
    accent: '#e8b878',
  },
]

function sampleNook(hour: number): Omit<NookKeyframe, 'hour'> {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].hour <= h) i += 1
  const a = KEYFRAMES[i]
  const b = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)]
  const span = Math.max(1e-6, b.hour - a.hour)
  const t = smoothstep(0, 1, (h - a.hour) / span)
  const lerpN = (x: number, y: number) => x + (y - x) * t
  return {
    wall: mix(a.wall, b.wall, t),
    wallShadow: mix(a.wallShadow, b.wallShadow, t),
    desk: mix(a.desk, b.desk, t),
    wood: mix(a.wood, b.wood, t),
    floor: mix(a.floor, b.floor, t),
    skyTop: mix(a.skyTop, b.skyTop, t),
    skyMid: mix(a.skyMid, b.skyMid, t),
    skyBottom: mix(a.skyBottom, b.skyBottom, t),
    frame: mix(a.frame, b.frame, t),
    lamp: mix(a.lamp, b.lamp, t),
    lampGlow: lerpN(a.lampGlow, b.lampGlow),
    plant: mix(a.plant, b.plant, t),
    book: mix(a.book, b.book, t),
    fg: mix(a.fg, b.fg, t),
    accent: mix(a.accent, b.accent, t),
  }
}

export function getNookSceneState(date: Date = new Date()): NookSceneState {
  const hour = dayHour(date)
  return { ...sampleNook(hour), starsOpacity: scenicNightStarsOpacity(hour) }
}

export function nookFlatBg(scene: NookSceneState): string {
  return mix(scene.wall, scene.desk, 0.35)
}
