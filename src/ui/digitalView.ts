import type { ClockSnapshot } from '../domain/clockModel'
import type { DigitalStyle } from '../domain/clockStyles'
import { isStructuredDigital } from '../domain/clockStyles'

function flipUnit(value: string, key: string): string {
  const chars = value.split('')
  return chars
    .map(
      (ch, i) => `
      <span class="flip-card" data-flip-key="${key}-${i}">
        <span class="flip-top"><span class="flip-digit">${ch}</span></span>
        <span class="flip-bottom"><span class="flip-digit">${ch}</span></span>
      </span>
    `,
    )
    .join('')
}

function buildFlipMarkup(snapshot: ClockSnapshot, showSeconds: boolean): string {
  const period = snapshot.period
    ? `<span class="flip-period">${snapshot.period}</span>`
    : ''
  const seconds = showSeconds
    ? `<span class="flip-colon">:</span><span class="flip-unit">${flipUnit(snapshot.padSeconds, 's')}</span>`
    : ''
  return `
    <div class="flip-board" aria-hidden="true">
      <span class="flip-unit">${flipUnit(snapshot.padHours, 'h')}</span>
      <span class="flip-colon">:</span>
      <span class="flip-unit">${flipUnit(snapshot.padMinutes, 'm')}</span>
      ${seconds}
      ${period}
    </div>
    <span class="time sr-only">${snapshot.digitalTime}</span>
  `
}

function buildVerticalMarkup(snapshot: ClockSnapshot, showSeconds: boolean): string {
  const period = snapshot.period
    ? `<span class="vert-period">${snapshot.period}</span>`
    : ''
  return `
    <div class="vert-stack" aria-hidden="true">
      <span class="vert-num">${snapshot.padHours}</span>
      <span class="vert-sep">·</span>
      <span class="vert-num">${snapshot.padMinutes}</span>
      ${
        showSeconds
          ? `<span class="vert-sep">·</span><span class="vert-num vert-sec">${snapshot.padSeconds}</span>`
          : ''
      }
      ${period}
    </div>
    <span class="time sr-only">${snapshot.digitalTime}</span>
  `
}

function buildRetroMarkup(snapshot: ClockSnapshot, showSeconds: boolean): string {
  const core = showSeconds
    ? `${snapshot.padHours}:${snapshot.padMinutes}:${snapshot.padSeconds}`
    : `${snapshot.padHours}:${snapshot.padMinutes}`
  const period = snapshot.period ? ` ${snapshot.period}` : ''
  return `
    <div class="retro-panel" aria-hidden="true">
      <div class="retro-glow"></div>
      <span class="retro-readout">${core}${period}</span>
    </div>
    <span class="time sr-only">${snapshot.digitalTime}</span>
  `
}

export function createDigitalView(host: HTMLElement) {
  let lastStyle: DigitalStyle | null = null
  let lastStructuredKey = ''

  function ensurePlainTime(): HTMLElement {
    let timeEl = host.querySelector('.time') as HTMLElement | null
    if (!timeEl || host.querySelector('.flip-board, .vert-stack, .retro-panel')) {
      host.innerHTML = '<span class="time">00:00</span>'
      timeEl = host.querySelector('.time') as HTMLElement
    }
    return timeEl
  }

  function update(
    snapshot: ClockSnapshot,
    options: {
      style: DigitalStyle
      showSeconds: boolean
      structured: boolean
    },
  ) {
    const { style, showSeconds, structured } = options
    host.dataset.digitalLayout = structured && isStructuredDigital(style) ? style : 'plain'

    if (!structured || !isStructuredDigital(style)) {
      const timeEl = ensurePlainTime()
      timeEl.textContent = snapshot.digitalTime
      lastStyle = style
      lastStructuredKey = ''
      return timeEl
    }

    const key = `${style}|${snapshot.padHours}|${snapshot.padMinutes}|${snapshot.padSeconds}|${snapshot.period}|${showSeconds}`
    if (style !== lastStyle || !host.querySelector('[aria-hidden="true"]')) {
      if (style === 'flip') host.innerHTML = buildFlipMarkup(snapshot, showSeconds)
      else if (style === 'vertical') host.innerHTML = buildVerticalMarkup(snapshot, showSeconds)
      else host.innerHTML = buildRetroMarkup(snapshot, showSeconds)
      lastStyle = style
      lastStructuredKey = key
      return host.querySelector('.time') as HTMLElement
    }

    if (key === lastStructuredKey) {
      return host.querySelector('.time') as HTMLElement
    }

    if (style === 'flip') {
      // Update digits in place for subtle continuity
      const map: Array<[string, string]> = [
        ['h', snapshot.padHours],
        ['m', snapshot.padMinutes],
      ]
      if (showSeconds) map.push(['s', snapshot.padSeconds])
      for (const [unit, value] of map) {
        value.split('').forEach((ch, i) => {
          const card = host.querySelector(`[data-flip-key="${unit}-${i}"]`)
          if (!card) return
          card.querySelectorAll('.flip-digit').forEach((el) => {
            el.textContent = ch
          })
        })
      }
      const period = host.querySelector('.flip-period')
      if (period) period.textContent = snapshot.period
      const sr = host.querySelector('.time')
      if (sr) sr.textContent = snapshot.digitalTime
    } else if (style === 'vertical') {
      host.innerHTML = buildVerticalMarkup(snapshot, showSeconds)
    } else {
      host.innerHTML = buildRetroMarkup(snapshot, showSeconds)
    }

    lastStructuredKey = key
    lastStyle = style
    return host.querySelector('.time') as HTMLElement
  }

  function getTimeEl(): HTMLElement {
    return (host.querySelector('.time') as HTMLElement) ?? ensurePlainTime()
  }

  return { update, getTimeEl, el: host }
}

export type DigitalView = ReturnType<typeof createDigitalView>
