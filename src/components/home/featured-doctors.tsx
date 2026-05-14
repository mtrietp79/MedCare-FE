import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DoctorCard } from '@/components/doctors/doctor-card'
import { DoctorCardSkeleton } from '@/components/ui/skeleton-loader'
import { ErrorState, EmptyState } from '@/components/ui/empty-state'
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
        setError(null)
        const data = await api.doctors.getAll()
        const doctorArray = Array.isArray(data) ? data : fallbackDoctors
        // Sort by rating and get top 4
        const featuredDoctors = [...doctorArray]
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 4)
        setDoctors(featuredDoctors)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Không thể tải bác sĩ'
        setError(errorMsg)
        console.error('Error fetching doctors:', err)
        setDoctors(fallbackDoctors.slice(0, 4))
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              Bác sĩ nổi bật
            </h2>
            <p className="text-muted-foreground max-w-xl leading-relaxed">
              Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo chuyên sâu và được bệnh nhân tin tưởng
            </p>
          </div>
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Button variant="outline" size="lg" asChild className="gap-2">
              <Link to="/doctors">
                Xem tất cả
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <ErrorState
              title="Không thể tải bác sĩ"
              description={error}
              action={{
                label: 'Thử lại',
                onClick: () => window.location.reload(),
              }}
            />
          </motion.div>
        )}

        {/* Loading State - Skeleton Grid */}
        {loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[...Array(4)].map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </motion.div>
        )}

        {/* Doctors Grid */}
        {!loading && doctors.length > 0 && (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {doctors.map((doctor, index) => (
              <DoctorCard key={doctor.id} doctor={doctor} index={index} />
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && doctors.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState
              title="Không có bác sĩ"
              description="Danh sách bác sĩ hiện chưa có sẵn. Vui lòng thử lại sau."
              action={{
                label: 'Quay lại',
                onClick: () => window.location.reload(),
              }}
            />
          </motion.div>
        )}
      </div>
    </section>
  )
}
