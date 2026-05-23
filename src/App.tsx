import { useEffect } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PatientLayout } from '@/layouts/PatientLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { DoctorLayout } from '@/layouts/DoctorLayout'

import { RequireAuth } from '@/routes/RequireAuth'
import { PatientGuard } from '@/routes/PatientGuard'
import { DoctorGuard } from '@/routes/DoctorGuard'
import { AdminGuard } from '@/routes/AdminGuard'
import { PublicPatientRoute } from '@/routes/PublicPatientRoute'

import { HomePage } from '@/pages/home/HomePage'
import { SpecialtyPage } from '@/pages/home/SpecialtyPage'
import { SpecialtyDetailPage } from '@/pages/home/SpecialtyDetailPage'
import { ContactPage } from '@/pages/home/ContactPage'
import { AboutPage } from '@/pages/home/AboutPage'
import { ServicesPage } from '@/pages/services/ServicesPage'

import { DoctorsPage } from '@/pages/doctors/DoctorsPage'
import { DoctorDetailPage } from '@/pages/doctors/DoctorDetailPage'

import { BookingPage } from '@/pages/booking/BookingPage'
import { ServicePackageBookingPage } from '@/pages/booking/ServicePackageBookingPage'
import { ServicePackagePaymentResultPage } from '@/pages/booking/ServicePackagePaymentResultPage'

import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ForbiddenPage } from '@/pages/auth/ForbiddenPage'

import { PatientDashboardPage } from '@/pages/patient/PatientDashboardPage'
import { PatientProfilePage } from '@/pages/patient/PatientProfilePage'
import { PatientAppointmentsPage } from '@/pages/patient/PatientAppointmentsPage'
import { PatientAppointmentDetailPage } from '@/pages/patient/PatientAppointmentDetailPage'
import { PatientMedicalRecordsPage } from '@/pages/patient/PatientMedicalRecordsPage'
import { PatientMedicalRecordDetailPage } from '@/pages/patient/PatientMedicalRecordDetailPage'

import { DashboardPage } from '@/pages/admin/DashboardPage'
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage'
import { AdminPatientsPage } from '@/pages/admin/AdminPatientsPage'
import { AdminSpecialtiesPage } from '@/pages/admin/AdminSpecialtiesPage'
import { AdminFinancePage } from '@/pages/admin/AdminFinancePage'
import { AdminMedicinesPage } from '@/pages/admin/AdminMedicinesPage'
import { AdminServicePackageBookingsPage } from '@/pages/admin/AdminServicePackageBookingsPage'
import { AdminSchedulePage } from '@/pages/admin/AdminSchedulePage'
import { AdminMedicalServicesPage } from '@/pages/admin/AdminMedicalServicesPage'
import { AdminWebsiteFeedbacksPage } from '@/pages/admin/AdminWebsiteFeedbacksPage'

import { DoctorDashboardPage } from '@/pages/doctor/DoctorDashboardPage'
import { DoctorAppointmentsPage } from '@/pages/doctor/DoctorAppointmentsPage'
import { DoctorProfilePage } from '@/pages/doctor/DoctorProfilePage'
import { DoctorMedicalRecordsPage } from '@/pages/doctor/DoctorMedicalRecordsPage'
import { DoctorSchedulePage } from '@/pages/doctor/DoctorSchedulePage'
import { consumeForbiddenNotice, redirectByRole } from '@/services/auth'

function ForbiddenNoticeListener() {
  useEffect(() => {
    const message = consumeForbiddenNotice()
    if (message) {
      toast.error(message)
    }
  }, [])

  return null
}

function ProfileRedirect() {
  const { user } = useAuth()

  if (user?.role === 'ROLE_DOCTOR') {
    return <Navigate to="/doctor/profile" replace />
  }

  if (user?.role === 'ROLE_PATIENT') {
    return <Navigate to="/patient/profile" replace />
  }

  return <Navigate to={redirectByRole(user?.role)} replace />
}

function AppointmentsRedirect() {
  const { user } = useAuth()

  if (user?.role === 'ROLE_PATIENT') {
    return <Navigate to="/patient/appointments" replace />
  }

  return <Navigate to={redirectByRole(user?.role)} replace />
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <Router>
        <AuthProvider>
          <ForbiddenNoticeListener />
          <Routes>
            <Route
              element={
                <PublicPatientRoute>
                  <MainLayout />
                </PublicPatientRoute>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/service-packages" element={<ServicesPage />} />
              <Route path="/doctors/:id" element={<DoctorDetailPage />} />
              <Route path="/specialty" element={<SpecialtyPage />} />
              <Route path="/specialty/:id" element={<SpecialtyDetailPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/booking/service-package/payment-result" element={<ServicePackagePaymentResultPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route path="/403" element={<ForbiddenPage />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfileRedirect />
                </RequireAuth>
              }
            />
            <Route
              path="/appointments"
              element={
                <RequireAuth>
                  <AppointmentsRedirect />
                </RequireAuth>
              }
            />

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
              <Route path="/patient/medical-records" element={<PatientMedicalRecordsPage />} />
              <Route path="/patient/medical-records/:id" element={<PatientMedicalRecordDetailPage />} />
            </Route>

            <Route
              element={
                <RequireAuth>
                  <PatientGuard>
                    <MainLayout />
                  </PatientGuard>
                </RequireAuth>
              }
            >
              <Route path="/booking/service-package/:id" element={<ServicePackageBookingPage />} />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="doctors" element={<AdminDoctorsPage />} />
              <Route path="patients" element={<AdminPatientsPage />} />
              <Route path="specialties" element={<AdminSpecialtiesPage />} />
              <Route path="medical-services" element={<AdminMedicalServicesPage />} />
              <Route path="finance" element={<AdminFinancePage />} />
              <Route path="service-package-bookings" element={<AdminServicePackageBookingsPage />} />
              <Route path="website-feedbacks" element={<AdminWebsiteFeedbacksPage />} />
              <Route path="schedule" element={<AdminSchedulePage />} />
              <Route path="medicines" element={<AdminMedicinesPage />} />
            </Route>

            <Route
              path="/doctor"
              element={
                <RequireAuth>
                  <DoctorGuard>
                    <DoctorLayout />
                  </DoctorGuard>
                </RequireAuth>
              }
            >
              <Route index element={<DoctorDashboardPage />} />
              <Route path="appointments" element={<DoctorAppointmentsPage />} />
              <Route path="profile" element={<DoctorProfilePage />} />
              <Route path="medical-records" element={<DoctorMedicalRecordsPage />} />
              <Route path="schedule" element={<DoctorSchedulePage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
