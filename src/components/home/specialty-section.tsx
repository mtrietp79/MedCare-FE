import { Link } from 'react-router-dom'
import { 
  Heart, 
  Sparkles, 
  Baby, 
  Stethoscope, 
  Brain, 
  Bone, 
  HeartPulse, 
  Eye,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { specialties } from '@/lib/mock-data'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Sparkles,
  Baby,
  Stethoscope,
  Brain,
  Bone,
  HeartPulse,
  Eye,
}

export function SpecialtySection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Chuyên khoa nổi bật
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Khám và điều trị với các bác sĩ chuyên khoa hàng đầu trong nhiều lĩnh vực y tế
          </p>
        </div>

        {/* Specialty Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {specialties.map((specialty) => {
            const IconComponent = iconMap[specialty.icon] || Stethoscope
            return (
              <Link key={specialty.id} to={`/specialty/${specialty.slug}`}>
                <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/30">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {specialty.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {specialty.doctorCount} bác sĩ
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button variant="outline" size="lg" asChild>
            <Link to="/specialty" className="gap-2">
              Xem tất cả chuyên khoa
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
