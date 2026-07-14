"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, LayoutDashboard, Check, ArrowRight, Sparkles, Loader2, FolderGit2, RefreshCw } from "lucide-react"
import { updatePreferences } from "@/lib/api/preferences"
import { getRepositories, type Repository } from "@/lib/api/repositories"

// ─── Types ────────────────────────────────────────────────────────────────────

type DateRange = 7 | 30 | 90
type Step = "repo" | "date-range" | "digest"

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
  badge,
  id,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
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
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm transition-colors truncate ${selected ? "text-white" : "text-white/60 group-hover:text-white/80"}`}>
              {title}
            </p>
            {badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/40">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-white/35 mt-0.5 leading-relaxed truncate">{description}</p>
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

  const [step, setStep]                       = useState<Step>("repo")
  const [repositories, setRepositories]       = useState<Repository[]>([])
  const [selectedRepoId, setSelectedRepoId]   = useState<string | null>(null)
  const [loadingRepos, setLoadingRepos]       = useState(true)
  const [dateRange, setDateRange]             = useState<DateRange>(30)
  const [digestExpanded, setDigest]           = useState(true)
  const [submitting, setSubmitting]           = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  const stepIndex = step === "repo" ? 0 : step === "date-range" ? 1 : 2
  const totalSteps = 3

  useEffect(() => {
    async function loadRepos() {
      try {
        const data = await getRepositories()
        setRepositories(data)
        if (data.length > 0) {
          setSelectedRepoId(data[0].id)
        }
      } catch (err) {
        console.error(err)
        setError("Could not load your repositories. Try refreshing.")
      } finally {
        setLoadingRepos(false)
      }
    }
    loadRepos()
  }, [])

  async function handleRefreshRepos() {
    setLoadingRepos(true)
    setError(null)
    try {
      const data = await getRepositories(true)
      setRepositories(data)
      if (data.length > 0) {
        setSelectedRepoId((prev) => prev || data[0].id)
      }
    } catch (err) {
      console.error(err)
      setError("Failed to sync with GitHub. Please try again.")
    } finally {
      setLoadingRepos(false)
    }
  }

  async function handleFinish() {
    setSubmitting(true)
    setError(null)
    try {
      await updatePreferences({
        default_repository_id: selectedRepoId,
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

              {/* Step 1: Repo Selection */}
              {step === "repo" && (
                <div className="animate-fade-in-up">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <FolderGit2 className="h-4 w-4 text-white/50" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/35">
                        Step 1 of 3
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRefreshRepos}
                      disabled={loadingRepos}
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingRepos ? "animate-spin" : ""}`} />
                      Sync GitHub
                    </button>
                  </div>

                  <h1 className="text-2xl font-bold text-white mt-4 mb-1">
                    Choose default repository
                  </h1>
                  <p className="text-sm text-white/45 mb-7 leading-relaxed">
                    Select the main repository you want Veltro to load by default on your dashboard overview.
                  </p>

                  {loadingRepos ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                      <Loader2 className="h-6 w-6 text-white/30 animate-spin mb-3" />
                      <p className="text-xs text-white/30">Loading your installed repositories...</p>
                    </div>
                  ) : repositories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-5 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                      <FolderGit2 className="h-8 w-8 text-white/20 mb-3" />
                      <p className="text-sm font-semibold text-white/70">No repositories found</p>
                      <p className="text-xs text-white/35 mt-1 max-w-[280px]">
                        Make sure you have installed the GitHub App on at least one repository.
                      </p>
                      <button
                        type="button"
                        onClick={handleRefreshRepos}
                        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold transition-all"
                      >
                        <RefreshCw className="h-3 w-3" /> Sync with GitHub
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {repositories.map((repo) => (
                        <SelectionCard
                          key={repo.id}
                          id={`repo-selection-${repo.id}`}
                          selected={selectedRepoId === repo.id}
                          onClick={() => setSelectedRepoId(repo.id)}
                          icon={<FolderGit2 className="h-4 w-4" />}
                          title={repo.name}
                          description={repo.full_name}
                          badge={repo.is_private ? "private" : "public"}
                        />
                      ))}
                    </div>
                  )}

                  {error && step === "repo" && (
                    <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                      {error}
                    </p>
                  )}

                  <button
                    id="repo-select-next"
                    type="button"
                    disabled={!selectedRepoId || loadingRepos}
                    onClick={() => setStep("date-range")}
                    className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-sm transition-colors duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Date Range */}
              {step === "date-range" && (
                <div className="animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-white/50" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/35">
                      Step 2 of 3
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

                  <div className="mt-8 flex gap-3">
                    <button
                      id="date-range-back"
                      type="button"
                      onClick={() => setStep("repo")}
                      className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/50 font-semibold text-sm hover:border-white/20 hover:text-white/70 transition-all duration-200"
                    >
                      Back
                    </button>
                    <button
                      id="date-range-next"
                      type="button"
                      onClick={() => setStep("digest")}
                      className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-sm transition-colors duration-200 active:scale-[0.98]"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Digest Panel */}
              {step === "digest" && (
                <div className="animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white/50" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/35">
                      Step 3 of 3
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

                  {error && step === "digest" && (
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
