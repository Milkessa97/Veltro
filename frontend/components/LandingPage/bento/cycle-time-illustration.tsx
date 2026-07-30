"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function CycleTimeIllustration() {
  const svgRef = useRef<SVGSVGElement>(null)
  const linePathRef = useRef<SVGPathElement>(null)
  const areaPathRef = useRef<SVGPathElement>(null)
  const circlesRef = useRef<SVGGElement>(null)

  const points = [
    [10, 80],
    [45, 60],
    [80, 68],
    [115, 40],
    [150, 48],
    [185, 26],
    [220, 30],
  ]

  const linePath = "M 10 80 L 45 60 L 80 68 L 115 40 L 150 48 L 185 26 L 220 30"
  const areaPath = "M 10 80 L 45 60 L 80 68 L 115 40 L 150 48 L 185 26 L 220 30 L 220 110 L 10 110 Z"

  useEffect(() => {
    const line = linePathRef.current
    const area = areaPathRef.current
    const circles = circlesRef.current?.children
    const svg = svgRef.current

    if (!line || !area || !circles || !svg) return

    const length = line.getTotalLength()

    gsap.set(line, {
      strokeDasharray: length,
      strokeDashoffset: length,
    })
    gsap.set(area, { opacity: 0 })
    gsap.set(circles, { scale: 0, transformOrigin: "center center" })

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: svg,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      })

      tl.to(line, {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: "power2.inOut",
      })
      .to(area, {
        opacity: 1,
        duration: 0.6,
        ease: "sine.out",
      }, "<")
      .to(circles, {
        scale: 1,
        duration: 0.4,
        stagger: 0.08,
        ease: "back.out(1.7)",
      }, "-=0.3")
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="w-full h-full flex items-end px-6 pb-6">
      <svg ref={svgRef} viewBox="0 0 230 120" className="w-full h-full" role="img" aria-label="Cycle time trending down">
        <defs>
          <linearGradient id="ct-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 55, 80, 105].map((y) => (
          <line key={y} x1="10" y1={y} x2="220" y2={y} stroke="hsl(var(--foreground))" strokeOpacity="0.08" strokeWidth="1" />
        ))}
        <path ref={areaPathRef} d={areaPath} fill="url(#ct-fill)" />
        <path
          ref={linePathRef}
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g ref={circlesRef}>
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4 : 2.5} fill="hsl(var(--primary))" />
          ))}
        </g>
      </svg>
    </div>
  )
}