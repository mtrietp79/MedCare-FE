import { Navigate, Outlet } from 'react-router-dom'
import { getStoredRole, getStoredToken, redirectByRole } from '@/services/auth'

interface Props {
  allowedRoles: string[]
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const token = getStoredToken()
  const userRole = getStoredRole()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(userRole || '')) {
    return <Navigate to={redirectByRole(userRole)} replace />
  }

  return <Outlet />
}
