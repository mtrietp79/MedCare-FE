import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth } from '@/routes/RequireAuth'
import { PatientGuard } from '@/routes/PatientGuard'
import { DoctorGuard } from '@/routes/DoctorGuard'

import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PatientLayout } from '@/layouts/PatientLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { DoctorLayout } from '@/layouts/DoctorLayout'

// Home pages
import { HomePage } from '@/pages/home/HomePage'
import { SpecialtyPage } from '@/pages/home/SpecialtyPage'
import { SpecialtyDetailPage } from '@/pages/home/SpecialtyDetailPage'
import { ContactPage } from '@/pages/home/ContactPage'
import { AboutPage } from '@/pages/home/AboutPage'

// Doctors pages
import { DoctorsPage } from '@/pages/doctors/DoctorsPage'
import { DoctorDetailPage } from '@/pages/doctors/DoctorDetailPage'

// Booking pages
import { BookingPage } from '@/pages/booking/BookingPage'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'

// Patient pages
import { PatientDashboardPage } from '@/pages/patient/PatientDashboardPage'
import { PatientProfilePage } from '@/pages/patient/PatientProfilePage'
import { PatientAppointmentsPage } from '@/pages/patient/PatientAppointmentsPage'
import { PatientAppointmentDetailPage } from '@/pages/patient/PatientAppointmentDetailPage'
import { PaymentReturnPage } from '@/pages/patient/PaymentReturnPage'
import { PaymentMethodPage } from '@/pages/patient/PaymentMethodPage'
import { MoMoPaymentPage } from '@/pages/patient/MoMoPaymentPage'
import { MoMoPaymentReturnPage } from '@/pages/patient/MoMoPaymentReturnPage'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage'
import { AdminSpecialtiesPage } from '@/pages/admin/AdminSpecialtiesPage'
import { AdminFinancePage } from '@/pages/admin/AdminFinancePage'
import { AdminMedicinesPage } from '@/pages/admin/AdminMedicinesPage'
import { AdminSchedulePage } from '@/pages/admin/AdminSchedulePage'

// Doctor pages
import { DoctorDashboardPage } from '@/pages/doctor/DoctorDashboardPage'
import { DoctorSchedulePage } from '@/pages/doctor/DoctorSchedulePage'

function App() {
  return (
<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <AuthProvider>
          <Routes>
            {/* Main Layout Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:id" element={<DoctorDetailPage />} />
              <Route path="/specialty" element={<SpecialtyPage />} />
              <Route path="/specialty/:slug" element={<SpecialtyDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/payment-return" element={<PaymentReturnPage />} />
              <Route path="/payment-method/:appointmentId" element={<RequireAuth><PatientGuard><PaymentMethodPage /></PatientGuard></RequireAuth>} />
              <Route path="/momo-payment/:appointmentId" element={<RequireAuth><PatientGuard><MoMoPaymentPage /></PatientGuard></RequireAuth>} />
              <Route path="/momo-payment-return/:appointmentId" element={<MoMoPaymentReturnPage />} />
            </Route>

            {/* Auth Layout Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Patient Routes */}
            <Route
              element={
                <RequireAuth>
                  <PatientGuard>
                    <PatientLayout />
                  </PatientGuard>
                </RequireAuth>
              }
            >
              <Route path="/patient" element={<PatientDashboardPage />} />
              <Route path="/patient/profile" element={<PatientProfilePage />} />
              <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
              <Route path="/patient/appointments/:id" element={<PatientAppointmentDetailPage />} />
            </Route>

            <Route path="/booking" element={<RequireAuth><PatientGuard><BookingPage /></PatientGuard></RequireAuth>} />

            {/* Admin Layout Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="doctors" element={<AdminDoctorsPage />} />
              <Route path="specialties" element={<AdminSpecialtiesPage />} />
              <Route path="finance" element={<AdminFinancePage />} />
              <Route path="medicines" element={<AdminMedicinesPage />} />
              <Route path="schedule" element={<AdminSchedulePage />} />
            </Route>

            {/* Doctor Layout Routes */}
            <Route
              element={
                <RequireAuth>
                  <DoctorGuard>
                    <DoctorLayout />
                  </DoctorGuard>
                </RequireAuth>
              }
            >
              <Route path="/doctor" element={<DoctorDashboardPage />} />
              <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
