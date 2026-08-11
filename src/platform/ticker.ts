export type TickMode = 'minute' | 'second'

type TickerOptions = {
  onTick: (now: Date) => void
  getMode: () => TickMode
}

/**
 * Adaptive ticker: aligns to next second/minute boundary,
 * pauses when the page is hidden.
 */
export function createTicker({ onTick, getMode }: TickerOptions) {
  let timeoutId: number | null = null
  let intervalId: number | null = null
  let running = false

  function clearTimers() {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
      timeoutId = null
    }
    if (intervalId !== null) {
      window.clearInterval(intervalId)
      intervalId = null
    }
  }

  function msUntilNextBoundary(mode: TickMode, now: Date): number {
    if (mode === 'second') {
      return 1000 - (now.getMilliseconds() % 1000)
    }
    const msIntoMinute =
      now.getSeconds() * 1000 + now.getMilliseconds()
    return 60_000 - (msIntoMinute % 60_000)
  }

  function schedule() {
    clearTimers()
    if (!running || document.visibilityState === 'hidden') return

    const mode = getMode()
    const now = new Date()
    onTick(now)

    const delay = msUntilNextBoundary(mode, now)
    timeoutId = window.setTimeout(() => {
      onTick(new Date())
      const period = mode === 'second' ? 1000 : 60_000
      intervalId = window.setInterval(() => {
        if (document.visibilityState === 'hidden') return
        // Re-check mode in case settings changed mid-interval
        if (getMode() !== mode) {
          schedule()
          return
        }
        onTick(new Date())
      }, period)
    }, delay)
  }

  function start() {
    running = true
    schedule()
  }

  function stop() {
    running = false
    clearTimers()
  }

  function reschedule() {
    if (running) schedule()
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      clearTimers()
    } else if (running) {
      schedule()
    }
  }

  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', stop)
  window.addEventListener('pageshow', () => {
    if (running) schedule()
  })

  return {
    start,
    stop,
    reschedule,
    dispose() {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    },
  }
}
