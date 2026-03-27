import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

interface Props {
  children: React.ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: Props) {
  const { currentUser, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-army-800 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!currentUser) return <Navigate to="/login" replace />
  if (roles && !roles.includes(currentUser.rol)) return <Navigate to="/" replace />

  return <>{children}</>
}
