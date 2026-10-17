import { Search } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui'
import { AdminMobileNav } from './AdminMobileNav'

type AdminHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  adminName?: string
  adminEmail?: string
  onLogout: () => void
  pendingListings?: number
  pathname: string
  initialSearch?: string
}

function initials(name?: string) {
  if (!name) return 'AD'
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function searchTarget(pathname: string, term: string) {
  const q = encodeURIComponent(term)
  if (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/dealers') || pathname.startsWith('/admin/sellers')) {
    const base = pathname.startsWith('/admin/dealers')
      ? '/admin/dealers'
      : pathname.startsWith('/admin/sellers')
        ? '/admin/sellers'
        : '/admin/users'
    return `${base}?q=${q}`
  }
  return `/admin/vehicles?q=${q}`
}

export function AdminHeader({
  title,
  description,
  actions,
  adminName,
  adminEmail,
  onLogout,
  pendingListings,
  pathname,
  initialSearch = '',
}: AdminHeaderProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState(initialSearch)

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const term = search.trim()
    if (!term) return
    navigate(searchTarget(pathname, term))
  }

  return (
    <header className="animate-slide-in-up space-y-3 md:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <AdminMobileNav onLogout={onLogout} pendingListings={pendingListings} />
          <form className="relative max-w-md flex-1" onSubmit={submitSearch}>
            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Search listings or users…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 border-border bg-card pr-3 pl-9 text-sm transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
            />
          </form>
        </div>

        <Link
          to="/admin/settings?tab=account"
          className="flex items-center gap-2 border-l border-border pl-2 transition-opacity hover:opacity-90 md:pl-3"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40"
            aria-hidden
          >
            {initials(adminName)}
          </div>
          <div className="hidden text-xs sm:block">
            <p className="font-semibold text-foreground">{adminName ?? 'Administrator'}</p>
            <p className="text-[10px] text-muted-foreground">{adminEmail}</p>
          </div>
        </Link>
      </div>

      <div>
        <h1 className="mb-1 text-xl font-bold text-foreground md:text-2xl lg:text-3xl">{title}</h1>
        {description ? <p className="text-xs text-muted-foreground md:text-sm">{description}</p> : null}
      </div>

      {actions ? <div className="flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
    </header>
  )
}
