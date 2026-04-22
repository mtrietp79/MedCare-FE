import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { testimonials } from '@/lib/mock-data'

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Bệnh nhân nói gì về chúng tôi
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hàng nghìn bệnh nhân đã tin tưởng và hài lòng với dịch vụ của MedCare
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                {/* Quote icon */}
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                
                {/* Content */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {'"'}{testimonial.content}{'"'}
                </p>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(testimonial.date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
