"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { AlertIcon } from "../icons"

gsap.registerPlugin(ScrollTrigger)

export function BottleneckIllustration() {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  const items = [
    { name: "#412 Auth refactor", days: "6d waiting", level: "high" },
    { name: "#398 API cleanup", days: "3d waiting", level: "med" },
    { name: "#421 UI polish", days: "1d waiting", level: "low" },
  ]
  const color = { high: "text-primary", med: "text-foreground/70", low: "text-muted-foreground" } as const
  const bar = { high: "w-full bg-primary", med: "w-2/3 bg-primary/60", low: "w-1/3 bg-primary/30" } as const

  useEffect(() => {
    const cards = itemsRef.current?.children
    const container = containerRef.current
    if (!cards || !container) return

    gsap.set(cards, { opacity: 0, x: 16 })

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }).to(cards, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.12,
        ease: "power3.out",
      })

      // Animate the progress bars filling in
      Array.from(cards).forEach((card, i) => {
        const bar = card.querySelector("[data-bar]") as HTMLElement
        if (!bar) return
        const targetWidth = bar.dataset.bar!
        gsap.set(bar, { width: "0%" })
        gsap.to(bar, {
          width: targetWidth,
          duration: 0.6,
          delay: i * 0.12 + 0.3,
          ease: "power2.out",
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
    <div ref={containerRef} className="w-full h-full flex items-center justify-center px-6 pb-6">
      <div ref={itemsRef} className="w-full space-y-2.5">
        {items.map((it) => {
          const barWidths = { high: "100%", med: "66%", low: "33%" }
          return (
            <div key={it.name} className="rounded-lg border border-border bg-card p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertIcon className={`h-4 w-4 ${color[it.level as keyof typeof color]}`} />
                <span className="text-sm text-foreground truncate">{it.name}</span>
                <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{it.days}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-foreground/10">
                <div
                  data-bar={barWidths[it.level as keyof typeof barWidths]}
                  className={`h-full rounded-full ${bar[it.level as keyof typeof bar]}`}
                  style={{ width: 0 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
