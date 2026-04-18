import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'

// Auth Pages
import LoginPage from './pages/auth/dang-nhap/page'
import RegisterPage from './pages/auth/dang-ky/page'
import ForgotPasswordPage from './pages/auth/quen-mat-khau/page'
import AuthLayout from './pages/auth/layout'

// Protected Route Wrapper
interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    return <Navigate to="/dang-nhap" replace />
  }
  
  return <>{children}</>
}

// Home/Dashboard Page (Placeholder)
const HomePage = () => {
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/dang-nhap'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">MedCare</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Xin chào</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Chào mừng đến MedCare</h2>
          <p className="text-gray-600 mb-6">
            Đây là trang chủ của ứng dụng đặt lịch khám bệnh trực tuyến. Vui lòng chọn dịch vụ mà bạn cần.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-2">Bệnh nhân</h3>
              <p className="text-blue-700 mb-4">Đặt lịch khám với các bác sĩ chuyên khoa</p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Truy cập
              </button>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <h3 className="text-xl font-bold text-green-900 mb-2">Bác sĩ</h3>
              <p className="text-green-700 mb-4">Quản lý lịch khám và thông tin bệnh nhân</p>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Truy cập
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-2">Quản trị</h3>
              <p className="text-purple-700 mb-4">Quản lý hệ thống và người dùng</p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Truy cập
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    // You can add additional initialization logic here
    setIsInitialized(true)
  }, [])

  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <Router>
      <Routes>
        {/* Auth Routes - With Layout */}
        <Route
          path="/dang-nhap"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path="/dang-ky"
          element={
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          }
        />
        <Route
          path="/quen-mat-khau"
          element={
            <AuthLayout>
              <ForgotPasswordPage />
            </AuthLayout>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Patient Routes */}
        <Route
          path="/patient/*"
          element={
            <ProtectedRoute>
              <div className="p-6">Patient Pages (Coming Soon)</div>
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/*"
          element={
            <ProtectedRoute>
              <div className="p-6">Doctor Pages (Coming Soon)</div>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <div className="p-6">Admin Pages (Coming Soon)</div>
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
