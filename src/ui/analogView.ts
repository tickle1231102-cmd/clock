import type { ClockSnapshot } from '../domain/clockModel'
import type { AnalogStyle } from '../domain/settings'

function buildTicks(style: AnalogStyle): string {
  const ticks: string[] = []
  for (let i = 0; i < 60; i++) {
    const isHour = i % 5 === 0
    if (style === 'minimal' && !isHour) continue

    const angle = (i * 6 * Math.PI) / 180
    const outer = 46
    const inner = isHour ? (style === 'ticks' ? 38 : 40) : 43.5
    const x1 = 50 + Math.sin(angle) * inner
    const y1 = 50 - Math.cos(angle) * inner
    const x2 = 50 + Math.sin(angle) * outer
    const y2 = 50 - Math.cos(angle) * outer
    ticks.push(
      `<line class="tick ${isHour ? 'tick-hour' : 'tick-minute'}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" />`,
    )
  }
  return ticks.join('')
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

  let hourHand: SVGLineElement | null = null
  let minuteHand: SVGLineElement | null = null
  let secondHand: SVGLineElement | null = null
  let currentStyle: AnalogStyle | null = null

  function renderStructure(style: AnalogStyle, showSeconds: boolean) {
    currentStyle = style
    svg.innerHTML = `
      <circle class="face-ring" cx="50" cy="50" r="47" />
      ${buildTicks(style)}
      <line class="hand hand-hour" x1="50" y1="50" x2="50" y2="28" />
      <line class="hand hand-minute" x1="50" y1="50" x2="50" y2="20" />
      ${
        showSeconds
          ? '<line class="hand hand-second" x1="50" y1="54" x2="50" y2="16" />'
          : ''
      }
      <circle class="pivot" cx="50" cy="50" r="2.4" />
    `
    hourHand = svg.querySelector('.hand-hour')
    minuteHand = svg.querySelector('.hand-minute')
    secondHand = svg.querySelector('.hand-second')
  }

  function setVisible(visible: boolean) {
    wrap.hidden = !visible
  }

  function update(
    snapshot: ClockSnapshot,
    options: { style: AnalogStyle; showSeconds: boolean },
  ) {
    if (
      currentStyle !== options.style ||
      Boolean(secondHand) !== options.showSeconds
    ) {
      renderStructure(options.style, options.showSeconds)
    }

    if (hourHand) {
      hourHand.style.transform = `rotate(${snapshot.hourAngle}deg)`
    }
    if (minuteHand) {
      minuteHand.style.transform = `rotate(${snapshot.minuteAngle}deg)`
    }
    if (secondHand) {
      secondHand.style.transform = `rotate(${snapshot.secondAngle}deg)`
    }
  }

  renderStructure('classic', false)

  return { setVisible, update, el: wrap }
}

export type AnalogView = ReturnType<typeof createAnalogView>
