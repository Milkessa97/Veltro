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
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i < current
              ? "bg-[#6366f1]/80 w-8"
              : i === current
              ? "bg-[#6366f1]/30 w-5"
              : "bg-zinc-800 w-3"
          }`}
        />
      ))}
    </div>
  )
}

interface SelectionCardProps {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  id: string
}

function SelectionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  badge,
  id,
}: SelectionCardProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 group ${
        selected
          ? "border-[#6366f1]/40 bg-[#6366f1]/5 dark:bg-[#6366f1]/5"
          : "border-zinc-800 bg-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
            selected
              ? "bg-[#6366f1]/10 text-[#6366f1]"
              : "text-gray-400 bg-zinc-900 dark:text-zinc-600 group-hover:text-zinc-400"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm transition-colors truncate ${selected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
              {title}
            </p>
            {badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 leading-relaxed truncate">{description}</p>
        </div>
        <div
          className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
            selected ? "border-[#6366f1] bg-[#6366f1]" : "border-zinc-200 dark:border-zinc-800"
          }`}
        >
          {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
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

  // Loading UX messages between steps
  const [loadingMessage, setLoadingMessage]   = useState<string | null>(null)

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

  const handleRepoNext = () => {
    setLoadingMessage("Configuring default repository and initializing backend metadata sync...")
    setTimeout(() => {
      setLoadingMessage(null)
      setStep("date-range")
    }, 1500)
  }

  const handleDateRangeNext = () => {
    setLoadingMessage("Applying rolling analysis period to aggregate team commits and reviews...")
    setTimeout(() => {
      setLoadingMessage(null)
      setStep("digest")
    }, 1500)
  }

  async function handleFinish() {
    setSubmitting(true)
    setError(null)
    setLoadingMessage("Finalizing preferences and compiling initial engineering metrics...")
    try {
      await updatePreferences({
        default_repository_id: selectedRepoId,
        default_date_range_days: dateRange,
        digest_panel_expanded: digestExpanded,
        is_onboarded: true,
      })
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch {
      setError("Something went wrong saving your preferences. Please try again.")
      setSubmitting(false)
      setLoadingMessage(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col relative overflow-hidden text-white">

      {/* Glow effects matching settings aesthetic */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[150px]" />
        <div className="absolute bottom-[-100px] right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[150px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 pt-8 pb-0 max-w-5xl w-full mx-auto">
        <img src="/veltro-logo-dark-bg.svg" alt="Veltro" height={36} width={90} />
        <StepIndicator current={stepIndex} total={totalSteps} />
      </header>

      {/* Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Card / Panel layout */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0F0F12] shadow-xl overflow-hidden">
            {/* Top strip */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent" />

            <div className="px-8 py-8 min-h-[380px] flex flex-col justify-center">

              {loadingMessage ? (
                <div className="flex flex-col items-center justify-center text-center py-8 animate-fade-in">
                  <div className="relative mb-6">
                    <Loader2 className="h-10 w-10 text-[#6366f1] animate-spin" />
                    <div className="absolute inset-0 h-10 w-10 rounded-full border border-[#6366f1]/20 animate-ping pointer-events-none" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Processing Configuration</h3>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    {loadingMessage}
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 1: Repo Selection */}
                  {step === "repo" && (
                    <div className="animate-fade-in-up">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FolderGit2 className="h-4 w-4 text-[#6366f1]" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Step 1 of 3
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleRefreshRepos}
                          disabled={loadingRepos}
                          className="flex items-center gap-1.5 text-xs text-[#6366f1] hover:text-[#6366f1]/80 transition-colors disabled:opacity-40"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${loadingRepos ? "animate-spin" : ""}`} />
                          Sync GitHub
                        </button>
                      </div>

                      <h1 className="text-2xl font-bold text-white mt-4 mb-1 text-left">
                        Choose default repository
                      </h1>
                      <p className="text-sm text-zinc-400 mb-7 leading-relaxed text-left">
                        Select the main repository you want Veltro to load by default on your dashboard overview.
                      </p>

                      {loadingRepos ? (
                        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin mb-3" />
                          <p className="text-xs text-zinc-400">Loading your installed repositories...</p>
                        </div>
                      ) : repositories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-5 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                          <FolderGit2 className="h-8 w-8 text-zinc-600 mb-3" />
                          <p className="text-sm font-semibold text-white">No repositories found</p>
                          <p className="text-xs text-zinc-500 mt-1 max-w-[280px]">
                            Make sure you have installed the GitHub App on at least one repository.
                          </p>
                          <button
                            type="button"
                            onClick={handleRefreshRepos}
                            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white text-xs font-semibold transition-all"
                          >
                            <RefreshCw className="h-3 w-3" /> Sync with GitHub
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
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
                        <p className="mt-4 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-2.5">
                          {error}
                        </p>
                      )}

                      <button
                        id="repo-select-next"
                        type="button"
                        disabled={!selectedRepoId || loadingRepos}
                        onClick={handleRepoNext}
                        className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#6366f1]/90 text-white font-semibold text-sm transition-colors duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Step 2: Date Range */}
                  {step === "date-range" && (
                    <div className="animate-fade-in-up">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          <CalendarDays className="h-4 w-4 text-[#6366f1]" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Step 2 of 3
                        </span>
                      </div>

                      <h1 className="text-2xl font-bold text-white mt-4 mb-1 text-left">
                        Set your default date range
                      </h1>
                      <p className="text-sm text-zinc-400 mb-7 leading-relaxed text-left">
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
                          className="flex-1 px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-semibold text-sm hover:bg-zinc-900 transition-all duration-200"
                        >
                          Back
                        </button>
                        <button
                          id="date-range-next"
                          type="button"
                          onClick={handleDateRangeNext}
                          className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#6366f1]/90 text-white font-semibold text-sm transition-colors duration-200 active:scale-[0.98]"
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
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-[#6366f1]" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Step 3 of 3
                        </span>
                      </div>

                      <h1 className="text-2xl font-bold text-white mt-4 mb-1 text-left">
                        AI Digest panel
                      </h1>
                      <p className="text-sm text-zinc-400 mb-7 leading-relaxed text-left">
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
                        <p className="mt-4 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-2.5">
                          {error}
                        </p>
                      )}

                      <div className="mt-8 flex gap-3">
                        <button
                          id="digest-back"
                          type="button"
                          onClick={() => setStep("date-range")}
                          disabled={submitting}
                          className="flex-1 px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-semibold text-sm hover:bg-zinc-900 transition-all duration-200 disabled:opacity-40"
                        >
                          Back
                        </button>
                        <button
                          id="onboarding-finish"
                          type="button"
                          onClick={handleFinish}
                          disabled={submitting}
                          className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#6366f1]/90 text-white font-semibold text-sm transition-colors duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
                </>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-zinc-500 mt-6">
            You can update these any time from your dashboard settings.
          </p>
        </div>
      </main>
    </div>
  )
}
