import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
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
  const { currentUser, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-army-800 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.rol === 'beheerder') return <Navigate to="/beheerder" replace />
  if (currentUser.rol === 'commandant' || currentUser.rol === 'groepscommandant') return <Navigate to="/commandant" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  const { appConfig } = useAuth()

  useEffect(() => {
    if (appConfig?.browserTitel) document.title = appConfig.browserTitel
    if (appConfig?.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = appConfig.faviconUrl
    }
  }, [appConfig?.browserTitel, appConfig?.faviconUrl])

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
          <ProtectedRoute roles={['commandant', 'beheerder', 'groepscommandant']}>
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
