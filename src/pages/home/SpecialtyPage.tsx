import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import type { Doctor, Specialty } from '@/types'

function getSpecialtyId(doctor: Doctor) {
  if (typeof doctor.specialty === 'object') {
    return doctor.specialty?.id || doctor.specialtyId
  }
  return doctor.specialtyId
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
            doctorCount: countBySpecialty[specialty.id] ?? 0,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Chuyên khoa</h1>
        <p className="text-muted-foreground">Chọn chuyên khoa để tìm bác sĩ phù hợp</p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700 mb-4">Lỗi: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Thử lại
          </button>
        </div>
      ) : specialties.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-muted-foreground">Chưa có chuyên khoa nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((specialty) => (
            <Link
              key={specialty.id}
              to={`/specialty/${specialty.id}`}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
            >
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="font-semibold text-lg mb-2">{specialty.name}</h3>
              <p className="text-sm text-muted-foreground">{specialty.description || 'Dịch vụ chuyên khoa'}</p>
              <p className="text-sm text-primary mt-3 font-medium">{specialty.doctorCount ?? 0} bác sĩ</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
