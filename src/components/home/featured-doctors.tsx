import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DoctorCard } from '@/components/doctors/doctor-card'
import type { Doctor } from '@/types'
import { api } from '@/services/api'
import { doctors as fallbackDoctors } from '@/lib/mock-data'

export function FeaturedDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        const data = await api.doctors.getAll()
        const doctorArray = Array.isArray(data) ? data : fallbackDoctors
        // Sort by rating and get top 4
        const featuredDoctors = [...doctorArray]
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 4)
        setDoctors(featuredDoctors)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load doctors')
        console.error('Error fetching doctors:', err)
        setDoctors(fallbackDoctors.slice(0, 4))
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              Bác sĩ nổi bật
            </h2>
            <p className="text-muted-foreground max-w-xl leading-relaxed">
              Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo chuyên sâu và được bệnh nhân tin tưởng
            </p>
          </div>
          <Button variant="outline" size="lg" asChild className="flex-shrink-0">
            <Link to="/doctors" className="gap-2">
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center text-red-500 mb-8">
            <p>Lỗi: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-muted-foreground mb-8">
            <p>Đang tải...</p>
          </div>
        )}

        {/* Doctors Grid */}
        {!loading && doctors.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        {/* No Data State */}
        {!loading && doctors.length === 0 && !error && (
          <div className="text-center text-muted-foreground">
            <p>Không có bác sĩ nào</p>
          </div>
        )}
      </div>
    </section>
  )
}
