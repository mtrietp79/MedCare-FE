import { Link } from 'react-router-dom'
import { Star, Clock, MapPin } from 'lucide-react'
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

export function DoctorCard({ doctor, variant = 'default', index = 0 }: DoctorCardProps) {
  if (!doctor) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount ?? 0)
  }

  const doctorName = doctor.name ?? doctor.fullName ?? 'Bác sĩ'
  const doctorSpecialty = typeof doctor.specialty === 'string' ? doctor.specialty : doctor.specialty?.name ?? ''

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: 'easeOut',
      },
    },
  }

  const hoverVariants = {
    hover: {
      y: -8,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 10,
      },
    },
  }

  if (variant === 'compact') {
    return (
      <Link to={`/doctors/${doctor.id}`}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          variants={hoverVariants}
        >
          <Card className="group cursor-pointer overflow-hidden">
            <CardContent className="p-0">
              <div className="flex gap-4 p-4">
                {/* Avatar */}
                <motion.div
                  className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <span className="text-2xl font-bold text-primary">
                    {doctorName.split(' ').pop()?.charAt(0)}
                  </span>
                </motion.div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <motion.h3
                    className="font-semibold text-foreground truncate group-hover:text-primary transition-colors"
                    whileHover={{ letterSpacing: 0.5 }}
                  >
                    {doctorName}
                  </motion.h3>
                  <p className="text-sm text-muted-foreground mb-2">{doctorSpecialty}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{doctor.rating}</span>
                    <span className="text-sm text-muted-foreground">({doctor.reviewCount})</span>
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
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        variants={hoverVariants}
      >
        <Card className="group cursor-pointer overflow-hidden h-full">
          <CardContent className="p-0">
            {/* Image placeholder */}
            <motion.div
              className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-4xl font-bold text-primary">
                  {doctorName.split(' ').pop()?.charAt(0)}
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileHover={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                  {doctorSpecialty}
                </Badge>
              </motion.div>
            </motion.div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.h3
                  className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors"
                  whileHover={{ x: 4 }}
                >
                  {doctorName}
                </motion.h3>
                <p className="text-sm text-muted-foreground">{doctor.education}</p>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="flex items-center gap-4 text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center gap-1">
                  <motion.div
                    animate={{ rotate: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </motion.div>
                  <span className="font-medium">{doctor.rating}</span>
                  <span className="text-muted-foreground">({doctor.reviewCount})</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{doctor.experience} năm KN</span>
                </div>
              </motion.div>

              {/* Hospital */}
              <motion.div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{doctor.hospital}</span>
              </motion.div>

              {/* Price & CTA */}
              <motion.div
                className="flex items-center justify-between pt-2 border-t"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <div>
                  <span className="text-xs text-muted-foreground">Phí khám</span>
                  <div className="text-primary font-semibold">
                    {formatCurrency(doctor.consultationFee ?? 0)}
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="sm">Đặt lịch</Button>
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
