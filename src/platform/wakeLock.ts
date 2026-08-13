import { Capacitor } from '@capacitor/core'
import { KeepAwake } from '@capacitor-community/keep-awake'

type WakeLockSentinelLike = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

let sentinel: WakeLockSentinelLike | null = null
let desired = false
let nativeKeptAwake = false

function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

async function requestNative(): Promise<void> {
  if (!desired || nativeKeptAwake) return
  try {
    const { isSupported } = await KeepAwake.isSupported()
    if (!isSupported) return
    await KeepAwake.keepAwake()
    nativeKeptAwake = true
  } catch {
    nativeKeptAwake = false
  }
}

async function releaseNative(): Promise<void> {
  if (!nativeKeptAwake) return
  try {
    await KeepAwake.allowSleep()
  } catch {
    // ignore
  } finally {
    nativeKeptAwake = false
  }
}

async function requestWebLock(): Promise<void> {
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
        void requestWebLock()
      }
    })
  } catch {
    sentinel = null
  }
}

async function releaseWebLock(): Promise<void> {
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
  if (document.visibilityState === 'visible' && desired && !isNativeApp()) {
    void requestWebLock()
  }
}

document.addEventListener('visibilitychange', onVisibility)

export async function setKeepScreenOn(enabled: boolean): Promise<void> {
  desired = enabled
  if (isNativeApp()) {
    if (enabled) {
      await requestNative()
    } else {
      await releaseNative()
    }
    return
  }

  if (enabled) {
    await requestWebLock()
  } else {
    await releaseWebLock()
  }
}

export function isWakeLockSupported(): boolean {
  if (isNativeApp()) return true
  return 'wakeLock' in navigator
}
