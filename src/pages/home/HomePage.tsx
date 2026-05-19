import { HeroSection } from '@/components/home/hero-section'
import { SpecialtySection } from '@/components/home/specialty-section'
import { FeaturedDoctors } from '@/components/home/featured-doctors'
import { HowItWorks } from '@/components/home/how-it-works'
import { Testimonials } from '@/components/home/testimonials'
import { CTASection } from '@/components/home/cta-section'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <SpecialtySection />
      <FeaturedDoctors />
      <HowItWorks />
      <Testimonials />
      <CTASection />
    </>
  )
}
