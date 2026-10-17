import { Car, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { adminGeneralItems, adminMenuItems } from '../adminNav'

type AdminSidebarProps = {
  onLogout: () => void
  pendingListings?: number
  className?: string
  onNavigate?: () => void
}

function BrandMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary transition-transform duration-300 group-hover:scale-110">
      <Car className="h-4 w-4 text-primary-foreground" aria-hidden />
    </div>
  )
}

export function AdminSidebar({ onLogout, pendingListings, className, onNavigate }: AdminSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const { pathname } = useLocation()

  function navClass(isActive: boolean, label: string) {
    return cn(
      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-300',
      isActive
        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      hoveredItem === label && !isActive && 'translate-x-1',
    )
  }

  return (
    <aside
      className={cn(
        'admin-sidebar flex h-full w-64 flex-col border-r border-border bg-card p-4',
        className,
      )}
    >
      <div className="group mb-6 cursor-pointer">
        <Link to="/admin" className="flex items-center gap-2" onClick={onNavigate}>
          <BrandMark />
          <span className="text-lg font-semibold text-foreground">
            Tchad<span className="text-primary">voiture</span>
          </span>
        </Link>
        <p className="mt-1 pl-10 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Admin</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Menu</p>
          <nav className="space-y-0.5">
            {adminMenuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
                className={({ isActive }) => navClass(isActive, item.label)}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
                {item.badgeKey === 'pendingListings' && pendingListings != null && pendingListings > 0 ? (
                  <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {pendingListings}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">General</p>
          <nav className="space-y-0.5">
            {adminGeneralItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
                className={({ isActive }) => navClass(isActive || pathname.startsWith(item.to), item.label)}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onMouseEnter={() => setHoveredItem('Logout')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => {
                onNavigate?.()
                onLogout()
              }}
              className={navClass(false, 'Logout')}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  )
}
