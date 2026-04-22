import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DoctorCard } from '@/components/doctors/doctor-card'
import { doctors } from '@/lib/mock-data'

export function FeaturedDoctors() {
  // Show top 4 doctors by rating
  const featuredDoctors = [...doctors]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)

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

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDoctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </div>
    </section>
  )
}
