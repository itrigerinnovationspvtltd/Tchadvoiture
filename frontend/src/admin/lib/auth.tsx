import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, clearTokens, getAccess, setTokens } from './api'

export type Admin = { id: string; name: string; email: string; role: string; status: string }

type AuthValue = {
  admin: Admin | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getAccess()) {
      setReady(true)
      return
    }
    api<{ admin: Admin }>('/api/admin/auth/me')
      .then((data) => setAdmin(data.admin))
      .catch(() => {
        clearTokens()
        setAdmin(null)
      })
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      admin,
      ready,
      async login(email, password) {
        const data = await api<{ accessToken: string; refreshToken: string; admin: Admin }>('/api/admin/auth/login', {
          method: 'POST',
          auth: false,
          body: { email, password },
        })
        setTokens(data.accessToken, data.refreshToken)
        setAdmin(data.admin)
      },
      async logout() {
        await api('/api/admin/auth/logout', { method: 'POST', body: { refreshToken: localStorage.getItem('admin_refresh') } }).catch(() => {})
        clearTokens()
        setAdmin(null)
      },
    }),
    [admin, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
