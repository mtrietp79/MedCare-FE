import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DoctorCard } from '@/components/doctors/doctor-card'
import { api } from '@/services/api'
import type { Doctor, Specialty } from '@/types'

function getSpecialtyId(doctor: Doctor) {
  if (typeof doctor.specialty === 'object') {
    return doctor.specialty?.id ?? doctor.specialtyId
  }
  return doctor.specialtyId
}

export function SpecialtyDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [specialty, setSpecialty] = useState<Specialty | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const specialtyKey = slug?.trim() || ''

    if (!specialtyKey) {
      setError('ID chuyên khoa không hợp lệ.')
      setLoading(false)
      const timeoutId = window.setTimeout(() => navigate('/specialty', { replace: true }), 2500)
      return () => window.clearTimeout(timeoutId)
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const numericSpecialtyId = Number(specialtyKey)
        const specialtyData = Number.isNaN(numericSpecialtyId)
          ? await api.specialties.getBySlug(specialtyKey)
          : await api.specialties.getById(String(numericSpecialtyId))

        const doctorsData = await api.doctors.getBySpecialtyId(String(specialtyData.id))

        setSpecialty(specialtyData)
        const doctorsArray = Array.isArray(doctorsData) ? doctorsData : []
        setDoctors(doctorsArray)
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu chuyên khoa')
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [slug, navigate])

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
                <p>{doctors.length} bác sĩ</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Gợi ý</p>
                <p>Chọn bác sĩ phù hợp, đặt lịch nhanh chóng.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-semibold">Bác sĩ chuyên khoa {specialty.name}</h2>
                <p className="text-sm text-muted-foreground">Chọn bác sĩ phù hợp và bấm Đặt lịch trên card bác sĩ.</p>
              </div>
            </div>

            {doctors.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-muted p-8 text-center">
                <p className="text-lg font-medium text-foreground mb-2">Chưa có bác sĩ thuộc chuyên khoa này</p>
                <p className="text-sm text-muted-foreground">Hệ thống đang cập nhật bác sĩ cho chuyên khoa {specialty.name}. Vui lòng thử lại sau.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
