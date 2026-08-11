type WakeLockSentinelLike = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

let sentinel: WakeLockSentinelLike | null = null
let desired = false

async function requestLock(): Promise<void> {
  if (!desired) return
  if (!('wakeLock' in navigator)) return
  if (document.visibilityState !== 'visible') return

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lock = await (navigator as any).wakeLock.request('screen')
    sentinel = lock as WakeLockSentinelLike
    sentinel.addEventListener('release', () => {
      sentinel = null
      if (desired && document.visibilityState === 'visible') {
        void requestLock()
      }
    })
  } catch {
    // User gesture / policy / unsupported — fail quietly
    sentinel = null
  }
}

async function releaseLock(): Promise<void> {
  if (!sentinel) return
  try {
    await sentinel.release()
  } catch {
    // ignore
  } finally {
    sentinel = null
  }
}

function onVisibility() {
  if (document.visibilityState === 'visible' && desired) {
    void requestLock()
  }
}

document.addEventListener('visibilitychange', onVisibility)

export async function setKeepScreenOn(enabled: boolean): Promise<void> {
  desired = enabled
  if (enabled) {
    await requestLock()
  } else {
    await releaseLock()
  }
}

export function isWakeLockSupported(): boolean {
  return 'wakeLock' in navigator
}
