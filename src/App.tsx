import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth } from '@/routes/RequireAuth'
import { PatientGuard } from '@/routes/PatientGuard'
import { DoctorGuard } from '@/routes/DoctorGuard'
import { AdminGuard } from '@/routes/AdminGuard'

import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PatientLayout } from '@/layouts/PatientLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { DoctorLayout } from '@/layouts/DoctorLayout'

// Home pages
import { HomePage } from '@/pages/home/HomePage'
import { DoctorsPage } from '@/pages/doctors/DoctorsPage'
import { DoctorDetailPage } from '@/pages/doctors/DoctorDetailPage'
import { SpecialtyPage } from '@/pages/home/SpecialtyPage'
import { SpecialtyDetailPage } from '@/pages/home/SpecialtyDetailPage'
import { ContactPage } from '@/pages/home/ContactPage'

// Booking
import { BookingPage } from '@/pages/booking/BookingPage'
import { ServicePackageBookingPage } from '@/pages/booking/ServicePackageBookingPage'
import { ServicePackagePaymentResultPage } from '@/pages/booking/ServicePackagePaymentResultPage'
import { VNPayPaymentResultPage } from '@/pages/booking/VNPayPaymentResultPage'
import { ServicesPage } from '@/pages/services/ServicesPage'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage'
import { TermsPage } from '@/pages/TermsPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'

// Patient pages
import { PatientDashboardPage } from '@/pages/patient/PatientDashboardPage'
import { PatientAppointmentsPage } from '@/pages/patient/PatientAppointmentsPage'
import { PatientAppointmentDetailPage } from '@/pages/patient/PatientAppointmentDetailPage'
import { PatientProfilePage } from '@/pages/patient/PatientProfilePage'
import { PatientMedicalRecordsPage } from '@/pages/patient/PatientMedicalRecordsPage'
import { PatientMedicalRecordDetailPage } from '@/pages/patient/PatientMedicalRecordDetailPage'

// Doctor pages
import { DoctorDashboardPage } from '@/pages/doctor/DoctorDashboardPage'
import { DoctorAppointmentsPage } from '@/pages/doctor/DoctorAppointmentsPage'
import { DoctorProfilePage } from '@/pages/doctor/DoctorProfilePage'
import { DoctorMedicalRecordsPage } from '@/pages/doctor/DoctorMedicalRecordsPage'
import { DoctorSchedulePage } from '@/pages/doctor/DoctorSchedulePage'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage'
import { AdminSpecialtiesPage } from '@/pages/admin/AdminSpecialtiesPage'
import { AdminMedicinesPage } from '@/pages/admin/AdminMedicinesPage'
import { AdminFinancePage } from '@/pages/admin/AdminFinancePage'
import { AdminSchedulePage } from '@/pages/admin/AdminSchedulePage'
import { AdminServicePackagesPage } from '@/pages/admin/AdminServicePackagesPage'
import { AdminWebsiteFeedbacksPage } from '@/pages/admin/AdminWebsiteFeedbacksPage'

export default function App() {
	return (
		<ThemeProvider defaultTheme="light">
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
							<Route path="/services" element={<ServicesPage />} />
							<Route path="/service-packages" element={<ServicesPage />} />
							<Route path="/booking" element={<BookingPage />} />
							<Route path="/booking/service-package/payment-result" element={<ServicePackagePaymentResultPage />} />
							<Route path="/contact" element={<ContactPage />} />
							<Route path="/terms" element={<TermsPage />} />
							<Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
						</Route>

						{/* Auth Layout */}
						<Route element={<AuthLayout />}>
							<Route path="/login" element={<LoginPage />} />
							<Route path="/register" element={<RegisterPage />} />
							<Route path="/forgot-password" element={<ForgotPasswordPage />} />
							<Route path="/reset-password" element={<ResetPasswordPage />} />
							<Route path="/change-password" element={<ChangePasswordPage />} />
					</Route>

				<Route
					path="/patient"
							element={
								<RequireAuth>
									<PatientGuard>
										<PatientLayout />
									</PatientGuard>
								</RequireAuth>
							}
						>
							<Route index element={<PatientDashboardPage />} />
							<Route path="appointments" element={<PatientAppointmentsPage />} />
							<Route path="appointments/:appointmentId" element={<PatientAppointmentDetailPage />} />
							<Route path="profile" element={<PatientProfilePage />} />
							<Route path="medical-records" element={<PatientMedicalRecordsPage />} />
							<Route path="medical-records/:id" element={<PatientMedicalRecordDetailPage />} />
						</Route>

						{/* Direct aliases for patient URLs without /patient prefix */}
						<Route
							path="/booking/service-package/:id"
							element={
								<RequireAuth>
									<PatientGuard>
										<MainLayout />
									</PatientGuard>
								</RequireAuth>
							}
						>
							<Route index element={<ServicePackageBookingPage />} />
						</Route>
						<Route
							path="/payment/vnpay-result"
							element={
								<RequireAuth>
									<PatientGuard>
										<VNPayPaymentResultPage />
									</PatientGuard>
								</RequireAuth>
							}
						/>
						<Route
							path="/appointments"
							element={
								<RequireAuth>
									<PatientGuard>
										<PatientLayout />
									</PatientGuard>
								</RequireAuth>
							}
						>
							<Route index element={<PatientAppointmentsPage />} />
						</Route>
						<Route
							path="/appointments/:appointmentId"
							element={
								<RequireAuth>
									<PatientGuard>
										<PatientLayout />
									</PatientGuard>
								</RequireAuth>
							}
						>
							<Route index element={<PatientAppointmentDetailPage />} />
						</Route>
						<Route
							path="/profile"
							element={
								<RequireAuth>
									<PatientGuard>
										<PatientLayout />
									</PatientGuard>
								</RequireAuth>
							}
						>
							<Route index element={<PatientProfilePage />} />
						</Route>
						<Route
							path="/medical-records"
							element={
								<RequireAuth>
									<PatientGuard>
										<PatientLayout />
									</PatientGuard>
								</RequireAuth>
							}
						>
							<Route index element={<PatientMedicalRecordsPage />} />
						</Route>
						<Route
							path="/medical-records/:id"
							element={
								<RequireAuth>
									<PatientGuard>
										<PatientLayout />
									</PatientGuard>
								</RequireAuth>
							}
						>
							<Route index element={<PatientMedicalRecordDetailPage />} />
						</Route>

						{/* Doctor area */}
						<Route element={<RequireAuth><DoctorGuard><DoctorLayout /></DoctorGuard></RequireAuth>}>
							<Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
							<Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
							<Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
							<Route path="/doctor/profile" element={<DoctorProfilePage />} />
							<Route path="/doctor/medical-records" element={<DoctorMedicalRecordsPage />} />
							<Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
						</Route>

						{/* Admin area */}
						<Route element={<RequireAuth><AdminGuard><AdminLayout /></AdminGuard></RequireAuth>}>
							<Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
							<Route path="/admin/dashboard" element={<AdminDashboard />} />
							<Route path="/admin/doctors" element={<AdminDoctorsPage />} />
							<Route path="/admin/specialties" element={<AdminSpecialtiesPage />} />
							<Route path="/admin/medicines" element={<AdminMedicinesPage />} />
							<Route path="/admin/finance" element={<AdminFinancePage />} />
							<Route path="/admin/service-package-bookings" element={<AdminServicePackagesPage />} />
							<Route path="/admin/service-packages" element={<AdminServicePackagesPage />} />
							<Route path="/admin/website-feedbacks" element={<AdminWebsiteFeedbacksPage />} />
							<Route path="/admin/schedules" element={<AdminSchedulePage />} />
						</Route>

						<Route path="*" element={<Navigate to="/appointments" replace />} />
					</Routes>
				</AuthProvider>
			</Router>
			<Toaster />
		</ThemeProvider>
	)
}


