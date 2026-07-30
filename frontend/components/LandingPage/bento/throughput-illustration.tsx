"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function ThroughputIllustration() {
  const containerRef = useRef<HTMLDivElement>(null)
  const barsGroupRef = useRef<SVGGElement>(null)

  const bars = [40, 55, 48, 70, 62, 85, 78]
  const days = ["M", "T", "W", "T", "F", "S", "S"]

  useEffect(() => {
    const barEls = barsGroupRef.current?.querySelectorAll("[data-bar]")
    const container = containerRef.current
    if (!barEls || !container) return

    // Set initial state: bars at y=100, height=0 (grown from bottom)
    barEls.forEach((el) => {
      const rect = el as SVGRectElement
      const origY = parseFloat(rect.getAttribute("data-orig-y") || "0")
      const origH = parseFloat(rect.getAttribute("data-orig-h") || "0")
      gsap.set(rect, { attr: { y: origY + origH, height: 0 } })
    })

    const ctx = gsap.context(() => {
      barEls.forEach((el, i) => {
        const rect = el as SVGRectElement
        const origY = parseFloat(rect.getAttribute("data-orig-y") || "0")
        const origH = parseFloat(rect.getAttribute("data-orig-h") || "0")

        gsap.to(rect, {
          attr: { y: origY, height: origH },
          duration: 0.5,
          delay: i * 0.07,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        })
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full flex items-end justify-center px-6 pb-6">
      <svg viewBox="0 0 230 120" className="w-full h-full" role="img" aria-label="Weekly throughput bars">
        <g ref={barsGroupRef}>
          {bars.map((h, i) => {
            const x = 12 + i * 31
            const y = 100 - h
            const highlight = i === bars.length - 2
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width="18"
                  height={h}
                  rx="4"
                  fill="hsl(var(--primary))"
                  fillOpacity={highlight ? "1" : "0.35"}
                  data-bar="true"
                  data-orig-y={y}
                  data-orig-h={h}
                />
                <text x={x + 9} y="114" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
                  {days[i]}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
