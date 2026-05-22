import { HeroSection } from '@/components/home/hero-section'
import { SpecialtySection } from '@/components/home/specialty-section'
import { FeaturedDoctors } from '@/components/home/featured-doctors'
import { FeaturedServices } from '@/components/home/featured-services'
import { FacilitiesSection } from '@/components/home/facilities-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { Testimonials } from '@/components/home/testimonials'
import { CTASection } from '@/components/home/cta-section'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <SpecialtySection />
      <FeaturedDoctors />
      <FeaturedServices />
      <FacilitiesSection />
      <HowItWorks />
      <Testimonials />
      <CTASection />
    </>
  )
}
