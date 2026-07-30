"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { GithubIcon, RepoIcon, CheckIcon } from "../icons"

gsap.registerPlugin(ScrollTrigger)

export function GithubSyncIllustration() {
  const containerRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null)
  const reposRef = useRef<HTMLDivElement>(null)

  const repos = ["web-app", "api-server", "design-system"]

  useEffect(() => {
    const icon = iconRef.current
    const repoCards = reposRef.current?.children
    const container = containerRef.current
    if (!icon || !repoCards || !container) return

    gsap.set(icon, { scale: 0, opacity: 0 })
    gsap.set(repoCards, { opacity: 0, y: 10 })

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      })

      tl.to(icon, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(2)",
      })
      .to(repoCards, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.1,
        ease: "power3.out",
      }, "-=0.1")
    })

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center gap-4 px-6 pb-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full glow-spot" />
        <span
          ref={iconRef}
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-foreground animate-float"
        >
          <GithubIcon className="h-7 w-7" />
        </span>
      </div>
      <div ref={reposRef} className="w-full space-y-2">
        {repos.map((r) => (
          <div key={r} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 backdrop-blur-sm">
            <RepoIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{r}</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-primary">
              <CheckIcon className="h-3.5 w-3.5" />
              Synced
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
