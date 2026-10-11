import { useSyncExternalStore } from 'react'

const KEY = 'tchadvoiture.compare'
const MAX = 3
const EMPTY: string[] = []

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX)
  } catch {
    return []
  }
}

let current: string[] = typeof localStorage === 'undefined' ? EMPTY : load()
const listeners = new Set<() => void>()

function persist() {
  localStorage.setItem(KEY, JSON.stringify(current))
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY) return
    current = load()
    listeners.forEach((listener) => listener())
  })
}

export function useCompareIds() {
  return useSyncExternalStore(subscribe, () => current, () => EMPTY)
}

export function toggleCompare(id: string): { ok: boolean; reason?: 'full' } {
  if (!id) return { ok: false }
  if (current.includes(id)) {
    current = current.filter((item) => item !== id)
    persist()
    return { ok: true }
  }
  if (current.length >= MAX) return { ok: false, reason: 'full' }
  current = [...current, id]
  persist()
  return { ok: true }
}

export function removeCompare(id: string) {
  if (!current.includes(id)) return
  current = current.filter((item) => item !== id)
  persist()
}

export function clearCompare() {
  if (!current.length) return
  current = []
  persist()
}
