import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ArrowRight, Flag } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, statusBadgeClass } from '@/components/ui'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { AdminDashboardStats } from '../components/dashboard/AdminDashboardStats'
import { AdminListingAnalytics } from '../components/dashboard/AdminListingAnalytics'
import { AdminModerationProgress } from '../components/dashboard/AdminModerationProgress'
import { adminPrimaryButtonClass } from '../components/adminControls'
import { api } from '../lib/api'

type Dashboard = {
  totalUsers: number
  totalDealers: number
  totalIndividuals: number
  totalListings: number
  activeListings: number
  pendingListings: number
  soldListings: number
  inactiveListings: number
  soldOrInactive: number
  totalEnquiries: number
  recentUsers: { id: string; name: string; email: string; role: string; createdAt?: string }[]
  recentListings: { id: string; title: string; status: string; price: number; createdAt: string }[]
  recentActivity: { id: string; message: string; createdAt: string }[]
}

function DashboardPanel({
  title,
  href,
  children,
}: {
  title: string
  href?: string
  children: ReactNode
}) {
  return (
    <Card
      className="animate-slide-in-up flex h-full flex-col gap-0 transition-all duration-500 hover:shadow-xl"
      style={{ animationDelay: '600ms' }}
    >
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {href ? (
          <Link to={href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline">
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
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/api/admin/dashboard') })

  const headerActions = (
    <>
      <Button asChild className={`h-9 w-full text-sm sm:w-auto ${adminPrimaryButtonClass}`}>
        <Link to="/admin/vehicles?status=pending">Review pending</Link>
      </Button>
      <Button
        asChild
        variant="outline"
        className="h-9 w-full bg-transparent text-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:w-auto"
      >
        <Link to="/admin/enquiries">Open enquiries</Link>
      </Button>
    </>
  )

  if (dashboard.isPending) {
    return (
      <>
        <AdminPageHeader actions={headerActions} />
        <DashboardSkeleton />
      </>
    )
  }
  if (!dashboard.data) return <p>Could not load the dashboard.</p>

  const d = dashboard.data
  const primaryStats = [
    {
      title: 'Active listings',
      value: d.activeListings,
      hint: 'Live on marketplace',
      href: '/admin/vehicles?status=active',
      featured: true,
      delay: '0ms',
    },
    {
      title: 'Pending review',
      value: d.pendingListings,
      hint: 'Needs moderation',
      href: '/admin/vehicles?status=pending',
      delay: '100ms',
    },
    {
      title: 'Total users',
      value: d.totalUsers,
      hint: 'Registered accounts',
      href: '/admin/users',
      delay: '200ms',
    },
    {
      title: 'Enquiries',
      value: d.totalEnquiries,
      hint: 'Buyer messages',
      href: '/admin/enquiries',
      delay: '300ms',
    },
  ]

  const secondaryStats = [
    { title: 'Dealers', value: d.totalDealers, hint: 'Dealer accounts', href: '/admin/dealers', delay: '0ms' },
    { title: 'Individual sellers', value: d.totalIndividuals, hint: 'Private sellers', href: '/admin/sellers', delay: '100ms' },
    { title: 'All listings', value: d.totalListings, hint: 'Total inventory', href: '/admin/vehicles', delay: '200ms' },
    {
      title: 'Sold / inactive',
      value: d.soldOrInactive,
      hint: 'Off marketplace',
      href: '/admin/vehicles?status=inactive',
      delay: '300ms',
    },
  ]

  const chartSegments = [
    { label: 'Active', value: d.activeListings, key: 'active' },
    { label: 'Pending', value: d.pendingListings, key: 'pending' },
    { label: 'Sold', value: d.soldListings ?? 0, key: 'sold' },
    { label: 'Inactive', value: d.inactiveListings ?? 0, key: 'inactive' },
  ]

  return (
    <>
      <AdminPageHeader actions={headerActions} />

      <AdminDashboardStats stats={primaryStats} />

      <AdminDashboardStats stats={secondaryStats} />

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
        <div className="space-y-3 md:space-y-4 lg:col-span-2">
          <AdminListingAnalytics segments={chartSegments} />
          <DashboardPanel title="Recent registrations" href="/admin/users">
            <ul className="divide-y divide-border">
              {d.recentUsers.length === 0 ? (
                <li className="py-6 text-center text-sm text-muted-foreground">No users yet.</li>
              ) : null}
              {d.recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-2 py-3 first:pt-0">
                  <div className="min-w-0">
                    <Link className="font-medium text-primary transition-colors hover:underline" to={`/admin/users/${user.id}`}>
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
        </div>

        <div className="space-y-3 md:space-y-4">
          <AdminModerationProgress pending={d.pendingListings} total={d.totalListings} />
          <DashboardPanel title="Recent listings" href="/admin/vehicles">
            <ul className="divide-y divide-border">
              {d.recentListings.length === 0 ? (
                <li className="py-6 text-center text-sm text-muted-foreground">No listings yet.</li>
              ) : null}
              {d.recentListings.map((vehicle) => (
                <li key={vehicle.id} className="flex items-start justify-between gap-2 py-3 first:pt-0">
                  <div className="min-w-0">
                    <Link
                      className="line-clamp-2 font-medium text-primary transition-colors hover:underline"
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
        </div>
      </div>

      <DashboardPanel title="Admin activity">
        <ul className="divide-y divide-border">
          {d.recentActivity.length === 0 ? (
            <li className="flex items-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <Flag className="mx-auto h-5 w-5 opacity-40" aria-hidden />
              No admin actions yet.
            </li>
          ) : null}
          {d.recentActivity.map((item) => (
            <li key={item.id} className="py-3 text-sm first:pt-0">
              <p className="text-foreground">{item.message}</p>
            </li>
          ))}
        </ul>
      </DashboardPanel>
    </>
  )
}
