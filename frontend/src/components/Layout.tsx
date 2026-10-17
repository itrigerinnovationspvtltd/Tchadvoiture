import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, Heart, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CompareBar } from './CompareControls'
import { FooterCta } from './FooterCta'
import { SiteFooter } from './SiteFooter'

function buyLinkClass(heroHeader: boolean, isActive: boolean) {
  if (heroHeader) {
    return cn(
      'cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
      isActive ? 'text-white underline decoration-2 underline-offset-4' : 'text-white/90 hover:text-white',
    )
  }
  return cn(
    'cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive ? 'bg-primary/10 text-primary' : 'text-charcoal hover:bg-secondary',
  )
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const buyActive = pathname === '/cars' || pathname.startsWith('/cars/')
  const locked = pathname === '/cars'
  const wide = locked || pathname.startsWith('/cars/') || pathname === '/compare'
  const [open, setOpen] = useState(false)
  const [homeScrolled, setHomeScrolled] = useState(false)
  const sellTo = user && user.role !== 'buyer' ? '/my-listings/new' : '/signup'
  const summary = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: () => api<{ unreadCount: number }>('/api/me/notifications/summary'),
    enabled: Boolean(user),
    refetchInterval: 30000,
  })

  const heroHeader = isHome && !homeScrolled

  useEffect(() => {
    if (!isHome) {
      setHomeScrolled(false)
      return
    }
    function onScroll() {
      setHomeScrolled(window.scrollY > 80)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  function close() {
    setOpen(false)
  }

  const mobileOutline = cn(
    'h-11 w-full',
    heroHeader && 'border-white/30 bg-white/10 text-white hover:bg-white/20',
  )

  return (
    <div className={cn('flex min-h-screen flex-col bg-background', locked && 'lg:h-dvh lg:overflow-hidden')}>
      <header
        className={cn(
          'z-30 shrink-0 transition-[background-color,box-shadow,border-color] duration-200',
          heroHeader
            ? 'absolute inset-x-0 top-0 border-b border-transparent bg-transparent'
            : 'sticky top-0 border-b border-border bg-card/90 shadow-sm backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Button
            variant="outline"
            size="icon"
            className={cn('md:hidden', heroHeader && 'border-white/30 bg-white/10 text-white hover:bg-white/20')}
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <Link
            to="/"
            className={cn(
              'cursor-pointer text-lg font-bold tracking-tight transition-colors duration-200',
              heroHeader ? 'text-white' : 'text-charcoal',
            )}
            onClick={close}
          >
            Tchad<span className={heroHeader ? 'text-white/95' : 'text-primary'}>voiture</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <NavLink to="/cars" className={() => buyLinkClass(heroHeader, buyActive)}>
              Buy
            </NavLink>
            <Button
              asChild
              className={cn(
                'h-9',
                heroHeader && 'bg-primary text-white hover:bg-primary-hover',
              )}
            >
              <Link to={sellTo}>Sell</Link>
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {user ? (
              <>
                <NavLink
                  to="/wishlist"
                  className={cn(
                    'hidden cursor-pointer rounded-lg p-2 transition-colors duration-200 md:inline-flex',
                    heroHeader ? 'text-white hover:bg-white/15' : 'text-charcoal hover:bg-secondary',
                  )}
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </NavLink>
                <Link
                  to="/notifications"
                  className={cn(
                    'relative cursor-pointer rounded-lg p-2 transition-colors duration-200',
                    heroHeader ? 'text-white hover:bg-white/15' : 'text-charcoal hover:bg-secondary',
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {summary.data?.unreadCount ? (
                    <span className={cn('absolute right-1 top-1 h-2.5 w-2.5 rounded-full', heroHeader ? 'bg-white' : 'bg-primary')} />
                  ) : null}
                </Link>
                <Link
                  to="/account"
                  className={cn(
                    'hidden cursor-pointer rounded-lg px-2 py-2 text-sm font-medium transition-colors duration-200 sm:inline',
                    heroHeader ? 'text-white/90 hover:text-white' : 'text-charcoal hover:text-primary',
                  )}
                >
                  {user.name}
                </Link>
                <Button
                  variant="outline"
                  className={cn('hidden sm:inline-flex', heroHeader && 'border-white/40 bg-transparent text-white hover:bg-white/15')}
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
                <Button
                  variant="outline"
                  asChild
                  className={cn('hidden sm:inline-flex', heroHeader && 'border-white/40 bg-transparent text-white hover:bg-white/15')}
                >
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className={cn('hidden sm:inline-flex', heroHeader && 'bg-primary text-white hover:bg-primary-hover')}>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        {open ? (
          <div
            className={cn(
              'grid gap-2 px-4 py-3 md:hidden',
              heroHeader ? 'border-t border-white/20 bg-charcoal/95 backdrop-blur-md' : 'border-t border-border bg-card/95 backdrop-blur-md',
            )}
          >
            <Button variant="outline" asChild className={mobileOutline}>
              <Link to="/cars" onClick={close}>Buy</Link>
            </Button>
            <Button asChild className={cn('h-11 w-full', heroHeader && 'bg-primary text-white')}>
              <Link to={sellTo} onClick={close}>Sell</Link>
            </Button>
            {user ? (
              <>
                <Button variant="outline" asChild className={mobileOutline}>
                  <Link to="/wishlist" onClick={close}>Wishlist</Link>
                </Button>
                <Button variant="outline" asChild className={mobileOutline}>
                  <Link to="/enquiries" onClick={close}>Enquiries</Link>
                </Button>
                {user.role !== 'buyer' ? (
                  <Button variant="outline" asChild className={mobileOutline}>
                    <Link to="/my-listings" onClick={close}>My listings</Link>
                  </Button>
                ) : null}
                <Button variant="outline" asChild className={mobileOutline}>
                  <Link to="/account" onClick={close}>Account</Link>
                </Button>
                <Button
                  variant="outline"
                  className={mobileOutline}
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
                <Button variant="outline" asChild className={mobileOutline}>
                  <Link to="/login" onClick={close}>Log in</Link>
                </Button>
                <Button asChild className={cn('h-11 w-full', heroHeader && 'bg-primary text-white')}>
                  <Link to="/signup" onClick={close}>Sign up</Link>
                </Button>
              </>
            )}
          </div>
        ) : null}
      </header>
      <main
        className={cn(
          'mx-auto w-full flex-1',
          isHome ? 'max-w-none px-0 py-0' : cn('px-4 py-6', wide ? 'max-w-[1400px]' : 'max-w-6xl'),
          locked && 'lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden',
        )}
      >
        <Outlet />
      </main>
      <div className={cn(locked && 'lg:hidden')}>
        <FooterCta />
        <SiteFooter />
      </div>
      <CompareBar />
    </div>
  )
}
