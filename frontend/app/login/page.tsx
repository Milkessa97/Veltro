"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GithubIcon } from "@/components/LandingPage/icons"
import { useAnalytics } from "@/hooks/use-analytics"

// Use a relative /api path so the login navigates through the Next.js rewrite
// proxy. This keeps the entire OAuth flow on the frontend domain, ensuring
// cookies set by the callback are scoped correctly.
// Server actions (auth.ts) still use NEXT_PUBLIC_API_URL directly — server-side
// requests are not subject to cross-origin cookie restrictions.
const LOGIN_URL = "/api/auth/login"

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

/** A handful of small hex particles drifting in the background. */
function HexField() {
  const hexes = [
    { cx: 90, cy: 90, r: 16, delay: "0s", dur: "9s" },
    { cx: 480, cy: 60, r: 10, delay: "1.4s", dur: "11s" },
    { cx: 60, cy: 380, r: 12, delay: "2.1s", dur: "8s" },
    { cx: 520, cy: 340, r: 18, delay: "0.6s", dur: "10s" },
    { cx: 300, cy: 460, r: 9, delay: "3s", dur: "12s" },
    { cx: 420, cy: 460, r: 13, delay: "1.8s", dur: "9.5s" },
  ]
  const point = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 })
      .map((_, i) => {
        const a = (Math.PI / 180) * (60 * i - 90)
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
      })
      .join(" ")

  return (
    <>
      {hexes.map((h, i) => (
        <polygon
          key={i}
          points={point(h.cx, h.cy, h.r)}
          fill="none"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="1"
          className="vlogin-drift"
          style={{ animationDelay: h.delay, animationDuration: h.dur, transformOrigin: `${h.cx}px ${h.cy}px` }}
        />
      ))}
    </>
  )
}

/** Signature motion piece: a pulse/cycle-time trace with a live marker at its head. */
function PulseTrace() {
  const d =
    "M-10,190 L70,190 L88,120 L106,230 L124,190 L260,190 L280,140 L298,220 L316,190 L470,190 L490,110 L508,215 L526,165 L544,190 L640,150"

  return (
    <svg viewBox="0 0 600 520" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[560px]" aria-hidden="true">
      <HexField />

      <defs>
        <linearGradient id="pulseFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          <stop offset="15%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="85%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pulseArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={`${d} L640,300 L-10,300 Z`} fill="url(#pulseArea)" />
      <path d={d} stroke="hsl(var(--border))" strokeWidth="1.5" />
      <path d={d} stroke="url(#pulseFade)" strokeWidth="1.5" strokeDasharray="26 640" className="vlogin-trace" />

      <circle cx="640" cy="150" r="5" fill="hsl(var(--primary))" className="vlogin-glow-pulse" />
    </svg>
  )
}

function ArrowBadge() {
  return (
    <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
      <svg width="14" height="14" viewBox="0 0 14 14" className="mr-3" aria-hidden="true">
        <polygon points="7,0 14,14 0,14" fill="hsl(var(--primary))" />
      </svg>
      <span className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground whitespace-nowrap">
        AI-written digests
      </span>
    </div>
  )
}

function StoryPanel() {
  return (
    <div className="vlogin-story relative hidden h-full flex-col justify-center overflow-hidden px-12 lg:flex xl:px-20">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            <span className="text-foreground">Every PR reviewed.</span>
            <br />
            <span className="text-foreground/40">Every bottleneck, caught automatically.</span>
          </h1>
          <ArrowBadge />
        </div>

        <div className="mt-4 flex justify-center">
          <PulseTrace />
        </div>
      </div>
    </div>
  )
}

function LoginPanel() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const analytics = useAnalytics()

  const handleLogin = () => {
    analytics.loginInitiated({ method: "github_oauth" })
    setLoading(true)
    window.location.href = LOGIN_URL
  }

  return (
    <div className="vlogin-form relative flex h-full min-h-screen flex-col justify-between px-8 py-10 sm:px-14 lg:px-20">
      <div className="flex flex-1 flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <Link href="/" className="z-20 flex items-center justify-center m-4 gap-2">
            <img src="/veltro-logo-dark-bg.svg" alt="Veltro" width="112" height="94" />
          </Link>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground text-center">Sign in</p>
          <h2 className="mt-3 text-foreground text-4xl font-semibold tracking-tight text-center">Welcome back</h2>
          <p className="mt-4 text-muted-foreground text-base leading-relaxed text-pretty text-center">
            Sign in with your GitHub account to sync repositories and view your team&apos;s engineering
            metrics.
          </p>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="mt-9 flex w-full max-w-lg items-center justify-center text-center gap-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 py-6 text-base font-semibold shadow-[0px_0px_0px_4px_rgba(255,255,255,0.06)] transition-all disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Connecting…
              </>
            ) : (
              <>
                <GithubIcon className="h-5 w-5" />
                Login with GitHub
              </>
            )}
          </Button>

          <div className="mt-5 flex items-start gap-2 max-w-xl px-8">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground text-center">
              Your session is stored in a secure, HTTP-only cookie. Veltro only requests read access to
              repository metadata.
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-foreground hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-foreground hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}

function LoginPageContent() {
  return (
    <main className="relative min-h-screen lg:grid lg:grid-cols-2">

      <LoginPanel />
      <StoryPanel />

      <style>{`
        /* Two distinct dark shades: Deep Obsidian for the form side, a
           deeper Electric-Indigo-tinted black for the story side. */
        .vlogin-form {
          background: hsl(240 6% 6%);
        }
        .vlogin-story {
          background: hsl(248 42% 4%);
          border-left: 1px solid hsl(var(--border));
        }

        @media (prefers-reduced-motion: no-preference) {
          .vlogin-trace {
            animation: vlogin-flow 4.5s linear infinite;
          }
          .vlogin-glow-pulse {
            animation: vlogin-glow-pulse 2.8s ease-in-out infinite;
          }
          .vlogin-drift {
            animation: vlogin-drift ease-in-out infinite;
          }
        }
        @keyframes vlogin-flow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -666; }
        }
        @keyframes vlogin-glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        @keyframes vlogin-drift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(6deg); }
        }
      `}</style>
    </main>
  )
}

// useSearchParams() requires a Suspense boundary in Next.js — the page
// shell is server-renderable, only the content below is deferred.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}