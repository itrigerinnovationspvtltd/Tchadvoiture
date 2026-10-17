import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type AdminPageState = {
  title?: string
  description?: string
  actions?: ReactNode
}

type AdminPageContextValue = {
  page: AdminPageState
  setPage: (next: AdminPageState) => void
}

const AdminPageContext = createContext<AdminPageContextValue | null>(null)

export function AdminPageProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<AdminPageState>({})
  const value = useMemo(() => ({ page, setPage }), [page])
  return <AdminPageContext.Provider value={value}>{children}</AdminPageContext.Provider>
}

export function useAdminPage() {
  const ctx = useContext(AdminPageContext)
  if (!ctx) throw new Error('useAdminPage must be used within AdminPageProvider')
  return ctx
}
