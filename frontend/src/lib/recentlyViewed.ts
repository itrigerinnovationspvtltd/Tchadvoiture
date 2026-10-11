const KEY = 'tchadvoiture.recentlyViewed'
const MAX = 20

export function readRecentlyViewed(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

export function rememberVehicle(id: string) {
  if (!id) return
  const next = [id, ...readRecentlyViewed().filter((item) => item !== id)].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function isRecentlyViewed(id: string) {
  return readRecentlyViewed().includes(id)
}
