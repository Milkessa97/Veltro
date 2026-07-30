"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function ReviewFlowIllustration() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const linesRef = useRef<SVGGElement>(null)
  const progressBarRef = useRef<SVGRectElement>(null)

  const stages = ["Open", "Review", "Approved", "Merged"]

  useEffect(() => {
    const nodes = nodesRef.current?.children
    const lines = linesRef.current?.children
    const bar = progressBarRef.current
    const container = containerRef.current
    if (!nodes || !lines || !bar || !container) return

    gsap.set(nodes, { scale: 0, transformOrigin: "center", opacity: 0 })
    gsap.set(lines, { opacity: 0 })
    gsap.set(bar, { scaleX: 0, transformOrigin: "left" })

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      })

      tl.to(lines, {
        opacity: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
      })
      .to(nodes, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(2)",
      }, "-=0.2")
      .to(bar, {
        scaleX: 1,
        duration: 0.6,
        ease: "power3.inOut",
      }, "-=0.2")
    })

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center px-6 pb-6">
      <svg ref={svgRef} viewBox="0 0 240 120" className="w-full h-full" role="img" aria-label="Review flow between stages">
        <g ref={linesRef}>
          {[0, 1, 2].map((i) => (
            <line
              key={i}
              x1={40 + i * 60}
              y1="40"
              x2={70 + i * 60}
              y2="40"
              stroke="hsl(var(--primary))"
              strokeOpacity="0.5"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          ))}
        </g>
        <g ref={nodesRef}>
          {stages.map((s, i) => (
            <g key={s}>
              <circle
                cx={30 + i * 60}
                cy="40"
                r="14"
                fill="hsl(var(--card))"
                stroke="hsl(var(--primary))"
                strokeOpacity={i === stages.length - 1 ? "1" : "0.5"}
                strokeWidth="2"
              />
              <circle cx={30 + i * 60} cy="40" r="4" fill="hsl(var(--primary))" fillOpacity={i === stages.length - 1 ? "1" : "0.6"} />
              <text x={30 + i * 60} y="72" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                {s}
              </text>
            </g>
          ))}
        </g>
        <rect x="14" y="92" width="212" height="14" rx="7" fill="hsl(var(--foreground))" fillOpacity="0.08" />
        <rect ref={progressBarRef} x="14" y="92" width="150" height="14" rx="7" fill="hsl(var(--primary))" fillOpacity="0.5" />
      </svg>
    </div>
  )
}
