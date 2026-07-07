"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HeroSection } from "@/components/hero-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { BentoSection } from "@/components/bento-section"
import { ContactSection } from "@/components/contact-section"
import { CTASection } from "@/components/cta-section"
import { FooterSection } from "@/components/footer-section"
import { AnimatedSection } from "@/components/animated-section"
import VeltroLogoAnimation from "@/components/veltro-logo-animation"
import { LoadingScreen } from "@/components/loading-screen"

export default function LandingPage() {
  const [loading, setLoading] = useState(true)

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: loading ? 0 : 1, y: loading ? 40 : 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen relative isolate overflow-hidden pb-0"
      >
        <div className="absolute inset-0 bg-background -z-50" />
        {!loading && <VeltroLogoAnimation />}
        <div className="relative z-10">
          <main className="max-w-screen mx-auto relative">
            <HeroSection />

            {/* Dashboard preview — fluid, in-flow */}
            <div className="relative z-30 flex justify-start xl:justify-center w-full max-w-[1320px] mx-auto px-6 md:px-8">
              <AnimatedSection>
                <div
                  className="
                    relative
                    w-[calc(100%+clamp(4rem,26vw,30rem))]
                    -mt-[clamp(3rem,36vw,8rem)]
                    [mask-image:linear-gradient(to_right,black_0%,black_65%,transparent_92%)]
                    [-webkit-mask-image:linear-gradient(to_right,black_0%,black_65%,transparent_92%)]
                  "
                >
                  <DashboardPreview />
                </div>
              </AnimatedSection>
            </div>
          </main>

          <AnimatedSection
            id="features-section"
            className="relative z-10 max-w-[1320px] mx-auto mt-16 md:mt-24"
            delay={0.1}
          >
            <BentoSection />
          </AnimatedSection>
          <AnimatedSection id="contact-section" className="relative z-20 max-w-[1320px] mx-auto mt-8 md:mt-16" delay={0.2}>
            <ContactSection />
          </AnimatedSection>
          <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16" delay={0.2}>
            <CTASection />
          </AnimatedSection>
          <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16" delay={0.2}>
            <FooterSection />
          </AnimatedSection>
        </div>
      </motion.div>
    </>
  )
}
