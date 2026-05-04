import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DoctorCard } from '@/components/doctors/doctor-card'
import { api } from '@/services/api'
import type { Doctor, Specialty } from '@/types'

export function SpecialtyDetailPage() {
  const { slug } = useParams()
  const [specialty, setSpecialty] = useState<Specialty | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const fetchData = async () => {
      try {
        setLoading(true)
        const specialtyData = await api.specialties.getBySlug(slug)
        setSpecialty(specialtyData)
        const doctorData = await api.doctors.getAll({ specialty: specialtyData.name })
        setDoctors(doctorData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Đang tải chuyên khoa...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-destructive">
        <p>Lỗi: {error}</p>
      </div>
    )
  }

  if (!specialty) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/specialty" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Quay lại chuyên khoa
      </Link>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-primary">{specialty.name}</p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">{specialty.name}</h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">{specialty.description || 'Chuyên khoa này cung cấp dịch vụ điều trị với đội ngũ bác sĩ hàng đầu.'}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Bác sĩ</p>
                <p>{specialty.doctorCount || 'Nhiều'} bác sĩ</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Gợi ý</p>
                <p>Chọn bác sĩ phù hợp, đặt lịch nhanh chóng.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Bác sĩ chuyên khoa {specialty.name}</h2>
                <p className="text-sm text-muted-foreground">Lọc bác sĩ theo chuyên môn và lịch khám.</p>
              </div>
              <Button asChild>
                <Link to="/booking" className="text-center">
                  Đặt lịch khám
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
