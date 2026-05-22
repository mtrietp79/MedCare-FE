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
        const params: { specialtyId?: string } = {}
        if (selectedSpecialty !== 'all') {
          params.specialtyId = selectedSpecialty
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
  }, [selectedSpecialty])

  useEffect(() => {
    let filtered = [...doctors]

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      filtered = filtered.filter((d) => {
        const name = (d.name || d.fullName || '')
        return name.toLowerCase().includes(q)
      })
    }

    if (sortBy === 'rating') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sortBy === 'experience') {
      filtered = filtered.sort((a, b) => ((b.experienceYears ?? b.experience) || 0) - ((a.experienceYears ?? a.experience) || 0))
    } else if (sortBy === 'price-low') {
      filtered = filtered.sort((a, b) => (a.fee || a.consultationFee || a.price || 0) - (b.fee || b.consultationFee || b.price || 0))
    } else if (sortBy === 'price-high') {
      filtered = filtered.sort((a, b) => (b.fee || b.consultationFee || b.price || 0) - (a.fee || a.consultationFee || a.price || 0))
    }

    setFilteredDoctors(filtered)
  }, [doctors, sortBy, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background py-10">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Danh sách bác sĩ</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Tìm kiếm bác sĩ theo chuyên khoa, kinh nghiệm, đánh giá và giá khám trước khi đặt lịch.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <DoctorFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSpecialty={selectedSpecialty}
              onSpecialtyChange={setSelectedSpecialty}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          <div>
            {loading ? (
              <div className="grid gap-6 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-destructive/70 bg-destructive/10 p-10 text-center">
                <p className="text-destructive mb-4">Lỗi: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="rounded-3xl border border-border/70 bg-white p-10 text-center">
                <p className="text-muted-foreground">Không tìm thấy bác sĩ phù hợp với tiêu chí tìm kiếm</p>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {filteredDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
