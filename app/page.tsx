"use client"
import Navbar from "@/components/navbar"
import HeroSection from "@/components/sections/hero"
import HowItWorks from "@/components/sections/how-it-works"
import FeaturesGrid from "@/components/sections/features-grid"
import DashboardShowcase from "@/components/sections/dashboard-showcase"
import TestimonialCarousel from "@/components/sections/testimonial-carousel"
import ComparisonSection from "@/components/sections/comparison"
import CTASection from "@/components/sections/cta"
import Footer from "@/components/sections/footer"

export default function Home() {
  return (
    <main className="w-full overflow-hidden bg-gradient-to-b from-background via-background to-primary/5">
      <Navbar />
      <div className="pt-16">
        <HeroSection />
        <HowItWorks />
        <FeaturesGrid />
        <DashboardShowcase />
        <TestimonialCarousel />
        <ComparisonSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  )
}
