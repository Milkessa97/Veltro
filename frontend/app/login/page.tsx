"use client"

import { Suspense, useState, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GithubIcon } from "@/components/LandingPage/icons"

// Use a relative /api path so the login navigates through the Next.js rewrite
// proxy. This keeps the entire OAuth flow on the frontend domain, ensuring
// cookies set by the callback are scoped correctly.
// Server actions (auth.ts) still use NEXT_PUBLIC_API_URL directly — server-side
// requests are not subject to cross-origin cookie restrictions.
const LOGIN_URL = "/api/auth/login"

function LoginCard() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState({ x: 50, y: 50, active: false })

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    })
  }

  const handleLogin = () => {
    setLoading(true)
    window.location.href = LOGIN_URL
  }

  return (
    <main className="relative min-h-screen bg-background flex flex-col items-center justify-center px-5 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-backdrop" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 glow-spot opacity-60" />

      {/* Curved glowing bottom parabola */}
      <div className="absolute inset-x-0 bottom-0 h-[280px] pointer-events-none z-0">
        <svg
          className="w-full h-full opacity-70"
          viewBox="0 0 1440 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 280 C360 80, 1080 80, 1440 280"
            stroke="hsl(var(--primary) / 0.15)"
            strokeWidth="2"
            fill="url(#login-glow)"
          />
          <defs>
            <linearGradient id="login-glow" x1="720" y1="80" x2="720" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(var(--primary))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <img src="/veltro-logo-dark-bg.svg" alt="Company Logo" width="120" height="100" />
        </Link>

        <div
          ref={cardRef}
          onMouseMove={handleMove}
          onMouseLeave={() => setGlow((g) => ({ ...g, active: false }))}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 backdrop-blur-sm"
        >
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: glow.active ? 1 : 0,
              background: `radial-gradient(320px circle at ${glow.x}% ${glow.y}%, hsl(var(--primary) / 0.18), transparent 70%)`,
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-2 text-center">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs text-pretty">
              Connect your GitHub account to sync repositories and view your team&apos;s engineering metrics.
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="relative z-10 mt-7 w-full flex items-center justify-center gap-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 py-6 text-base font-semibold shadow-[0px_0px_0px_4px_rgba(255,255,255,0.06)] transition-all disabled:opacity-70"
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

          <div className="relative z-10 mt-6 flex items-start gap-2 rounded-lg border border-border bg-background/50 p-3">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your session is stored in a secure, HTTP-only cookie. DevPulse never exposes your token to the browser and
              only requests read access to repository metadata.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground relative z-10">
          By continuing you agree to our{" "}
          <Link href="#" className="text-foreground hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-foreground hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  )
}

// useSearchParams() requires a Suspense boundary in Next.js — the page
// shell is server-renderable, only LoginCard is deferred.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  )
}
