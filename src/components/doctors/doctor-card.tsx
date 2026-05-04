import { Link } from 'react-router-dom'
import { Star, Clock, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Doctor } from '@/types'

interface DoctorCardProps {
  doctor: Doctor
  variant?: 'default' | 'compact'
}

export function DoctorCard({ doctor, variant = 'default' }: DoctorCardProps) {
  if (!doctor) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount ?? 0)
  }

  if (variant === 'compact') {
    return (
      <Link to={`/doctors/${doctor.id}`}>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
          <CardContent className="p-0">
            <div className="flex gap-4 p-4">
              {/* Avatar */}
              <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {doctor.name.split(' ').pop()?.charAt(0)}
                </span>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {doctor.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">{doctor.specialty}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{doctor.rating}</span>
                  <span className="text-sm text-muted-foreground">({doctor.reviewCount})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link to={`/doctors/${doctor.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full">
        <CardContent className="p-0">
          {/* Image placeholder */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">
                {doctor.name.split(' ').pop()?.charAt(0)}
              </span>
            </div>
            <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
              {doctor.specialty}
            </Badge>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {doctor.name}
              </h3>
              <p className="text-sm text-muted-foreground">{doctor.education}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{doctor.rating}</span>
                <span className="text-muted-foreground">({doctor.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{doctor.experience} năm KN</span>
              </div>
            </div>

            {/* Hospital */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{doctor.hospital}</span>
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <span className="text-xs text-muted-foreground">Phí khám</span>
                <div className="text-primary font-semibold">
                  {formatCurrency(doctor.consultationFee)}
                </div>
              </div>
              <Button size="sm">Đặt lịch</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
