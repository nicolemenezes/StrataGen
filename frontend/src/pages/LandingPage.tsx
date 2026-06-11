import Navbar from '@/components/Landing/navbar';
import { FeaturesSectionWithHoverEffectsDemo } from '@/components/Landing/feature-section-with-hover-effects-demo'
import { HeroDemo } from '@/components/Landing/Hero'
import { Logos3Demo } from '@/components/Landing/TrustedBy'
import { FeatureDemo } from '@/components/Landing/HowItWorks'

import PricingDemo from '@/components/Landing/pricing-demo'
import { TestimonialsSectionDemo } from '@/components/Landing/testimonials-with-marquee-demo'
import { CTADemo } from '@/components/Landing/cta-with-rectangle-demo'
import { Footer } from '@/components/ui/footer'


type Props = {}

const LandingPage = (_props: Props) => {
  return (
    <div>
      <Navbar />
      <HeroDemo />
      <Logos3Demo />
      <FeaturesSectionWithHoverEffectsDemo />
      <FeatureDemo  />
      <PricingDemo />
      <TestimonialsSectionDemo />
      <CTADemo />
      <Footer />
    </div>
  )
}

export default LandingPage