"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { SendIcon, CheckIcon } from "./LandingPage/icons"
import { Github, Twitter, Star, ArrowRight, MessageSquareHeart, Sparkles, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { sendContactEmailAction, sendFeedbackEmailAction } from "@/app/actions/email"

// ─── Star Rating ──────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, { headline: string; sub: string }> = {
  1: { headline: "Ouch 😅", sub: "I appreciate the honesty — what can be better?" },
  2: { headline: "Room to grow", sub: "Tell me more — your feedback will help." },
  3: { headline: "Pretty solid 👍", sub: "What would push it to 5 stars for you?" },
  4: { headline: "Almost perfect!", sub: "So close! What's the one thing missing?" },
  5: { headline: "You made my day 🎉", sub: "Mind leaving a few words I can quote?" },
}

function StarRating({
  value,
  hover,
  onHover,
  onChange,
}: {
  value: number
  hover: number
  onHover: (n: number) => void
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value)
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => onHover(n)}
            onMouseLeave={() => onHover(0)}
            className="group relative p-1 focus:outline-none"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-all duration-150",
                filled
                  ? "fill-amber-400 text-amber-400 scale-110"
                  : "fill-transparent text-muted-foreground/30 group-hover:text-amber-300"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

// ─── Feedback Panel ───────────────────────────────────────────────────────────

function FeedbackPanel() {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [quote, setQuote] = useState("")
  const [allowPublic, setAllowPublic] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [step, setStep] = useState<"rating" | "form">("rating")

  const label = RATING_LABELS[hover || rating]

  function handleRatingSelect(n: number) {
    setRating(n)
    // Short delay so the star animation registers before advancing
    setTimeout(() => setStep("form"), 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSending(true)
    setErrorMsg("")
    try {
      const result = await sendFeedbackEmailAction({
        rating,
        name,
        role,
        email,
        quote,
        allowPublic,
      })
      if (result.success) {
        setSubmitted(true)
      } else {
        setErrorMsg(result.error || "Failed to send feedback. Please check your setup.")
      }
    } catch (err: any) {
      setErrorMsg("Failed to send feedback. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-10 text-center"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
          <Sparkles className="h-7 w-7" />
        </span>
        <h3 className="text-foreground text-xl font-semibold">Thank you so much!</h3>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          Your {rating}‑star rating
          {quote ? " and kind words" : ""} mean the world to an indie builder. 🙏
        </p>
        {allowPublic && quote && (
          <p className="text-xs text-muted-foreground/60 italic">
            Your testimonial may appear on this page in a future update.
          </p>
        )}
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {step === "rating" ? (
        <motion.div
          key="rating"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex flex-col items-center gap-5 py-6 text-center"
        >
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-foreground font-semibold text-lg">How would you rate Veltro?</p>
            <p className="text-muted-foreground text-sm">
              Honest feedback helps me make it better — and helps me land the next gig 😄
            </p>
          </div>
          <StarRating value={rating} hover={hover} onHover={setHover} onChange={handleRatingSelect} />
          {label && (hover || rating) ? (
            <motion.div
              key={hover || rating}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-foreground font-medium">{label.headline}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{label.sub}</p>
            </motion.div>
          ) : null}
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 py-2"
        >
          {/* Re-show rating at top so user feels context */}
          <div className="flex items-center gap-2 mb-1">
            <StarRating value={rating} hover={0} onHover={() => {}} onChange={setRating} />
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              onClick={() => setStep("rating")}
            >
              change
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-name" className="text-xs font-medium text-foreground">
                Your name <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <input
                id="fb-name"
                type="text"
                disabled={isSending}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-role" className="text-xs font-medium text-foreground">
                Role / Company <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <input
                id="fb-role"
                type="text"
                disabled={isSending}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Eng Lead @ Acme"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-email" className="text-xs font-medium text-foreground">
              Your email <span className="text-muted-foreground/50">(optional — to receive a thank you note)</span>
            </label>
            <input
              id="fb-email"
              type="email"
              disabled={isSending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-quote" className="text-xs font-medium text-foreground">
              A few words <span className="text-muted-foreground/50">(optional — but hugely appreciated!)</span>
            </label>
            <textarea
              id="fb-quote"
              rows={3}
              disabled={isSending}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder={
                rating >= 4
                  ? 'e.g. "Veltro saved us hours every sprint review…"'
                  : "What would make this more useful for you?"
              }
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Consent toggle — only show if they wrote something */}
          {quote && (
            <motion.label
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-2.5 cursor-pointer"
            >
              <input
                type="checkbox"
                disabled={isSending}
                checked={allowPublic}
                onChange={(e) => setAllowPublic(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                You can show my name and quote on the landing page and your portfolio (you can always ask me to remove it).
              </span>
            </motion.label>
          )}

          {errorMsg && (
            <p className="text-red-500 text-xs mt-1 text-center font-medium">{errorMsg}</p>
          )}

          <Button
            type="submit"
            disabled={isSending}
            className="mt-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquareHeart className="h-4 w-4" />
            )}
            {isSending ? "Sending..." : "Submit feedback"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}

// ─── Contact Panel ────────────────────────────────────────────────────────────

function ContactPanel() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState({ x: 50, y: 50, active: false })
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !message) return
    setIsSending(true)
    setErrorMsg("")
    try {
      const result = await sendContactEmailAction({ email, message })
      if (result.success) {
        setSubmitted(true)
      } else {
        setErrorMsg(result.error || "Failed to send message. Please check your setup.")
      }
    } catch (err: any) {
      setErrorMsg("Failed to send message. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setGlow((g) => ({ ...g, active: false }))}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-6 md:p-8"
    >
      {/* Subtle inner overlay — matches bento cards */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "rgba(231,236,235,0.04)" }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
      {/* Mouse-tracked glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glow.active ? 1 : 0,
          background: `radial-gradient(300px circle at ${glow.x}% ${glow.y}%, hsl(var(--primary) / 0.15), transparent 70%)`,
        }}
      />

      {submitted ? (
        <div className="relative z-10 flex flex-col items-center justify-center gap-4 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckIcon className="h-7 w-7" />
          </span>
          <h3 className="text-foreground text-lg font-semibold">Message sent!</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            I'll reply to <span className="text-foreground font-medium">{email}</span> within a day.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => { setSubmitted(false); setEmail(""); setMessage("") }}
          >
            Send another
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
              Your email
            </label>
            <input
              id="contact-email"
              type="email"
              required
              disabled={isSending}
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
              disabled={isSending}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bug report, feature idea, or just want to say hi…"
              suppressHydrationWarning
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {errorMsg && (
            <p className="text-red-500 text-xs text-center font-medium">{errorMsg}</p>
          )}

          <Button
            type="submit"
            disabled={isSending}
            className="mt-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            {isSending ? "Sending..." : "Send message"}
          </Button>
        </form>
      )}
    </div>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function ContactSection() {
  return (
    <section id="contact-section" className="w-full px-5 pb-24 md:pb-36 relative isolate">
      {/* Background glow at the bottom, fading as it goes upward to blend with CTA Section */}
      <div className="absolute inset-x-0 bottom-[1.65rem] h-[300px] pointer-events-none -z-10 overflow-hidden select-none">
        {/* Glow blob matching CTA styling */}
        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[180px] rounded-full bg-primary/10 blur-[80px]" />
        {/* Fading dark gradient mask going upwards */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/70 to-transparent" />
      </div>

      {/* ── Header ── */}
      <div className="max-w-[720px] mx-auto py-8 md:py-14 flex flex-col items-center gap-3 text-center">
        <h2 className="text-foreground text-4xl md:text-5xl font-bold tracking-tight md:tracking-[-0.03em] leading-[1.1] text-balance">
          Built by one person,<br className="hidden sm:block" /> for engineering teams
        </h2>
        <p className="text-muted-foreground/90 text-lg font-medium leading-relaxed max-w-[52ch] text-pretty">
          I'm a solo developer. Every message, bug report, and kind word goes directly to me — and genuinely shapes what gets built next.
        </p>

        {/* Social links — compact, personal */}
        <div className="flex items-center gap-3 mt-1">
          <a
            href="https://github.com/Milkessa97"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Twitter className="h-3.5 w-3.5" />
            Twitter / X
          </a>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="max-w-[1040px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 ">

        {/* ── Left: Contact form ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-primary" />
            Send me a message
          </div>
          <ContactPanel />
        </div>

        {/* ── Right: Feedback / testimonial ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            Rate this project
            <span className="ml-auto text-xs font-normal text-muted-foreground/60 italic">
              helps my portfolio 🙏
            </span>
          </div>

          {/* Feedback card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-6 md:p-8">
            {/* Subtle inner overlay — matches bento cards */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "rgba(231,236,235,0.04)" }} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
            {/* Subtle amber ambient */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-amber-400/8 blur-[80px]" />
            <div className="relative z-10">
              <FeedbackPanel />
            </div>
          </div>

          {/* Small trust note */}
          <p className="text-xs text-muted-foreground/50 text-center leading-relaxed">
            Your name and quote may appear on this page with your consent. No accounts, no spam — just honest feedback between developers.
          </p>
        </div>
      </div>
    </section>
  )
}
