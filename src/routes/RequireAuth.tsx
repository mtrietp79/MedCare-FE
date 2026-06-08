import { useLocation, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, mustChangePassword } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-2xl bg-white px-8 py-10 shadow-lg text-center">
          <p className="text-lg font-medium">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user && mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return children
}
