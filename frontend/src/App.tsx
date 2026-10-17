import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PageLoadingSkeleton } from './components/PageLoadingSkeleton'
import { ScrollToTop } from './components/ScrollToTop'
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
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { FaqPage } from './pages/FaqPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { VehiclePage } from './pages/VehiclePage'
import { VehicleSpecsPage } from './pages/VehicleSpecsPage'
import { WishlistPage } from './pages/WishlistPage'

const AdminApp = lazy(() => import('./admin/AdminApp.tsx'))

function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <PageLoadingSkeleton variant="default" />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return <Outlet />
}

function RequireSeller() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <PageLoadingSkeleton variant="list" />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role === 'buyer') return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<PageLoadingSkeleton variant="admin" />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<BrowsePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/cars/:id/specifications" element={<VehicleSpecsPage />} />
        <Route path="/cars/:id" element={<VehiclePage />} />
        <Route path="/sellers/:id" element={<SellerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/faq" element={<FaqPage />} />
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
    </>
  )
}
