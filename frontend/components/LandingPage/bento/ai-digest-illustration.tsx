"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SparkIcon } from "../icons"

gsap.registerPlugin(ScrollTrigger)

export function AiDigestIllustration() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)

  const lines = [
    { w: "w-11/12", label: true },
    { w: "w-4/5" },
    { w: "w-full" },
    { w: "w-3/5" },
  ]

  useEffect(() => {
    const card = cardRef.current
    const header = headerRef.current
    const lines = linesRef.current?.children
    const container = containerRef.current
    if (!card || !header || !lines || !container) return

    gsap.set(card, { opacity: 0, y: 20 })
    gsap.set(header, { opacity: 0, x: -10 })
    gsap.set(lines, { opacity: 0, x: -8, scaleX: 0.85, transformOrigin: "left" })

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      })

      tl.to(card, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
        .to(header, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, "-=0.2")
        .to(lines, {
          opacity: 1,
          x: 0,
          scaleX: 1,
          duration: 0.35,
          stagger: 0.08,
          ease: "power2.out",
        }, "-=0.15")
    })

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center px-6 pb-6">
      <div ref={cardRef} className="w-full rounded-xl border border-border bg-card p-4 backdrop-blur-sm">
        <div ref={headerRef} className="flex items-center gap-2 mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <SparkIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-foreground">Weekly digest</span>
          <span className="ml-auto text-[10px] font-medium text-primary">AI</span>
        </div>
        <div ref={linesRef} className="space-y-2.5">
          {lines.map((l, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full ${l.w} ${l.label ? "bg-primary/40" : "bg-foreground/15"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
