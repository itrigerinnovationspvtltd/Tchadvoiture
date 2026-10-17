import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { resolveAdminRouteMeta } from '../adminNav'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { AdminHeader } from './AdminHeader'
import { AdminPageProvider, useAdminPage } from './adminPageContext'
import { AdminSidebar } from './AdminSidebar'

type DashboardCounts = { pendingListings?: number }

function ShellInner() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { page } = useAdminPage()
  const routeMeta = resolveAdminRouteMeta(location.pathname)
  const counts = useQuery({
    queryKey: ['admin-dashboard-counts'],
    queryFn: () => api<DashboardCounts>('/api/admin/dashboard'),
    staleTime: 60_000,
  })

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  const title = page.title ?? routeMeta.title
  const description = page.description ?? routeMeta.description
  const headerSearch = new URLSearchParams(location.search).get('q') ?? ''

  return (
    <div className="admin-shell flex min-h-dvh bg-background">
      <div className="fixed top-0 left-0 z-20 hidden h-screen lg:block">
        <AdminSidebar onLogout={handleLogout} pendingListings={counts.data?.pendingListings} />
      </div>

      <main className="min-w-0 flex-1 p-3 md:p-4 lg:ml-64 lg:p-5">
        <AdminHeader
          title={title}
          description={description}
          actions={page.actions}
          adminName={admin?.name}
          adminEmail={admin?.email}
          onLogout={handleLogout}
          pendingListings={counts.data?.pendingListings}
          pathname={location.pathname}
          initialSearch={headerSearch}
        />
        <div className="mt-4 space-y-3 md:mt-5 md:space-y-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function Shell() {
  return (
    <AdminPageProvider>
      <ShellInner />
    </AdminPageProvider>
  )
}
