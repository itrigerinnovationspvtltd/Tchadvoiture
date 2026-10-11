import { apiUrl } from '@/lib/api'

const ACCESS = 'admin_access'
const REFRESH = 'admin_refresh'

export function getAccess() {
  return localStorage.getItem(ACCESS)
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS, accessToken)
  localStorage.setItem(REFRESH, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}

let refreshing: Promise<boolean> | null = null

async function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH)
  if (!refreshToken) return false
  if (!refreshing) {
    refreshing = fetch(apiUrl('/api/admin/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          clearTokens()
          return false
        }
        const data = (await res.json()) as { accessToken: string; refreshToken: string }
        setTokens(data.accessToken, data.refreshToken)
        return true
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

export async function api<T>(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const send = (token: string | null) => {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (auth && token) headers.Authorization = `Bearer ${token}`
    return fetch(apiUrl(path), { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  }
  let response = await send(auth ? getAccess() : null)
  if (response.status === 401 && auth && localStorage.getItem(REFRESH)) {
    const ok = await refreshSession()
    if (ok) response = await send(getAccess())
  }
  const text = await response.text()
  let data: { error?: string } = {}
  if (text) {
    try {
      data = JSON.parse(text) as { error?: string }
    } catch {
      throw new Error('The server did not return JSON.')
    }
  }
  if (!response.ok) {
    if (response.status === 401) clearTokens()
    throw new Error(data.error || 'Something went wrong.')
  }
  return data as T
}
