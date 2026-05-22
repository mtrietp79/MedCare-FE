import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Doctor } from '@/types'

interface DoctorCardProps {
  doctor: Doctor
  variant?: 'default' | 'compact'
  index?: number
}

function formatPrice(value?: number) {
  if (value == null || value <= 0) {
    return 'Liên hệ'
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function getDoctorSpecialtyName(doctor: Doctor) {
  if (typeof doctor.specialty === 'string') {
    return doctor.specialty || 'Chưa cập nhật'
  }
  return doctor.specialty?.name || doctor.specialtyName || doctor.specialization || 'Chưa cập nhật'
}

function getDoctorImageUrl(doctor: Doctor) {
  return doctor.imageUrl || doctor.photoUrl || doctor.image || doctor.avatar || null
}

export function DoctorCard({ doctor, variant = 'default', index = 0 }: DoctorCardProps) {
  if (!doctor) {
    return null
  }

  const doctorName = doctor.fullName ?? doctor.name ?? 'Bác sĩ'
  const doctorSpecialty = getDoctorSpecialtyName(doctor)
  const experienceYears = doctor.experienceYears ?? doctor.experience ?? 0
  const priceLabel = formatPrice(doctor.price ?? doctor.consultationFee ?? doctor.fee)
  const ratingValue = typeof doctor.rating === 'number' ? doctor.rating.toFixed(1) : '0.0'
  const imageUrl = getDoctorImageUrl(doctor)

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        delay: index * 0.08,
        ease: 'easeOut',
      },
    },
  }

  if (variant === 'compact') {
    return (
      <Link to={`/doctors/${doctor.id}`}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card className="group cursor-pointer overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={doctorName}
                    className="h-16 w-16 rounded-2xl object-cover bg-muted"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {doctorName.split(' ').pop()?.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {doctorName}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{doctorSpecialty}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-foreground">{ratingValue}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    )
  }

  return (
    <Link to={`/doctors/${doctor.id}`}>
      <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
        <Card className="group cursor-pointer overflow-hidden h-full">
          <CardContent className="p-0">
            <div className="relative h-52 bg-slate-100 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={doctorName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-muted-foreground">
                  Không có ảnh
                </div>
              )}
              <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 text-xs font-medium">
                {doctorSpecialty}
              </Badge>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {doctorName}
                </h3>
                <p className="text-sm text-muted-foreground">{experienceYears} năm KN</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-secondary p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Đánh giá</p>
                  <p className="mt-2 text-lg font-semibold text-foreground flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" /> {ratingValue}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Giá khám</p>
                  <p className="mt-2 text-lg font-semibold text-primary">{priceLabel}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/70">
                <Button size="sm" className="w-full justify-center">
                  Đặt lịch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
