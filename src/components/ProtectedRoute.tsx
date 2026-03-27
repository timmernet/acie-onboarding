import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

interface Props {
  children: React.ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: Props) {
  const { currentUser } = useAuth()

  if (!currentUser) return <Navigate to="/login" replace />
  if (roles && !roles.includes(currentUser.rol)) return <Navigate to="/" replace />

  return <>{children}</>
}
