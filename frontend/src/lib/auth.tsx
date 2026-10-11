import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, clearTokens, getAccess, setTokens } from './api'
import type { User } from './types'

type AuthContextValue = {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (body: Record<string, unknown>) => Promise<void>
  logout: () => Promise<void>
  refreshUser: (next?: User) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getAccess()) {
      setReady(true)
      return
    }
    api<{ user: User }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        clearTokens()
        setUser(null)
      })
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      async login(email, password) {
        const data = await api<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
          auth: false,
        })
        setTokens(data.accessToken, data.refreshToken)
        setUser(data.user)
      },
      async signup(body) {
        const data = await api<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/signup', {
          method: 'POST',
          body,
          auth: false,
        })
        setTokens(data.accessToken, data.refreshToken)
        setUser(data.user)
      },
      async logout() {
        await api('/api/auth/logout', { method: 'POST', body: { refreshToken: localStorage.getItem('tchad_refresh') } }).catch(() => {})
        clearTokens()
        setUser(null)
      },
      async refreshUser(next) {
        if (next) {
          setUser(next)
          return
        }
        const data = await api<{ user: User }>('/api/auth/me')
        setUser(data.user)
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
