import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { SportsSection } from "@/components/landing/sports-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { StructuredData, generateOrganizationSchema, generateWebAppSchema } from "@/lib/seo"

export default function LandingPage() {
  return (
    <>
      <StructuredData data={generateOrganizationSchema()} />
      <StructuredData data={generateWebAppSchema()} />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <SportsSection />
          <FeaturesSection />
          <PricingSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </>
  )
}
