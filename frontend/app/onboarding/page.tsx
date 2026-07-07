"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, LayoutDashboard, Check, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import { updatePreferences } from "@/lib/api/preferences"

// ─── Types ────────────────────────────────────────────────────────────────────

type DateRange = 7 | 30 | 90
type Step = "date-range" | "digest"

// ─── Data ─────────────────────────────────────────────────────────────────────

const DATE_RANGE_OPTIONS: { value: DateRange; label: string; description: string }[] = [
  { value: 7,  label: "Last 7 days",  description: "Great for fast-moving teams shipping daily" },
  { value: 30, label: "Last 30 days", description: "The balanced default — monthly sprints & reviews" },
  { value: 90, label: "Last 90 days", description: "Ideal for tracking long-running epics & trends" },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i < current
              ? "bg-white/60 w-8"
              : i === current
              ? "bg-white/30 w-5"
              : "bg-white/10 w-3"
          }`}
        />
      ))}
    </div>
  )
}

function SelectionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  id,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
  id: string
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-5 transition-all duration-200 group ${
        selected
          ? "border-white/25 bg-white/[0.07]"
          : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
            selected ? "bg-white/10 text-white/80" : "bg-white/5 text-white/30 group-hover:text-white/50"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm transition-colors ${selected ? "text-white" : "text-white/60 group-hover:text-white/80"}`}>
            {title}
          </p>
          <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{description}</p>
        </div>
        <div
          className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
            selected ? "border-white/60 bg-white/15" : "border-white/15"
          }`}
        >
          {selected && <Check className="h-2.5 w-2.5 text-white/80" strokeWidth={3} />}
        </div>
      </div>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep]             = useState<Step>("date-range")
  const [dateRange, setDateRange]   = useState<DateRange>(30)
  const [digestExpanded, setDigest] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const stepIndex = step === "date-range" ? 0 : 1
  const totalSteps = 2

  async function handleFinish() {
    setSubmitting(true)
    setError(null)
    try {
      await updatePreferences({
        default_date_range_days: dateRange,
        digest_panel_expanded: digestExpanded,
        is_onboarded: true,
      })
      router.push("/dashboard")
    } catch {
      setError("Something went wrong saving your preferences. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative overflow-hidden">

      {/* Grid backdrop */}
      <div className="absolute inset-0 grid-backdrop pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 pt-6 pb-0">
        <img src="/veltro-logo-dark-bg.svg" alt="Veltro" height={36} width={90} />
        <StepIndicator current={stepIndex} total={totalSteps} />
      </header>

      {/* Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Card */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">

            {/* Top strip — white, understated */}
            <div className="h-px w-full bg-white/20" />

            <div className="px-8 py-8">

              {/* Step: Date Range */}
              {step === "date-range" && (
                <div className="animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-white/50" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/35">
                      Step 1 of 2
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold text-white mt-4 mb-1">
                    Set your default date range
                  </h1>
                  <p className="text-sm text-white/45 mb-7 leading-relaxed">
                    This controls how far back Veltro looks when loading metrics across the dashboard. You can always change it later.
                  </p>

                  <div className="space-y-3">
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <SelectionCard
                        key={opt.value}
                        id={`date-range-${opt.value}`}
                        selected={dateRange === opt.value}
                        onClick={() => setDateRange(opt.value)}
                        icon={<CalendarDays className="h-4 w-4" />}
                        title={opt.label}
                        description={opt.description}
                      />
                    ))}
                  </div>

                  <button
                    id="date-range-next"
                    type="button"
                    onClick={() => setStep("digest")}
                    className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-sm transition-colors duration-200 active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step: Digest Panel */}
              {step === "digest" && (
                <div className="animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white/50" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/35">
                      Step 2 of 2
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold text-white mt-4 mb-1">
                    AI Digest panel
                  </h1>
                  <p className="text-sm text-white/45 mb-7 leading-relaxed">
                    The AI Digest panel surfaces an automated summary of your team's GitHub activity. Choose how it appears by default on the dashboard.
                  </p>

                  <div className="space-y-3">
                    <SelectionCard
                      id="digest-expanded"
                      selected={digestExpanded === true}
                      onClick={() => setDigest(true)}
                      icon={<LayoutDashboard className="h-4 w-4" />}
                      title="Expanded by default"
                      description="Show the full AI digest every time you open the dashboard"
                    />
                    <SelectionCard
                      id="digest-collapsed"
                      selected={digestExpanded === false}
                      onClick={() => setDigest(false)}
                      icon={<LayoutDashboard className="h-4 w-4" />}
                      title="Collapsed by default"
                      description="Keep it tucked away — expand on demand when you need the summary"
                    />
                  </div>

                  {error && (
                    <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                      {error}
                    </p>
                  )}

                  <div className="mt-8 flex gap-3">
                    <button
                      id="digest-back"
                      type="button"
                      onClick={() => setStep("date-range")}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/50 font-semibold text-sm hover:border-white/20 hover:text-white/70 transition-all duration-200 disabled:opacity-40"
                    >
                      Back
                    </button>
                    <button
                      id="onboarding-finish"
                      type="button"
                      onClick={handleFinish}
                      disabled={submitting}
                      className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-sm transition-colors duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                      ) : (
                        <>Go to Dashboard <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-white/20 mt-6">
            You can update these any time from your dashboard settings.
          </p>
        </div>
      </main>
    </div>
  )
}
