const ACCESS = 'tchad_access'
const REFRESH = 'tchad_refresh'
const configuredBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const API_BASE = configuredBase || (import.meta.env.PROD ? 'https://tchadvoiture.onrender.com' : '')

export function apiUrl(path: string) {
  if (!path.startsWith('/')) return path
  return `${API_BASE}${path}`
}

export function assetUrl(src?: string) {
  if (!src) return src
  if (/^(https?:|blob:|data:)/.test(src)) return src
  if (src.startsWith('/')) return apiUrl(src)
  return src
}

export function getAccess() {
  return localStorage.getItem(ACCESS)
}

export function getRefresh() {
  return localStorage.getItem(REFRESH)
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
  const refreshToken = getRefresh()
  if (!refreshToken) return false
  if (!refreshing) {
    refreshing = fetch(apiUrl('/api/auth/refresh'), {
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
      .catch(() => {
        clearTokens()
        return false
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; formData?: FormData; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, formData, auth = true } = options

  const send = (token: string | null) => {
    const headers: Record<string, string> = {}
    if (body !== undefined && !formData) headers['Content-Type'] = 'application/json'
    if (auth && token) headers.Authorization = `Bearer ${token}`
    return fetch(apiUrl(path), {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    })
  }

  let response = await send(auth ? getAccess() : null)
  if (response.status === 401 && auth && getRefresh()) {
    const ok = await refreshSession()
    if (ok) response = await send(getAccess())
  }

  const data = await readJson(response)
  if (!response.ok) {
    if (response.status === 401) clearTokens()
    throw new Error(data.error || 'Something went wrong.')
  }
  return data as T
}

async function readJson(response: Response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as { error?: string }
  } catch {
    throw new Error('The server did not return JSON.')
  }
}
