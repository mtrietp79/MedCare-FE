import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import type { Specialty } from '@/types'

export function SpecialtyPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.specialties.getAll()
        setSpecialties(data)
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
              to={`/specialty/${specialty.slug}`}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
            >
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="font-semibold text-lg mb-2">{specialty.name}</h3>
              <p className="text-sm text-muted-foreground">{specialty.description || 'Dịch vụ chuyên khoa'}</p>
              {specialty.doctorCount && (
                <p className="text-sm text-primary mt-3 font-medium">{specialty.doctorCount} bác sĩ</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
