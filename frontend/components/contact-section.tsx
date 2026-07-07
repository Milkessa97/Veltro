"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { SendIcon, CheckIcon } from "./LandingPage/icons"

export function ContactSection() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState({ x: 50, y: 50, active: false })
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !message) return
    setSubmitted(true)
  }

  return (
    <section id="contact-section" className="w-full px-5 flex flex-col items-center">
      <div className="w-full max-w-[720px] py-8 md:py-14 flex flex-col items-center gap-3 text-center">
        <h2 className="text-foreground text-4xl md:text-5xl font-bold tracking-tight md:tracking-[-0.03em] leading-[1.1] text-balance">
          Talk to the team
        </h2>
        <p className="text-muted-foreground/90 text-lg font-medium leading-relaxed max-w-[55ch] text-pretty">
          Questions about Veltro or want a walkthrough for your team? Send us a note and we&apos;ll get back within a
          day.
        </p>
      </div>

      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setGlow((g) => ({ ...g, active: false }))}
        className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 backdrop-blur-sm"
      >
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: glow.active ? 1 : 0,
            background: `radial-gradient(320px circle at ${glow.x}% ${glow.y}%, hsl(var(--primary) / 0.18), transparent 70%)`,
          }}
        />

        {submitted ? (
          <div className="relative z-10 flex flex-col items-center justify-center gap-4 py-10 text-center animate-fade-in-up">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CheckIcon className="h-8 w-8 animate-draw-check" />
            </span>
            <h3 className="text-foreground text-xl font-semibold">Message sent</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Thanks for reaching out. We&apos;ll reply to {email} shortly.
            </p>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSubmitted(false)
                setEmail("")
                setMessage("")
              }}
            >
              Send another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                suppressHydrationWarning
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your team and repos..."
                suppressHydrationWarning
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <Button
              type="submit"
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <SendIcon className="h-4 w-4" />
              Send message
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
