import { useState, useEffect } from 'react'
import { DoctorFilter } from '@/components/doctors/doctor-filter'
import { DoctorCard } from '@/components/doctors/doctor-card'
import { api } from '@/services/api'
import type { Doctor } from '@/types'

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [sortBy, setSortBy] = useState('default')

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        setError(null)
        const params: { specialtyId?: string; search?: string } = {}
        if (selectedSpecialty !== 'all') {
          params.specialtyId = selectedSpecialty
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim()
        }

        const data = await api.doctors.getAll(params)
        setDoctors(data)
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách bác sĩ'
        setError(errorMessage)
        console.error('Error fetching doctors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [selectedSpecialty, searchQuery])

  useEffect(() => {
    let filtered = [...doctors]

    // Sort
    if (sortBy === 'rating') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sortBy === 'experience') {
      filtered = filtered.sort((a, b) => (b.experience || 0) - (a.experience || 0))
    } else if (sortBy === 'price-low') {
      filtered = filtered.sort((a, b) => (a.fee || a.consultationFee || 0) - (b.fee || b.consultationFee || 0))
    } else if (sortBy === 'price-high') {
      filtered = filtered.sort((a, b) => (b.fee || b.consultationFee || 0) - (a.fee || a.consultationFee || 0))
    }

    setFilteredDoctors(filtered)
  }, [doctors, sortBy])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Danh sách bác sĩ</h1>
        <p className="text-muted-foreground">Tìm kiếm và đặt lịch với bác sĩ chuyên khoa</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <DoctorFilter 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedSpecialty={selectedSpecialty}
            onSpecialtyChange={setSelectedSpecialty}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>
        
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
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
          ) : filteredDoctors.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-muted-foreground">Không tìm thấy bác sĩ phù hợp với tiêu chí tìm kiếm</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
