import { useEffect, useState } from 'react'
import { HeroSection } from '@/components/home/hero-section'
import { SpecialtySection } from '@/components/home/specialty-section'
import { FeaturedDoctors } from '@/components/home/featured-doctors'
import { HowItWorks } from '@/components/home/how-it-works'
import { Testimonials } from '@/components/home/testimonials'
import { CTASection } from '@/components/home/cta-section'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { PatientProfileForm } from '@/pages/patient/PatientProfilePage'
import type { Patient } from '@/types'

export function HomePage() {
  const { user } = useAuth()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(false)
  const [patientError, setPatientError] = useState<string | null>(null)
  const [showProfileForm, setShowProfileForm] = useState(true)

  useEffect(() => {
    if (!showProfileForm || user?.role !== 'ROLE_PATIENT' || user.profileCompleted) {
      return
    }

    const fetchPatient = async () => {
      try {
        setLoadingPatient(true)
        const data = await api.patients.getCurrent()
        setPatient(data)
      } catch (err) {
        setPatientError(err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ')
      } finally {
        setLoadingPatient(false)
      }
    }

    fetchPatient()
  }, [user, showProfileForm])

  return (
    <>
      {user?.role === 'ROLE_PATIENT' && !user.profileCompleted ? (
        <section className="bg-white py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold">Hoàn thiện hồ sơ của bạn</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Vui lòng điền đầy đủ thông tin để hoàn tất hồ sơ và tiếp tục đặt lịch khám.
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowProfileForm(false)}>
                  Bỏ qua và tiếp tục tìm hiểu
                </Button>
              </div>

              {showProfileForm ? (
                loadingPatient ? (
                  <div className="py-10 text-center text-slate-500">Đang tải hồ sơ...</div>
                ) : patient ? (
                  <PatientProfileForm patient={patient} onSuccess={setPatient} onCancel={() => setShowProfileForm(false)} />
                ) : patientError ? (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    {patientError}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                    Đang chuẩn bị form hoàn thiện hồ sơ...
                  </div>
                )
              ) : (
                <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-700">
                  <p className="mb-4">Bạn đã tắt form hoàn thiện hồ sơ. Bạn vẫn có thể hoàn thành hồ sơ sau khi tham khảo các phòng khám.</p>
                  <Button variant="outline" onClick={() => setShowProfileForm(true)}>
                    Mở lại form hoàn thiện
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <HeroSection />
      <SpecialtySection />
      <FeaturedDoctors />
      <HowItWorks />
      <Testimonials />
      <CTASection />
    </>
  )
}
