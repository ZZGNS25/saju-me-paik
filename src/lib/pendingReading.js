import { PENDING_READING_KEY } from './constants'

export function savePendingReading(snapshot) {
  try {
    window.sessionStorage.setItem(PENDING_READING_KEY, JSON.stringify(snapshot))
  } catch {
    // sessionStorage 불가 시 무시
  }
}

export function readPendingReading() {
  try {
    const raw = window.sessionStorage.getItem(PENDING_READING_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearPendingReading() {
  try {
    window.sessionStorage.removeItem(PENDING_READING_KEY)
  } catch {
    // ignore
  }
}
