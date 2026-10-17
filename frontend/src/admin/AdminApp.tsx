import './admin-theme.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { PageLoadingSkeleton } from '../components/PageLoadingSkeleton'
import { AuthProvider, useAuth } from './lib/auth'
import { CatalogPage } from './pages/CatalogPage'
import { ContentPage } from './pages/ContentPage'
import { DashboardPage } from './pages/DashboardPage'
import { EnquiriesPage } from './pages/EnquiriesPage'
import { LoginPage } from './pages/LoginPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { UserDetailPage } from './pages/UserDetailPage'
import { UsersPage } from './pages/UsersPage'
import { VehicleReviewPage } from './pages/VehicleReviewPage'
import { VehiclesPage } from './pages/VehiclesPage'

function Guard() {
  const { admin, ready } = useAuth()
  if (!ready) return <PageLoadingSkeleton variant="admin" />
  if (!admin) return <Navigate to="/admin/login" replace />
  return <Shell />
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<Guard />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage title="Users" />} />
        <Route path="dealers" element={<UsersPage role="dealer" title="Dealers" />} />
        <Route path="sellers" element={<UsersPage role="individual" title="Individual sellers" />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleReviewPage />} />
        <Route path="enquiries" element={<EnquiriesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminRoutes />
    </AuthProvider>
  )
}
