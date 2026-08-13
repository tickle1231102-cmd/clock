import { scenicNightStarsOpacity } from './scenicTime'

/** Island theme — tropical lagoon with palms, sand, and gentle ripples. */

export const ISLAND_THEME_ID = 'island'

export type IslandSceneState = {
  skyTop: string
  skyMid: string
  skyBottom: string
  lagoonDeep: string
  lagoonMid: string
  lagoonShallow: string
  sand: string
  horizon: string
  palm: string
  rock: string
  sparkleOpacity: number
  waveOpacity: number
  glowOpacity: number
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

type IslandKeyframe = {
  hour: number
  skyTop: string
  skyMid: string
  skyBottom: string
  lagoonDeep: string
  lagoonMid: string
  lagoonShallow: string
  sand: string
  horizon: string
  palm: string
  rock: string
  fg: string
  accent: string
  sparkleOpacity: number
  waveOpacity: number
  glowOpacity: number
}

const KEYFRAMES: IslandKeyframe[] = [
  {
    hour: 0,
    skyTop: '#060c18',
    skyMid: '#0e1830',
    skyBottom: '#1a2848',
    lagoonDeep: '#0a1828',
    lagoonMid: '#143040',
    lagoonShallow: '#1e4050',
    sand: '#1a1814',
    horizon: '#182838',
    palm: '#0a1210',
    rock: '#121820',
    fg: '#e8f0f8',
    accent: '#88a8c8',
    sparkleOpacity: 0.28,
    waveOpacity: 0.42,
    glowOpacity: 0.15,
  },
  {
    hour: 5.4,
    skyTop: '#3a4868',
    skyMid: '#a87868',
    skyBottom: '#f0b888',
    lagoonDeep: '#284858',
    lagoonMid: '#487080',
    lagoonShallow: '#6898a8',
    sand: '#c8a878',
    horizon: '#e8a878',
    palm: '#1a3828',
    rock: '#5a4838',
    fg: '#fff8f0',
    accent: '#f0b878',
    sparkleOpacity: 0.35,
    waveOpacity: 0.5,
    glowOpacity: 0.45,
  },
  {
    hour: 7.2,
    skyTop: '#58c8e8',
    skyMid: '#88d8f0',
    skyBottom: '#f0e0c0',
    lagoonDeep: '#1a8898',
    lagoonMid: '#38b0b8',
    lagoonShallow: '#68ccd0',
    sand: '#ecd8a8',
    horizon: '#f0d8b0',
    palm: '#1a6848',
    rock: '#8a7858',
    fg: '#f8fcfd',
    accent: '#f0c878',
    sparkleOpacity: 0.72,
    waveOpacity: 0.62,
    glowOpacity: 0.55,
  },
  {
    hour: 11,
    skyTop: '#48b8d8',
    skyMid: '#78cce8',
    skyBottom: '#c8e8f0',
    lagoonDeep: '#188898',
    lagoonMid: '#30a8b0',
    lagoonShallow: '#58c8c8',
    sand: '#e8d0a0',
    horizon: '#b8d8e0',
    palm: '#186040',
    rock: '#907860',
    fg: '#f5fafc',
    accent: '#e8b868',
    sparkleOpacity: 0.82,
    waveOpacity: 0.68,
    glowOpacity: 0.48,
  },
  {
    hour: 15,
    skyTop: '#50b0d0',
    skyMid: '#70c0d8',
    skyBottom: '#b8d4dc',
    lagoonDeep: '#1a7888',
    lagoonMid: '#3898a0',
    lagoonShallow: '#58b8b8',
    sand: '#dcc898',
    horizon: '#a8c8d0',
    palm: '#185838',
    rock: '#887050',
    fg: '#f4f8fa',
    accent: '#d8b060',
    sparkleOpacity: 0.75,
    waveOpacity: 0.65,
    glowOpacity: 0.42,
  },
  {
    hour: 17.8,
    skyTop: '#3a5078',
    skyMid: '#c87858',
    skyBottom: '#f0a060',
    lagoonDeep: '#284858',
    lagoonMid: '#507080',
    lagoonShallow: '#889898',
    sand: '#d8a878',
    horizon: '#e08858',
    palm: '#143028',
    rock: '#6a5040',
    fg: '#fff6ee',
    accent: '#f0a868',
    sparkleOpacity: 0.52,
    waveOpacity: 0.58,
    glowOpacity: 0.38,
  },
  {
    hour: 19.5,
    skyTop: '#141e38',
    skyMid: '#3a3a58',
    skyBottom: '#6a4860',
    lagoonDeep: '#0e1828',
    lagoonMid: '#243848',
    lagoonShallow: '#405868',
    sand: '#3a3848',
    horizon: '#584860',
    palm: '#0c1818',
    rock: '#282830',
    fg: '#eef0f6',
    accent: '#a898b0',
    sparkleOpacity: 0.22,
    waveOpacity: 0.48,
    glowOpacity: 0.22,
  },
  {
    hour: 22,
    skyTop: '#060b18',
    skyMid: '#0c1528',
    skyBottom: '#162238',
    lagoonDeep: '#081018',
    lagoonMid: '#102028',
    lagoonShallow: '#183038',
    sand: '#141820',
    horizon: '#182838',
    palm: '#0a1010',
    rock: '#101820',
    fg: '#e6ecf4',
    accent: '#7a98b8',
    sparkleOpacity: 0.25,
    waveOpacity: 0.4,
    glowOpacity: 0.12,
  },
  {
    hour: 24,
    skyTop: '#060c18',
    skyMid: '#0e1830',
    skyBottom: '#1a2848',
    lagoonDeep: '#0a1828',
    lagoonMid: '#143040',
    lagoonShallow: '#1e4050',
    sand: '#1a1814',
    horizon: '#182838',
    palm: '#0a1210',
    rock: '#121820',
    fg: '#e8f0f8',
    accent: '#88a8c8',
    sparkleOpacity: 0.28,
    waveOpacity: 0.42,
    glowOpacity: 0.15,
  },
]

function sampleIsland(hour: number): Omit<IslandKeyframe, 'hour'> {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].hour <= h) i += 1
  const a = KEYFRAMES[i]
  const b = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)]
  const span = Math.max(1e-6, b.hour - a.hour)
  const t = smoothstep(0, 1, (h - a.hour) / span)
  const lerpN = (x: number, y: number) => x + (y - x) * t
  return {
    skyTop: mix(a.skyTop, b.skyTop, t),
    skyMid: mix(a.skyMid, b.skyMid, t),
    skyBottom: mix(a.skyBottom, b.skyBottom, t),
    lagoonDeep: mix(a.lagoonDeep, b.lagoonDeep, t),
    lagoonMid: mix(a.lagoonMid, b.lagoonMid, t),
    lagoonShallow: mix(a.lagoonShallow, b.lagoonShallow, t),
    sand: mix(a.sand, b.sand, t),
    horizon: mix(a.horizon, b.horizon, t),
    palm: mix(a.palm, b.palm, t),
    rock: mix(a.rock, b.rock, t),
    fg: mix(a.fg, b.fg, t),
    accent: mix(a.accent, b.accent, t),
    sparkleOpacity: lerpN(a.sparkleOpacity, b.sparkleOpacity),
    waveOpacity: lerpN(a.waveOpacity, b.waveOpacity),
    glowOpacity: lerpN(a.glowOpacity, b.glowOpacity),
  }
}

export function getIslandSceneState(date: Date = new Date()): IslandSceneState {
  const hour = dayHour(date)
  return { ...sampleIsland(hour), starsOpacity: scenicNightStarsOpacity(hour) }
}

export function islandFlatBg(scene: IslandSceneState): string {
  return mix(scene.lagoonMid, scene.skyMid, 0.38)
}
