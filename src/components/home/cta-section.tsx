import { Link } from 'react-router-dom'
import { Phone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
            Bạn cần tư vấn hoặc đặt lịch khám?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 leading-relaxed">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7. 
            Hãy liên hệ ngay để được tư vấn miễn phí.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full sm:w-auto gap-2 text-primary"
              asChild
            >
              <Link to="/booking">
                Đặt lịch ngay
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <a href="tel:1900123456">
                <Phone className="w-4 h-4" />
                1900 123 456
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
