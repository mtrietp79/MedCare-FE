import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { redirectByRole } from '@/services/auth'

export function PublicPatientRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-2xl bg-white px-8 py-10 shadow-lg text-center">
          <p className="text-lg font-medium">Dang tai du lieu nguoi dung...</p>
        </div>
      </div>
    )
  }

  if (user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_DOCTOR')) {
    return <Navigate to={redirectByRole(user.role)} replace />
  }

  return <>{children}</>
}
