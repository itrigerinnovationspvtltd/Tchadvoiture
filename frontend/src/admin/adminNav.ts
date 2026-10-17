import {
  BookOpen,
  Car,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Store,
  Tags,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type AdminNavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badgeKey?: 'pendingListings'
}

export const adminMenuItems: AdminNavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/dealers', label: 'Dealers', icon: Store },
  { to: '/admin/sellers', label: 'Individual sellers', icon: UserCircle },
  { to: '/admin/vehicles', label: 'Vehicles', icon: Car, badgeKey: 'pendingListings' },
  { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/catalog', label: 'Catalog', icon: Tags },
  { to: '/admin/content', label: 'Content', icon: BookOpen },
]

export const adminGeneralItems: AdminNavItem[] = [
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export const adminRouteMeta: Record<string, { title: string; description: string }> = {
  '/admin': {
    title: 'Dashboard',
    description: 'Overview of users, listings, and recent platform activity.',
  },
  '/admin/users': { title: 'Users', description: 'All registered accounts' },
  '/admin/dealers': { title: 'Dealers', description: 'Dealer accounts' },
  '/admin/sellers': { title: 'Individual sellers', description: 'Individual seller accounts' },
  '/admin/vehicles': { title: 'Vehicles', description: 'Listing moderation' },
  '/admin/enquiries': { title: 'Enquiries', description: 'Buyer messages to sellers' },
  '/admin/reports': { title: 'Reports', description: 'Open listing reports' },
  '/admin/catalog': { title: 'Catalog', description: 'Makes, models, and lookups' },
  '/admin/content': { title: 'Content', description: 'Pages and announcements' },
  '/admin/settings': { title: 'Settings', description: 'Account, security, and platform configuration' },
}

export function resolveAdminRouteMeta(pathname: string) {
  if (pathname.startsWith('/admin/users/') && pathname !== '/admin/users') {
    return { title: 'User detail', description: 'Account and listing history' }
  }
  if (pathname.startsWith('/admin/vehicles/') && pathname !== '/admin/vehicles') {
    return { title: 'Vehicle review', description: 'Moderate listing details' }
  }
  const exact = adminRouteMeta[pathname]
  if (exact) return exact
  const prefix = Object.keys(adminRouteMeta)
    .filter((key) => key !== '/admin')
    .find((key) => pathname.startsWith(key))
  return prefix ? adminRouteMeta[prefix]! : { title: 'Administration', description: '' }
}
