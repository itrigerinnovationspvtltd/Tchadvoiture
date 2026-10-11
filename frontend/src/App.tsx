import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Skeleton } from '@/components/ui'
import { useAuth } from './lib/auth'
import { AccountPage } from './pages/AccountPage'
import { BrowsePage } from './pages/BrowsePage'
import { ComparePage } from './pages/ComparePage'
import { EnquiriesPage } from './pages/EnquiriesPage'
import { HomePage } from './pages/HomePage'
import { ListingFormPage } from './pages/ListingFormPage'
import { LoginPage } from './pages/LoginPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { SellerPage } from './pages/SellerPage'
import { SignupPage } from './pages/SignupPage'
import { StaticPage } from './pages/StaticPage'
import { VehiclePage } from './pages/VehiclePage'
import { WishlistPage } from './pages/WishlistPage'

const AdminApp = lazy(() => import('./admin/AdminApp.tsx'))

function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return <Outlet />
}

function RequireSeller() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role === 'buyer') return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<BrowsePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/cars/:id" element={<VehiclePage />} />
        <Route path="/sellers/:id" element={<SellerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/about" element={<StaticPage />} />
        <Route path="/contact" element={<StaticPage />} />
        <Route path="/terms" element={<StaticPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/enquiries" element={<EnquiriesPage />} />
        </Route>
        <Route element={<RequireSeller />}>
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/my-listings/new" element={<ListingFormPage />} />
          <Route path="/my-listings/:id/edit" element={<ListingFormPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
