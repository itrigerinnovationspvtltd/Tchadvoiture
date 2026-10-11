import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, Heart, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CompareBar } from './CompareControls'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive ? 'bg-primary/10 text-primary' : 'text-charcoal hover:bg-secondary'}`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const locked = pathname === '/cars'
  const wide = locked || pathname.startsWith('/cars/') || pathname === '/compare'
  const [open, setOpen] = useState(false)
  const sellTo = user && user.role !== 'buyer' ? '/my-listings/new' : '/signup'
  const summary = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: () => api<{ unreadCount: number }>('/api/me/notifications/summary'),
    enabled: Boolean(user),
    refetchInterval: 30000,
  })

  function close() {
    setOpen(false)
  }

  return (
    <div className={cn('flex min-h-screen flex-col bg-background', locked && 'lg:h-dvh lg:overflow-hidden')}>
      <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <Link to="/" className="cursor-pointer text-lg font-bold tracking-tight text-charcoal" onClick={close}>
            Tchad<span className="text-primary">voiture</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-2 md:flex">
            <NavLink to="/cars" className={linkClass}>
              Buy
            </NavLink>
            <Button asChild className="h-9">
              <Link to={sellTo}>Sell</Link>
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {user ? (
              <>
                {user.role !== 'buyer' ? (
                  <NavLink to="/my-listings" className="hidden cursor-pointer rounded-lg px-2 py-2 text-sm font-medium text-charcoal transition-colors duration-200 hover:text-primary lg:inline">
                    My listings
                  </NavLink>
                ) : null}
                <NavLink to="/enquiries" className="hidden cursor-pointer rounded-lg px-2 py-2 text-sm font-medium text-charcoal transition-colors duration-200 hover:text-primary lg:inline">
                  Enquiries
                </NavLink>
                <NavLink to="/wishlist" className="hidden cursor-pointer rounded-lg p-2 text-charcoal transition-colors duration-200 hover:bg-secondary md:inline-flex" aria-label="Wishlist">
                  <Heart className="h-5 w-5" />
                </NavLink>
                <Link to="/notifications" className="relative cursor-pointer rounded-lg p-2 transition-colors duration-200 hover:bg-secondary" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {summary.data?.unreadCount ? (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  ) : null}
                </Link>
                <Link to="/account" className="hidden cursor-pointer px-2 text-sm font-medium text-charcoal transition-colors duration-200 hover:text-primary sm:inline">
                  {user.name}
                </Link>
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex"
                  onClick={async () => {
                    await logout()
                    navigate('/')
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="hidden sm:inline-flex">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        {open ? (
          <div className="grid gap-2 border-t border-border px-4 py-3 md:hidden">
            <Button variant="outline" asChild className="h-11 w-full">
              <Link to="/cars" onClick={close}>Buy</Link>
            </Button>
            <Button asChild className="h-11 w-full">
              <Link to={sellTo} onClick={close}>Sell</Link>
            </Button>
            {user ? (
              <>
                <Button variant="outline" asChild className="h-11 w-full">
                  <Link to="/wishlist" onClick={close}>Wishlist</Link>
                </Button>
                <Button variant="outline" asChild className="h-11 w-full">
                  <Link to="/enquiries" onClick={close}>Enquiries</Link>
                </Button>
                {user.role !== 'buyer' ? (
                  <Button variant="outline" asChild className="h-11 w-full">
                    <Link to="/my-listings" onClick={close}>My listings</Link>
                  </Button>
                ) : null}
                <Button variant="outline" asChild className="h-11 w-full">
                  <Link to="/account" onClick={close}>Account</Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  onClick={async () => {
                    await logout()
                    close()
                    navigate('/')
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="h-11 w-full">
                  <Link to="/login" onClick={close}>Log in</Link>
                </Button>
                <Button asChild className="h-11 w-full">
                  <Link to="/signup" onClick={close}>Sign up</Link>
                </Button>
              </>
            )}
          </div>
        ) : null}
      </header>
      <main className={cn('mx-auto w-full flex-1 px-4 py-6', wide ? 'max-w-[1400px]' : 'max-w-6xl', locked && 'lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden')}>
        <Outlet />
      </main>
      <footer className={cn('border-t border-border bg-secondary/40', locked && 'lg:hidden')}>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-charcoal">Tchad<span className="text-primary">voiture</span></p>
            <p className="mt-2 text-sm text-muted-foreground">Approved listings from dealers and individual sellers. Seller phone numbers stay private until you send an enquiry.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">Marketplace</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/cars" className="cursor-pointer transition-colors duration-200 hover:text-primary">Buy a car</Link>
              <Link to={sellTo} className="cursor-pointer transition-colors duration-200 hover:text-primary">Sell a car</Link>
              {user ? <Link to="/wishlist" className="cursor-pointer transition-colors duration-200 hover:text-primary">Wishlist</Link> : null}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">Company</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/about" className="cursor-pointer transition-colors duration-200 hover:text-primary">About</Link>
              <Link to="/contact" className="cursor-pointer transition-colors duration-200 hover:text-primary">Contact</Link>
              <Link to="/terms" className="cursor-pointer transition-colors duration-200 hover:text-primary">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
      <CompareBar />
    </div>
  )
}
