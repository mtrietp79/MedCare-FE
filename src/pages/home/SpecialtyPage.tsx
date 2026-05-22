import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, HeartPulse, ShieldCheck, Stethoscope, Users, Sparkles } from 'lucide-react'
import { api } from '@/services/api'
import type { Doctor, Specialty } from '@/types'

function getSpecialtyId(doctor: Doctor) {
  if (typeof doctor.specialty === 'object') {
    return doctor.specialty?.id || doctor.specialtyId
  }
  return doctor.specialtyId
}

const specialtyIcons = [Stethoscope, HeartPulse, ShieldCheck, Activity, Users, Sparkles]

function getIconBySpecialtyId(id: string | number | undefined) {
  if (!id) {
    return Stethoscope
  }

  const index = Number(String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))
  return specialtyIcons[index % specialtyIcons.length]
}

export function SpecialtyPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setLoading(true)
        setError(null)

        const [specialtyData, doctorData] = await Promise.all([
          api.specialties.getAll(),
          api.doctors.getAll(),
        ])

        const specialtiesArray = Array.isArray(specialtyData) ? specialtyData : []
        const doctors = Array.isArray(doctorData) ? doctorData : []

        const countBySpecialty = doctors.reduce<Record<string, number>>((counts, doctor) => {
          const specialtyId = getSpecialtyId(doctor)
          if (specialtyId) {
            counts[specialtyId] = (counts[specialtyId] || 0) + 1
          }
          return counts
        }, {})

        setSpecialties(
          specialtiesArray.map((specialty) => ({
            ...specialty,
            doctorCount: specialty.totalDoctors ?? specialty.doctorCount ?? countBySpecialty[specialty.id] ?? 0,
          }))
        )
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách chuyên khoa'
        setError(errorMessage)
        console.error('Error fetching specialties:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSpecialties()
  }, [])

  const cards = useMemo(
    () =>
      specialties.map((specialty) => {
        const Icon = getIconBySpecialtyId(specialty.id)
        return (
          <Link
            key={specialty.id}
            to={`/specialty/${specialty.id}`}
            className="group block overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="p-6 lg:p-8">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{specialty.name}</h3>
              <p className="text-sm leading-6 text-slate-600 min-h-[3rem]">
                {specialty.description || 'Khám chuyên sâu với đội ngũ bác sĩ giàu kinh nghiệm.'}
              </p>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between text-sm text-slate-700">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                {specialty.doctorCount ?? 0} bác sĩ
              </span>
              <span className="font-semibold text-primary">Xem chuyên khoa →</span>
            </div>
          </Link>
        )
      }),
    [specialties]
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden pb-24">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-90 blur-3xl" />
        <div className="container relative mx-auto px-4 pt-20">
          <div className="rounded-[2rem] border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/80 mb-3">Khám phá chuyên khoa</p>
                <h1 className="text-4xl font-bold text-slate-950 sm:text-5xl">
                  Chuyên khoa chăm sóc sức khỏe chuẩn chỉnh
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Chọn đúng chuyên khoa, kết nối với bác sĩ phù hợp và đặt lịch khám nhanh chóng.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm text-slate-500">Tổng chuyên khoa</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{specialties.length}</p>
                </div>
                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm text-slate-500">Bác sĩ chuyên khoa</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {specialties.reduce((sum, item) => sum + (item.doctorCount ?? 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-60 rounded-[1.5rem] bg-slate-200/80 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700 mb-4">Lỗi: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Thử lại
            </button>
          </div>
        ) : specialties.length === 0 ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">Hiện chưa có chuyên khoa nào để hiển thị.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cards}
          </div>
        )}
      </div>
    </div>
  )
}
