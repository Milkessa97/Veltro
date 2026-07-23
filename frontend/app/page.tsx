"use client"

import { useState, useEffect } from "react"
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

const HAS_LOADED_KEY = "veltro_landing_loaded"

export default function LandingPage() {
  // Skip loading screen if user has already visited this session
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true
    return sessionStorage.getItem(HAS_LOADED_KEY) !== "1"
  })
  const [pageReady, setPageReady] = useState(!loading)

  // Signal that the page has been fully painted using two rAF cycles.
  // Only needed when we're actually showing the loading screen.
  useEffect(() => {
    if (!loading) return

    let raf2: number
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPageReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [loading])

  // Persist the "already loaded" flag once the loading screen finishes
  const handleLoadingComplete = () => {
    setLoading(false)
    try {
      sessionStorage.setItem(HAS_LOADED_KEY, "1")
    } catch {
      // sessionStorage can throw in restrictive environments (private mode, etc.)
      // failing silently just means the loading screen may show again — non-fatal
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && (
          <LoadingScreen
            onComplete={handleLoadingComplete}
            isPageReady={pageReady}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.995 }}
        animate={{
          opacity: loading ? 0 : 1,
          y: loading ? 12 : 0,
          scale: loading ? 0.995 : 1,
        }}
        transition={{
          duration: 0.75,
          ease: [0.25, 0.46, 0.45, 0.94],
          opacity: { duration: 0.6 },
        }}
        className="min-h-screen relative isolate overflow-hidden pb-0"
      >
        <div className="absolute inset-0 bg-background -z-50" />
        {!loading && <VeltroLogoAnimation />}
        <div className="relative z-10">
          <main className="max-w-screen mx-auto relative">
            <HeroSection />

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