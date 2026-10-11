import {
  BookOpen,
  Car,
  Flag,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Store,
  Tags,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useAuth } from '../lib/auth'

const links: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/dealers', label: 'Dealers', icon: Store },
  { to: '/admin/sellers', label: 'Individual sellers', icon: UserCircle },
  { to: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/catalog', label: 'Catalog', icon: Tags },
  { to: '/admin/content', label: 'Content', icon: BookOpen },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

const routeSubtitle: Record<string, string> = {
  '/admin': 'Platform overview',
  '/admin/users': 'All registered accounts',
  '/admin/dealers': 'Dealer accounts',
  '/admin/sellers': 'Individual seller accounts',
  '/admin/vehicles': 'Listing moderation',
  '/admin/enquiries': 'Buyer messages to sellers',
  '/admin/reports': 'Open listing reports',
  '/admin/catalog': 'Makes, models, and lookups',
  '/admin/content': 'Pages and announcements',
  '/admin/settings': 'Platform configuration',
}

function navLinkClass(isActive: boolean) {
  const base =
    'motion-safe:transition-colors flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm md:border-l-2 md:border-transparent'
  if (isActive) {
    return `${base} bg-white/15 font-semibold text-white ring-1 ring-white/20 md:border-accent`
  }
  return `${base} text-white/80 hover:bg-white/10 hover:text-white`
}

function SidebarBrand() {
  return (
    <div className="shrink-0 px-5 py-5">
      <p className="text-lg font-bold tracking-tight text-white">
        Tchad<span className="text-accent">voiture</span>
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/60">
        <Shield className="h-3.5 w-3.5" aria-hidden />
        Admin console
      </p>
    </div>
  )
}

function SidebarNav({ className }: { className?: string }) {
  return (
    <nav className={className} aria-label="Admin navigation">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => navLinkClass(isActive)}>
          <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Shell() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pathKey = links.find(({ to }) => location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to)))?.to ?? '/admin'
  const subtitle = routeSubtitle[pathKey] ?? 'Administration'

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
      <aside className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-gradient-to-b from-primary to-charcoal text-white md:flex md:h-full md:w-64 md:flex-col md:border-b-0 md:border-r md:border-white/10">
        <SidebarBrand />
        <SidebarNav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:overflow-x-hidden md:px-3 md:pb-4 md:space-y-0.5" />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{admin?.name ?? 'Administrator'}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{admin?.email}</span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="gap-1.5"
              onClick={async () => {
                await logout()
                navigate('/admin/login')
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
