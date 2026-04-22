import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

// Home pages
import { HomePage } from '@/pages/home/HomePage'
import { SpecialtyPage } from '@/pages/home/SpecialtyPage'
import { ContactPage } from '@/pages/home/ContactPage'
import { AboutPage } from '@/pages/home/AboutPage'

// Doctors pages
import { DoctorsPage } from '@/pages/doctors/DoctorsPage'

// Booking pages
import { BookingPage } from '@/pages/booking/BookingPage'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage'
import { AdminSpecialtiesPage } from '@/pages/admin/AdminSpecialtiesPage'
import { AdminFinancePage } from '@/pages/admin/AdminFinancePage'
import { AdminMedicinesPage } from '@/pages/admin/AdminMedicinesPage'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <Router>
        <Routes>
          {/* Main Layout Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/specialty" element={<SpecialtyPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>

          {/* Auth Layout Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Admin Layout Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="doctors" element={<AdminDoctorsPage />} />
            <Route path="specialties" element={<AdminSpecialtiesPage />} />
            <Route path="finance" element={<AdminFinancePage />} />
            <Route path="medicines" element={<AdminMedicinesPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
