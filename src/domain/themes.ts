import type { FontFamilyId } from './settings'
import {
  getSolarSkyState,
  SKYLIGHT_THEME_ID,
  solarSkyFlatBg,
  type SolarSkyState,
} from './solarSky'

export type ThemeTokens = {
  id: string
  name: string
  bg: string
  fg: string
  accent: string
  fontFamily: FontFamilyId
  /** Optional settings swatch override (CSS background). */
  swatch?: string
  /** Theme updates continuously with clock time. */
  dynamic?: boolean
}

/** Softer, more atmospheric presets (warm neutrals, muted accents, achromatic). */
export const THEME_PRESETS: ThemeTokens[] = [
  {
    id: 'midnight',
    name: 'Ink',
    bg: '#141218',
    fg: '#f0e8e0',
    accent: '#c6a58a',
    fontFamily: 'system',
  },
  {
    id: 'slate',
    name: 'Mist',
    bg: '#1a2229',
    fg: '#e7eef3',
    accent: '#9bb0bd',
    fontFamily: 'system',
  },
  {
    id: 'paper',
    name: 'Parchment',
    bg: '#f2ebe2',
    fg: '#3b322c',
    accent: '#b08a6a',
    fontFamily: 'serif',
  },
  {
    id: 'ember',
    name: 'Ember',
    bg: '#1c110f',
    fg: '#f4e3d5',
    accent: '#d49274',
    fontFamily: 'display',
  },
  {
    id: 'forest',
    name: 'Moss',
    bg: '#131a15',
    fg: '#e5ece4',
    accent: '#8fa882',
    fontFamily: 'system',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    bg: '#121212',
    fg: '#ececec',
    accent: '#9a9a9a',
    fontFamily: 'system',
  },
  {
    id: 'ash',
    name: 'Ash',
    bg: '#2a2a2a',
    fg: '#d8d8d8',
    accent: '#a8a8a8',
    fontFamily: 'system',
  },
  {
    id: 'chalk',
    name: 'Chalk',
    bg: '#ececec',
    fg: '#2a2a2a',
    accent: '#6e6e6e',
    fontFamily: 'serif',
  },
  {
    id: 'bone',
    name: 'Bone',
    bg: '#f4f4f1',
    fg: '#242424',
    accent: '#7a7a7a',
    fontFamily: 'display',
  },
  {
    id: SKYLIGHT_THEME_ID,
    name: 'Skylight',
    bg: '#6eb0e4',
    fg: '#132a40',
    accent: '#f0b45a',
    fontFamily: 'system',
    dynamic: true,
    swatch:
      'linear-gradient(160deg, #3b8fd0 0%, #f0a060 48%, #10182c 100%)',
  },
]

/** Removed presets remapped on load. */
const THEME_ALIASES: Record<string, string> = {
  ocean: 'slate',
  graphite: 'charcoal',
  harbor: 'slate',
}

export function migrateThemeId(id: string): string {
  return THEME_ALIASES[id] ?? id
}

export const FONT_OPTIONS: { id: FontFamilyId; label: string; css: string }[] = [
  {
    id: 'system',
    label: 'System',
    css: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    id: 'serif',
    label: 'Serif',
    css: 'Georgia, "Times New Roman", serif',
  },
  {
    id: 'rounded',
    label: 'Rounded',
    css: '"SF Pro Rounded", "Hiragino Maru Gothic ProN", ui-rounded, system-ui, sans-serif',
  },
  {
    id: 'monospace',
    label: 'Mono',
    css: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  {
    id: 'display',
    label: 'Display',
    css: '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
  },
]

export function getThemeById(id: string): ThemeTokens | undefined {
  return THEME_PRESETS.find((t) => t.id === id)
}

export function fontCss(id: FontFamilyId): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.css ?? FONT_OPTIONS[0].css
}

export type ResolvedTheme = {
  id: string
  bg: string
  fg: string
  accent: string
  fontFamily: FontFamilyId
  sky?: SolarSkyState
}

/** Single source of truth for colors/fonts applied to the DOM. */
export function resolveTheme(
  settings: {
    themeId: string
    custom: {
      bg: string
      fg: string
      accent: string
      fontFamily: FontFamilyId
    }
  },
  now: Date = new Date(),
): ResolvedTheme {
  if (settings.themeId === 'custom') {
    return {
      id: 'custom',
      bg: settings.custom.bg,
      fg: settings.custom.fg,
      accent: settings.custom.accent,
      fontFamily: settings.custom.fontFamily,
    }
  }

  const themeId = migrateThemeId(settings.themeId)

  if (themeId === SKYLIGHT_THEME_ID) {
    const sky = getSolarSkyState(now)
    const preset = getThemeById(SKYLIGHT_THEME_ID)!
    return {
      id: SKYLIGHT_THEME_ID,
      bg: solarSkyFlatBg(sky),
      fg: sky.fg,
      accent: sky.accent,
      fontFamily: preset.fontFamily,
      sky,
    }
  }

  const preset = getThemeById(themeId)
  if (preset) {
    return {
      id: preset.id,
      bg: preset.bg,
      fg: preset.fg,
      accent: preset.accent,
      fontFamily: preset.fontFamily,
    }
  }

  return {
    id: 'custom',
    bg: settings.custom.bg,
    fg: settings.custom.fg,
    accent: settings.custom.accent,
    fontFamily: settings.custom.fontFamily,
  }
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

function withAlpha(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

function mix(a: string, b: string, t: number): string {
  const A = parseHex(a)
  const B = parseHex(b)
  if (!A || !B) return a
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t)
}

function luminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
}

/** Soft dial surface + ink derived from the active theme. */
export function dialTokens(theme: ResolvedTheme): {
  plate: string
  stroke: string
  ink: string
  wedge: string
  knob: string
  knobInner: string
} {
  const lightBg = luminance(theme.bg) > 0.55
  const plate = lightBg
    ? mix(theme.bg, '#ffffff', 0.55)
    : mix('#f3ebe3', theme.accent, 0.12)
  const ink = lightBg ? mix(theme.fg, '#1a1512', 0.35) : mix('#2a2420', theme.fg, 0.15)
  return {
    plate,
    stroke: mix(plate, theme.accent, 0.28),
    ink,
    wedge: theme.accent,
    knob: mix(plate, ink, 0.12),
    knobInner: mix(plate, ink, 0.22),
  }
}

export function applySkyVars(sky: SolarSkyState | undefined, root: HTMLElement) {
  if (!sky) {
    root.style.removeProperty('--sky-top')
    root.style.removeProperty('--sky-mid')
    root.style.removeProperty('--sky-bottom')
    root.style.removeProperty('--sky-haze')
    root.style.removeProperty('--sun-x')
    root.style.removeProperty('--sun-y')
    root.style.removeProperty('--sun-opacity')
    root.style.removeProperty('--sun-scale')
    root.style.removeProperty('--sun-glow')
    root.style.removeProperty('--moon-x')
    root.style.removeProperty('--moon-y')
    root.style.removeProperty('--moon-opacity')
    root.style.removeProperty('--moon-scale')
    root.style.removeProperty('--moon-glow')
    root.style.removeProperty('--stars-opacity')
    return
  }

  root.style.setProperty('--sky-top', sky.bgTop)
  root.style.setProperty('--sky-mid', sky.bgMid)
  root.style.setProperty('--sky-bottom', sky.bgBottom)
  root.style.setProperty('--sky-haze', sky.haze)
  root.style.setProperty('--sun-x', `${sky.sun.x}%`)
  root.style.setProperty('--sun-y', `${sky.sun.y}%`)
  root.style.setProperty('--sun-opacity', String(sky.sun.opacity))
  root.style.setProperty('--sun-scale', String(sky.sun.scale))
  root.style.setProperty('--sun-glow', String(sky.sun.glow))
  root.style.setProperty('--moon-x', `${sky.moon.x}%`)
  root.style.setProperty('--moon-y', `${sky.moon.y}%`)
  root.style.setProperty('--moon-opacity', String(sky.moon.opacity))
  root.style.setProperty('--moon-scale', String(sky.moon.scale))
  root.style.setProperty('--moon-glow', String(sky.moon.glow))
  root.style.setProperty('--stars-opacity', String(sky.starsOpacity))
}

export function applyThemeVars(theme: ResolvedTheme, root: HTMLElement = document.documentElement) {
  const dial = dialTokens(theme)

  root.style.setProperty('--bg', theme.bg)
  root.style.setProperty('--fg', theme.fg)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--font', fontCss(theme.fontFamily))
  root.style.setProperty('--hand-hour', theme.fg)
  root.style.setProperty('--hand-minute', theme.fg)
  root.style.setProperty('--hand-second', theme.accent)
  root.style.setProperty('--face-border', withAlpha(theme.fg, 0.32))
  root.style.setProperty('--face-tick', withAlpha(theme.fg, 0.5))
  root.style.setProperty('--sheet-bg', mix(theme.bg, theme.fg, 0.04))
  root.style.setProperty('--sheet-border', withAlpha(theme.fg, 0.16))
  root.style.setProperty('--control-bg', withAlpha(theme.fg, 0.09))

  root.style.setProperty('--dial-plate', dial.plate)
  root.style.setProperty('--dial-stroke', dial.stroke)
  root.style.setProperty('--dial-ink', dial.ink)
  root.style.setProperty('--pomodoro-wedge', dial.wedge)
  root.style.setProperty('--dial-knob', dial.knob)
  root.style.setProperty('--dial-knob-inner', dial.knobInner)
  root.style.setProperty('--dial-edge', withAlpha(dial.ink, 0.4))
  root.style.setProperty('--dial-shadow', withAlpha(theme.bg, 0.35))

  applySkyVars(theme.sky, root)
  root.dataset.theme = theme.id

  if (root === document.documentElement) {
    document.body.style.background = theme.sky
      ? `linear-gradient(180deg, ${theme.sky.bgTop}, ${theme.sky.bgBottom})`
      : theme.bg
    document.body.style.color = theme.fg
    document.body.style.fontFamily = fontCss(theme.fontFamily)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme.bg)
  }
}
