import type { ClockSnapshot } from '../domain/clockModel'
import type { AnalogStyle } from '../domain/clockStyles'

function polar(degFromTop: number, radius: number) {
  const rad = (degFromTop * Math.PI) / 180
  return {
    x: 50 + Math.sin(rad) * radius,
    y: 50 - Math.cos(rad) * radius,
  }
}

function classicTicks(style: AnalogStyle): string {
  const ticks: string[] = []
  for (let i = 0; i < 60; i++) {
    const isHour = i % 5 === 0
    if (style === 'minimal' && !isHour) continue
    const angle = i * 6
    const outer = 46
    const inner = isHour ? (style === 'ticks' ? 38 : 40) : 43.5
    const a = polar(angle, inner)
    const b = polar(angle, outer)
    ticks.push(
      `<line class="tick ${isHour ? 'tick-hour' : 'tick-minute'}" x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" />`,
    )
  }
  return ticks.join('')
}

function hourDots(count: number, radius: number, className: string): string {
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    const p = polar(i * (360 / count), radius)
    parts.push(
      `<circle class="${className}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${i % 3 === 0 ? 1.35 : 0.9}" />`,
    )
  }
  return parts.join('')
}

function bauhausMarks(): string {
  const labels = [
    { n: '12', deg: 0 },
    { n: '3', deg: 90 },
    { n: '6', deg: 180 },
    { n: '9', deg: 270 },
  ]
  return labels
    .map((l) => {
      const p = polar(l.deg, 34)
      return `<text class="face-num" x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central">${l.n}</text>`
    })
    .join('')
}

function bloomPetals(): string {
  const petals: string[] = []
  for (let i = 0; i < 12; i++) {
    const deg = i * 30
    const tip = polar(deg, 44)
    const left = polar(deg - 8, 36)
    const right = polar(deg + 8, 36)
    petals.push(
      `<path class="petal" d="M ${left.x.toFixed(2)} ${left.y.toFixed(2)} Q ${tip.x.toFixed(2)} ${tip.y.toFixed(2)} ${right.x.toFixed(2)} ${right.y.toFixed(2)}" />`,
    )
  }
  return petals.join('')
}

function orbitRings(): string {
  return `
    <circle class="orbit-ring r1" cx="50" cy="50" r="18" />
    <circle class="orbit-ring r2" cx="50" cy="50" r="30" />
    <circle class="orbit-ring r3" cx="50" cy="50" r="42" />
    ${hourDots(12, 42, 'orbit-dot')}
  `
}

function handsMarkup(
  style: AnalogStyle,
  showSeconds: boolean,
): string {
  if (style === 'bauhaus') {
    return `
      <rect class="hand hand-hour bauhaus-hour" x="47.2" y="22" width="5.6" height="30" rx="0.8" />
      <rect class="hand hand-minute bauhaus-minute" x="48.2" y="14" width="3.6" height="38" rx="0.6" />
      ${
        showSeconds
          ? '<line class="hand hand-second" x1="50" y1="54" x2="50" y2="14" />'
          : ''
      }
      <circle class="pivot" cx="50" cy="50" r="3.2" />
    `
  }

  if (style === 'skeleton') {
    return `
      <line class="hand hand-hour" x1="50" y1="50" x2="50" y2="26" />
      <line class="hand hand-minute" x1="50" y1="50" x2="50" y2="16" />
      ${
        showSeconds
          ? '<line class="hand hand-second" x1="50" y1="58" x2="50" y2="12" />'
          : ''
      }
      <circle class="pivot-ring" cx="50" cy="50" r="4.5" />
      <circle class="pivot" cx="50" cy="50" r="1.6" />
    `
  }

  if (style === 'noir') {
    return `
      <line class="hand hand-hour" x1="50" y1="50" x2="50" y2="24" />
      <line class="hand hand-minute" x1="50" y1="50" x2="50" y2="14" />
      ${
        showSeconds
          ? '<line class="hand hand-second" x1="50" y1="56" x2="50" y2="12" />'
          : ''
      }
      <circle class="pivot" cx="50" cy="50" r="2.8" />
    `
  }

  return `
    <line class="hand hand-hour" x1="50" y1="50" x2="50" y2="28" />
    <line class="hand hand-minute" x1="50" y1="50" x2="50" y2="20" />
    ${
      showSeconds
        ? '<line class="hand hand-second" x1="50" y1="54" x2="50" y2="16" />'
        : ''
    }
    <circle class="pivot" cx="50" cy="50" r="2.4" />
  `
}

function faceMarkup(style: AnalogStyle): string {
  switch (style) {
    case 'lunar':
      return `
        <circle class="face-fill lunar-fill" cx="50" cy="50" r="46" />
        <circle class="face-ring soft" cx="50" cy="50" r="44" />
        <path class="crescent" d="M 62 28 A 18 18 0 1 0 62 72 A 14 14 0 1 1 62 28 Z" />
        ${hourDots(12, 40, 'lunar-dot')}
      `
    case 'bauhaus':
      return `
        <circle class="face-fill bauhaus-fill" cx="50" cy="50" r="47" />
        <circle class="face-ring" cx="50" cy="50" r="47" />
        ${bauhausMarks()}
        ${classicTicks('minimal')}
      `
    case 'orbit':
      return `
        <circle class="face-fill orbit-fill" cx="50" cy="50" r="47" />
        ${orbitRings()}
      `
    case 'bloom':
      return `
        <circle class="face-fill bloom-fill" cx="50" cy="50" r="46" />
        ${bloomPetals()}
        <circle class="face-ring soft" cx="50" cy="50" r="28" />
      `
    case 'skeleton':
      return `
        <circle class="face-ring skeleton-ring" cx="50" cy="50" r="47" />
        <circle class="face-ring skeleton-inner" cx="50" cy="50" r="32" />
        ${classicTicks('minimal')}
      `
    case 'noir':
      return `
        <circle class="face-fill noir-fill" cx="50" cy="50" r="47" />
        ${classicTicks('ticks')}
      `
    case 'dawn':
      return `
        <defs>
          <radialGradient id="dawn-grad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="var(--dawn-hi, #fff6ea)" />
            <stop offset="100%" stop-color="var(--dawn-lo, #e8c9a8)" />
          </radialGradient>
        </defs>
        <circle class="face-fill dawn-fill" cx="50" cy="50" r="47" fill="url(#dawn-grad)" />
        <circle class="face-ring soft" cx="50" cy="50" r="47" />
        ${hourDots(12, 41, 'dawn-dot')}
      `
    default:
      return `
        <circle class="face-ring" cx="50" cy="50" r="47" />
        ${classicTicks(style)}
      `
  }
}

export function createAnalogView(container: HTMLElement) {
  const wrap = document.createElement('div')
  wrap.className = 'analog-wrap'
  wrap.hidden = true

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('analog-face')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('aria-hidden', 'true')

  wrap.appendChild(svg)
  container.appendChild(wrap)

  let hourHand: SVGElement | null = null
  let minuteHand: SVGElement | null = null
  let secondHand: SVGElement | null = null
  let currentStyle: AnalogStyle | null = null
  let currentShowSeconds = false
  /** Unwrapped angles so CSS transitions never spin backward across 360→0. */
  let hourAngleLive = 0
  let minuteAngleLive = 0
  let secondAngleLive = 0

  /** Continue forward from the last displayed angle toward the 0–360 target. */
  function unwrapAngle(previous: number, targetMod360: number): number {
    const prevMod = ((previous % 360) + 360) % 360
    let delta = targetMod360 - prevMod
    if (delta < -180) delta += 360
    if (delta > 180) delta -= 360
    return previous + delta
  }

  function renderStructure(style: AnalogStyle, showSeconds: boolean) {
    currentStyle = style
    currentShowSeconds = showSeconds
    wrap.dataset.analogStyle = style
    svg.dataset.analogStyle = style
    svg.innerHTML = `${faceMarkup(style)}${handsMarkup(style, showSeconds)}`
    hourHand = svg.querySelector('.hand-hour')
    minuteHand = svg.querySelector('.hand-minute')
    secondHand = svg.querySelector('.hand-second')
    // Reset live angles so a style rebuild doesn't jump from a huge unwrapped value.
    hourAngleLive = 0
    minuteAngleLive = 0
    secondAngleLive = 0
  }

  function setVisible(visible: boolean) {
    wrap.hidden = !visible
  }

  function update(
    snapshot: ClockSnapshot,
    options: { style: AnalogStyle; showSeconds: boolean },
  ) {
    const rebuilt =
      currentStyle !== options.style || currentShowSeconds !== options.showSeconds
    if (rebuilt) {
      renderStructure(options.style, options.showSeconds)
      hourAngleLive = snapshot.hourAngle
      minuteAngleLive = snapshot.minuteAngle
      secondAngleLive = snapshot.secondAngle
    } else {
      hourAngleLive = unwrapAngle(hourAngleLive, snapshot.hourAngle)
      minuteAngleLive = unwrapAngle(minuteAngleLive, snapshot.minuteAngle)
      secondAngleLive = unwrapAngle(secondAngleLive, snapshot.secondAngle)
    }

    const apply = (el: SVGElement | null, angle: number) => {
      if (!el) return
      if (rebuilt) {
        const prev = el.style.transition
        el.style.transition = 'none'
        el.style.transform = `rotate(${angle}deg)`
        // Force reflow then restore transition for subsequent ticks.
        void el.getBoundingClientRect()
        el.style.transition = prev
      } else {
        el.style.transform = `rotate(${angle}deg)`
      }
    }

    apply(hourHand, hourAngleLive)
    apply(minuteHand, minuteAngleLive)
    apply(secondHand, secondAngleLive)
  }

  renderStructure('classic', false)

  return { setVisible, update, el: wrap }
}

export type AnalogView = ReturnType<typeof createAnalogView>
