import { useEffect, type ReactNode } from 'react'
import { useAdminPage } from './adminPageContext'

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title?: string
  description?: string
  actions?: ReactNode
}) {
  const { setPage } = useAdminPage()

  useEffect(() => {
    setPage({ title, description, actions })
    return () => setPage({})
  }, [title, description, actions, setPage])

  return null
}
