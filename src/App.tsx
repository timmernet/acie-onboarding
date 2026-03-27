import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPinPage } from './pages/ForgotPinPage'
import { PinResetPage } from './pages/PinResetPage'
import { ReservistDashboard } from './pages/ReservistDashboard'
import { CommanderDashboard } from './pages/CommanderDashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { ContactsPage } from './pages/ContactsPage'
import { DocumentenPage } from './pages/DocumentenPage'

function RootRedirect() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.rol === 'beheerder') return <Navigate to="/beheerder" replace />
  if (currentUser.rol === 'commandant') return <Navigate to="/commandant" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registreer" element={<RegisterPage />} />
      <Route path="/vergeten" element={<ForgotPinPage />} />
      <Route path="/pin-reset" element={<PinResetPage />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Reservist */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['reservist']}>
            <Layout>
              <ReservistDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Commandant + Beheerder can view progress */}
      <Route
        path="/commandant"
        element={
          <ProtectedRoute roles={['commandant', 'beheerder']}>
            <Layout>
              <CommanderDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Beheerder only */}
      <Route
        path="/beheerder"
        element={
          <ProtectedRoute roles={['beheerder']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Documenten — all authenticated users */}
      <Route
        path="/documenten"
        element={
          <ProtectedRoute>
            <Layout>
              <DocumentenPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Contacts — all authenticated users */}
      <Route
        path="/contacten"
        element={
          <ProtectedRoute>
            <Layout>
              <ContactsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
