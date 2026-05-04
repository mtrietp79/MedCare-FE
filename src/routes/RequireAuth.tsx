import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
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

  return children
}
