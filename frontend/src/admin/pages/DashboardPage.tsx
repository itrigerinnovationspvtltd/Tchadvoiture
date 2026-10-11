import type { ReactNode } from 'react'
import {
  ArrowRight,
  Car,
  CheckCircle,
  Clock,
  Flag,
  MessageSquare,
  Sparkles,
  Store,
  UserCircle,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, statusBadgeClass } from '@/components/ui'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { api } from '../lib/api'

type Dashboard = {
  totalUsers: number
  totalDealers: number
  totalIndividuals: number
  totalListings: number
  activeListings: number
  pendingListings: number
  soldOrInactive: number
  totalEnquiries: number
  recentUsers: { id: string; name: string; email: string; role: string; createdAt?: string }[]
  recentListings: { id: string; title: string; status: string; price: number; createdAt: string }[]
  recentActivity: { id: string; message: string; createdAt: string }[]
}

type StatDef = {
  label: string
  value: number
  icon: LucideIcon
  tone: 'primary' | 'success' | 'warning' | 'neutral' | 'accent'
  href?: string
  hint?: string
}

const toneStyles = {
  primary: {
    card: 'hover:ring-primary/20',
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
  },
  success: {
    card: 'hover:ring-emerald-500/20',
    icon: 'bg-emerald-500/10 text-emerald-600',
    value: 'text-emerald-700',
  },
  warning: {
    card: 'hover:ring-amber-500/25',
    icon: 'bg-amber-500/10 text-amber-600',
    value: 'text-amber-700',
  },
  neutral: {
    card: 'hover:ring-slate-400/20',
    icon: 'bg-slate-500/10 text-slate-600',
    value: 'text-foreground',
  },
  accent: {
    card: 'hover:ring-accent/30',
    icon: 'bg-accent/15 text-accent',
    value: 'text-foreground',
  },
}

function StatCard({ label, value, icon: Icon, tone, href, hint }: StatDef) {
  const styles = toneStyles[tone]
  const inner = (
    <Card
      className={`flex h-full min-h-[7.75rem] flex-col motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles.card} ${href ? 'cursor-pointer ring-1 ring-foreground/10' : ''}`}
    >
      <CardContent className="grid h-full flex-1 grid-cols-[1fr_auto] grid-rows-[auto_auto_auto] gap-x-3 gap-y-1 pt-5">
        <p className="col-start-1 row-start-1 min-h-[2.5rem] text-xs font-semibold uppercase leading-snug tracking-wide text-muted-foreground">{label}</p>
        <div className={`col-start-2 row-span-3 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl ${styles.icon}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <p className={`col-start-1 row-start-2 text-3xl font-bold tabular-nums leading-none tracking-tight ${styles.value}`}>{value}</p>
        <p className="col-start-1 row-start-3 min-h-[1.125rem] text-xs text-muted-foreground">{hint ?? ''}</p>
      </CardContent>
    </Card>
  )
  if (href) {
    return (
      <Link to={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        {inner}
      </Link>
    )
  }
  return inner
}

function DashboardPanel({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string
  icon: LucideIcon
  href?: string
  children: ReactNode
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {href ? (
          <Link
            to={href}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary motion-safe:transition-colors hover:text-primary-hover"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="flex-1 pt-4">{children}</CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/api/admin/dashboard') })

  if (dashboard.isPending) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Dashboard" description="Overview of users, listings, and recent platform activity." />
        <DashboardSkeleton />
      </div>
    )
  }
  if (!dashboard.data) return <p>Could not load the dashboard.</p>

  const d = dashboard.data
  const primaryStats: StatDef[] = [
    { label: 'Total users', value: d.totalUsers, icon: Users, tone: 'primary', href: '/admin/users', hint: 'All accounts' },
    { label: 'Active listings', value: d.activeListings, icon: CheckCircle, tone: 'success', href: '/admin/vehicles?status=active' },
    { label: 'Pending review', value: d.pendingListings, icon: Clock, tone: 'warning', href: '/admin/vehicles?status=pending', hint: 'Needs moderation' },
    { label: 'Enquiries', value: d.totalEnquiries, icon: MessageSquare, tone: 'accent', href: '/admin/enquiries' },
  ]

  const secondaryStats: StatDef[] = [
    { label: 'Dealers', value: d.totalDealers, icon: Store, tone: 'primary', href: '/admin/dealers' },
    { label: 'Individual sellers', value: d.totalIndividuals, icon: UserCircle, tone: 'primary', href: '/admin/sellers' },
    { label: 'All listings', value: d.totalListings, icon: Car, tone: 'neutral', href: '/admin/vehicles' },
    { label: 'Sold / inactive', value: d.soldOrInactive, icon: Car, tone: 'neutral', href: '/admin/vehicles?status=inactive' },
  ]

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Dashboard" description="Overview of users, listings, and recent platform activity." />

      <section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-charcoal p-6 text-white shadow-lg md:p-8"
        aria-label="Platform snapshot"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden />
              Platform snapshot
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {d.activeListings} live listings · {d.pendingListings} awaiting review
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              {d.totalUsers} registered users and {d.totalEnquiries} buyer enquiries across the marketplace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="cursor-pointer bg-white text-primary hover:bg-white/90">
              <Link to="/admin/vehicles?status=pending">Review pending</Link>
            </Button>
            <Button asChild variant="outline" className="cursor-pointer border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link to="/admin/enquiries">Open enquiries</Link>
            </Button>
            <Button asChild variant="outline" className="cursor-pointer border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link to="/admin/reports">Reports</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="primary-metrics">
        <h2 id="primary-metrics" className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Priority metrics
        </h2>
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {primaryStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section aria-labelledby="community-metrics">
        <h2 id="community-metrics" className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Community & inventory
        </h2>
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {secondaryStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3" aria-label="Recent activity">
        <DashboardPanel title="Recent registrations" icon={UserPlus} href="/admin/users">
          <ul className="divide-y divide-border">
            {d.recentUsers.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No users yet.</li>
            ) : null}
            {d.recentUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-2 py-3 first:pt-0">
                <div className="min-w-0">
                  <Link
                    className="cursor-pointer font-medium text-primary motion-safe:transition-colors hover:underline"
                    to={`/admin/users/${user.id}`}
                  >
                    {user.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {user.role}
                </Badge>
              </li>
            ))}
          </ul>
        </DashboardPanel>

        <DashboardPanel title="Recent listings" icon={Car} href="/admin/vehicles">
          <ul className="divide-y divide-border">
            {d.recentListings.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No listings yet.</li>
            ) : null}
            {d.recentListings.map((vehicle) => (
              <li key={vehicle.id} className="flex items-start justify-between gap-2 py-3 first:pt-0">
                <div className="min-w-0">
                  <Link
                    className="cursor-pointer line-clamp-2 font-medium text-primary motion-safe:transition-colors hover:underline"
                    to={`/admin/vehicles/${vehicle.id}`}
                  >
                    {vehicle.title}
                  </Link>
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{vehicle.price.toLocaleString()} XAF</p>
                </div>
                <Badge variant="outline" className={`shrink-0 capitalize ${statusBadgeClass(vehicle.status)}`}>
                  {vehicle.status}
                </Badge>
              </li>
            ))}
          </ul>
        </DashboardPanel>

        <DashboardPanel title="Admin activity" icon={Flag}>
          <ul className="divide-y divide-border">
            {d.recentActivity.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No admin actions yet.</li>
            ) : null}
            {d.recentActivity.map((item) => (
              <li key={item.id} className="py-3 text-sm first:pt-0">
                <p className="text-foreground">{item.message}</p>
              </li>
            ))}
          </ul>
        </DashboardPanel>
      </section>
    </div>
  )
}
