"use client"

import { useState, useEffect } from "react"
import {
  Clock,
  Timer,
  GitPullRequest,
  GitMerge,
  RefreshCw,
  Users2,
  BarChart3,
  AlertTriangle,
  FolderGit2,
  Rocket,
  Hourglass,
  ShieldAlert,
  Zap,
  Settings2, 
  Calendar, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Panel, PanelHeader } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo, type DateRange } from "./repo-context"
import {
  getRepoMetrics,
  getContributorMetrics,
  getPullRequests,
  type RepoMetrics,
  type ContributorMetrics,
  type PullRequestDetail,
} from "@/lib/api/repositories"


// ─── Weekly trend data helper ──────────────────────────────────────────────────

interface TrendBucket {
  week: string
  avgCycleTime: number
  avgReviewLatency: number
}

function buildWeeklyTrendData(prs: PullRequestDetail[], days: number): TrendBucket[] {
  const now = Date.now()
  const numWeeks = Math.max(1, Math.ceil(days / 7))
  const buckets: TrendBucket[] = []

  for (let i = numWeeks - 1; i >= 0; i--) {
    const start = now - (i + 1) * 7 * 86_400_000
    const end   = now - i       * 7 * 86_400_000
    const label = new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })

    // PRs merged in this week
    const mergedPRs = prs.filter((p) => {
      if (!p.merged_at) return false
      const t = new Date(p.merged_at).getTime()
      return t >= start && t < end
    })

    // PRs opened in this week that have a review
    const reviewedPRs = prs.filter((p) => {
      const openedTime = new Date(p.opened_at).getTime()
      return openedTime >= start && openedTime < end && p.first_review_at
    })

    const cycleTimes = mergedPRs.map((p) => {
      const ms = new Date(p.merged_at!).getTime() - new Date(p.opened_at).getTime()
      return Math.max(0, ms / 3_600_000)
    })

    const reviewLatencies = reviewedPRs.map((p) => {
      const ms = new Date(p.first_review_at!).getTime() - new Date(p.opened_at).getTime()
      return Math.max(0, ms / 3_600_000)
    })

    const avgCycleTime = cycleTimes.length > 0 
      ? Math.round((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) * 10) / 10
      : 0

    const avgReviewLatency = reviewLatencies.length > 0 
      ? Math.round((reviewLatencies.reduce((a, b) => a + b, 0) / reviewLatencies.length) * 10) / 10
      : 0

    buckets.push({ week: label, avgCycleTime, avgReviewLatency })
  }
  return buckets
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHours(h: number): string {
  if (h <= 0) return "—"
  if (h < 1) return `${Math.round(h * 60)}m`
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

function fmtScore(s: number): string {
  return `${s.toFixed(1)}%`
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricDef {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle: string
  sentiment: "good" | "warn" | "neutral"
}

function MetricCard({ metric, loading }: { metric: MetricDef; loading: boolean }) {
  if (loading) {
    return (
      <Panel className="p-5">
        <div className="space-y-3 animate-pulse">
          <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-6 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </Panel>
    )
  }

  const Icon = metric.icon
  const iconClass =
    metric.sentiment === "good"
      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
      : metric.sentiment === "warn"
      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", iconClass)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate cursor-default">{metric.label}</p>
          </TooltipTrigger>
          <TooltipContent>{metric.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{metric.value}</h3>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{metric.subtitle}</p>
    </Panel>
  )
}

// ─── Cycle Time & Review Latency Trend Chart ──────────────────────────────────

function CycleTimeTrendChart({
  pullRequests,
  loading,
  days,
}: {
  pullRequests: PullRequestDetail[]
  loading: boolean
  days: number
}) {
  const data = buildWeeklyTrendData(pullRequests, days)
  const hasData = data.some((b) => b.avgCycleTime > 0 || b.avgReviewLatency > 0)

  return (
    <Panel className="p-6">
      <PanelHeader icon={BarChart3} title="Cycle Time & Review Latency Trends" />
      {loading ? (
        <div className="h-[220px] animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
      ) : !hasData ? (
        <div className="h-[220px] flex items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">No review or merge data in this period.</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-700"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-gray-400 dark:text-gray-500"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `${value}h`}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-gray-400 dark:text-gray-500"
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <RechartTooltip
                contentStyle={{
                  background: "hsl(var(--background,0 0% 100%))",
                  border: "1px solid hsl(var(--border,214 32% 91%))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconType="plainline"
                iconSize={12}
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
              <Line
                type="monotone"
                dataKey="avgCycleTime"
                name="Avg Cycle Time"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="avgReviewLatency"
                name="Time to First Review"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </Panel>
  )
}

// ─── Lifecycle Stages Panel ───────────────────────────────────────────────────

function LifecycleStages({ metrics, loading }: { metrics: RepoMetrics | null; loading: boolean }) {
  const stages = [
    {
      label: "Coding",
      sublabel: "Open → First review",
      hours: metrics?.avg_coding_time_hours ?? 0,
      color: "bg-violet-400 dark:bg-violet-500",
      textColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Review",
      sublabel: "First review → Merge",
      hours: metrics?.avg_review_time_hours ?? 0,
      color: "bg-indigo-500",
      textColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Cycle Total",
      sublabel: "Open → Merge",
      hours: metrics?.avg_cycle_time_hours ?? 0,
      color: "bg-zinc-700 dark:bg-zinc-300",
      textColor: "text-zinc-700 dark:text-zinc-200",
    },
  ]

  const max = Math.max(1, ...stages.map((s) => s.hours))

  return (
    <Panel className="p-6">
      <PanelHeader icon={Zap} title="PR Lifecycle Stages" />
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : !metrics ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No data for this period.</p>
      ) : (
        <div className="space-y-5">
          {stages.map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className={cn("text-xs font-semibold", s.textColor)}>{s.label}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-2">{s.sublabel}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                  {fmtHours(s.hours)}
                </span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", s.color)}
                  style={{ width: `${(s.hours / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-1">
            Based on {metrics.merged_prs} merged PRs in this period
          </p>
        </div>
      )}
    </Panel>
  )
}

// ─── Bottleneck Panel ────────────────────────────────────────────────────

function BottleneckPanel({
  metrics,
  contributors,
  loading,
}: {
  metrics: RepoMetrics | null
  contributors: ContributorMetrics[]
  loading: boolean
}) {
  const score = metrics?.bottleneck_score ?? 0
  const severity =
    score >= 60 ? "high" : score >= 30 ? "medium" : "low"

  const ringColor =
    severity === "high"
      ? "stroke-red-500"
      : severity === "medium"
      ? "stroke-amber-400"
      : "stroke-emerald-500"

  const textColor =
    severity === "high"
      ? "text-red-600 dark:text-red-400"
      : severity === "medium"
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400"

  const label =
    severity === "high"
      ? "High — many PRs awaiting a reviewer"
      : severity === "medium"
      ? "Moderate — some PRs need attention"
      : "Low — team reviews are on track"

  const r = 30
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  // Reviewer insight aggregates from contributor metrics
  const totalAssigned = contributors.reduce((s, c) => s + c.review_assignments, 0)
  const totalOrganic = contributors.reduce((s, c) => s + c.organic_reviews, 0)
  // Contributors with formal assignments but <50% completion rate
  const incompleteReviewers = contributors.filter(
    (c) => c.review_assignments >= 3 && c.prs_reviewed / c.review_assignments < 0.5
  )

  return (
    <Panel className="p-6">
      <PanelHeader icon={ShieldAlert} title="Bottleneck Score" />
      {loading ? (
        <div className="flex items-center gap-6 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-2 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ) : !metrics ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No data for this period.</p>
      ) : (
        <>
          {/* Radial score + label */}
          <div className="flex items-center gap-6">
            <svg className="w-20 h-20 -rotate-90 flex-shrink-0" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={r} strokeWidth="7" className="stroke-zinc-100 dark:stroke-zinc-800" fill="none" />
              <circle
                cx="40"
                cy="40"
                r={r}
                strokeWidth="7"
                fill="none"
                className={cn("transition-all duration-700", ringColor)}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
              <text
                x="40"
                y="40"
                textAnchor="middle"
                dominantBaseline="middle"
                className="rotate-90"
                style={{ transform: "rotate(90deg)", transformOrigin: "40px 40px" }}
              />
            </svg>
            <div>
              <p className={cn("text-3xl font-bold tabular-nums", textColor)}>{fmtScore(score)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-pretty">{label}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                {metrics.open_prs} open PRs · {metrics.open_prs > 0 ? `${Math.round((score / 100) * metrics.open_prs)} unreviewed` : "none"}
              </p>
            </div>
          </div>

          {/* Reviewer breakdown — only shown when assignment data exists */}
          {(totalAssigned > 0 || totalOrganic > 0) && (
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-[#1F1F23] space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Review Coverage</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Assigned reviews */}
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3">
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{totalAssigned}</p>
                  <p className="text-[11px] text-indigo-500 dark:text-indigo-400/80 mt-0.5">Assigned reviews</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">via CODEOWNERS / manual</p>
                </div>
                {/* Organic reviews */}
                <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 p-3">
                  <p className="text-lg font-bold text-teal-600 dark:text-teal-400 tabular-nums">{totalOrganic}</p>
                  <p className="text-[11px] text-teal-500 dark:text-teal-400/80 mt-0.5">Proactive reviews</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">no assignment needed</p>
                </div>
              </div>

              {/* Contributors behind on assignments */}
              {incompleteReviewers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    {incompleteReviewers.length} reviewer{incompleteReviewers.length > 1 ? "s" : ""} behind on assignments
                  </p>
                  {incompleteReviewers.slice(0, 3).map((c) => {
                    const rate = c.review_assignments > 0
                      ? Math.round((c.prs_reviewed / c.review_assignments) * 100)
                      : 0
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        <img
                          src={c.avatar_url || "/placeholder.svg"}
                          alt={c.display_name}
                          className="w-5 h-5 rounded-full flex-shrink-0"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{c.display_name}</span>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 tabular-nums font-medium flex-shrink-0">
                          {rate}%
                        </span>
                        <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Panel>
  )
}


// ─── Contributor Activity ─────────────────────────────────────────────────────

function ContributorActivity({
  contributors,
  loading,
}: {
  contributors: ContributorMetrics[]
  loading: boolean
}) {
  const top = [...contributors]
    .sort((a, b) => b.prs_opened + b.prs_reviewed - (a.prs_opened + a.prs_reviewed))
    .slice(0, 5)
  const maxActivity = Math.max(1, ...top.map((c) => c.prs_opened + c.prs_reviewed))

  return (
    <Panel className="p-6">
      <PanelHeader icon={Users2} title="Contributor Activity" />
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No contributor data for this period.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity bars */}
          <div className="space-y-3">
            {top.map((c) => {
              const activity = c.prs_opened + c.prs_reviewed
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <Image
                    src={c.avatar_url || "/placeholder.svg"}
                    alt={c.display_name}
                    width={24}
                    height={24}
                    className="rounded-full flex-shrink-0"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {c.display_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{activity}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                        style={{ width: `${(activity / maxActivity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="font-medium pb-2">Contributor</th>
                  <th className="font-medium pb-2 text-right">Opened</th>
                  <th className="font-medium pb-2 text-right">Reviewed</th>
                  <th className="font-medium pb-2 text-right">Avg Cycle</th>
                </tr>
              </thead>
              <tbody>
                {top.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Image
                          src={c.avatar_url || "/placeholder.svg"}
                          alt={c.display_name}
                          width={20}
                          height={20}
                          className="rounded-full"
                          unoptimized
                        />
                        <span className="text-xs text-gray-900 dark:text-gray-100">@{c.username}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-xs text-gray-600 dark:text-gray-300">{c.prs_opened}</td>
                    <td className="py-2 text-right text-xs text-gray-600 dark:text-gray-300">{c.prs_reviewed}</td>
                    <td className="py-2 text-right text-xs text-gray-600 dark:text-gray-300">{fmtHours(c.avg_cycle_time_hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Panel>
  )
}

// ─── Overview Page ────────────────────────────────────────────────────────────

export default function Overview() {
  const { activeRepo, isSyncing, triggerSync, dateRangeDays, isLoading: repoLoading, error: repoError } = useRepo()

  const [metrics, setMetrics] = useState<RepoMetrics | null>(null)
  const [contributors, setContributors] = useState<ContributorMetrics[]>([])
  const [pullRequests, setPullRequests] = useState<PullRequestDetail[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeRepo) return
    let cancelled = false
    setDataLoading(true)
    setDataError(null)
    Promise.all([
      getRepoMetrics(activeRepo.id, dateRangeDays),
      getContributorMetrics(activeRepo.id, dateRangeDays),
      getPullRequests(activeRepo.id, dateRangeDays),
    ])
      .then(([m, c, prs]) => {
        if (!cancelled) {
          setMetrics(m)
          setContributors(c)
          setPullRequests(prs)
        }
      })
      .catch(() => {
        if (!cancelled) setDataError("Failed to load metrics. Try syncing the repository.")
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })
    return () => { cancelled = true }
  }, [activeRepo?.id, dateRangeDays])

  if (repoLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <MetricCard key={i} metric={{ icon: Clock, label: "", value: "", subtitle: "", sentiment: "neutral" }} loading />
        ))}
      </div>
    )
  }

  if (!activeRepo) {
    return (
      <EmptyState
        icon={FolderGit2}
        title="No repository selected"
        description="Connect a GitHub repository to start visualizing PR cycle time, review latency, and team health metrics."
      />
    )
  }

  if (repoError || dataError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description={repoError ?? dataError ?? "Unknown error"}
        action={
          <button
            type="button"
            onClick={triggerSync}
            className="flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry sync
          </button>
        }
      />
    )
  }

  if (isSyncing) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <MetricCard key={i} metric={{ icon: Clock, label: "", value: "", subtitle: "", sentiment: "neutral" }} loading />
        ))}
        <div className="col-span-full flex items-center justify-center gap-2 py-10 text-sm text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Syncing {activeRepo.owner}/{activeRepo.name} from GitHub…
        </div>
      </div>
    )
  }

  const metricCards: MetricDef[] = [
    {
      icon: Clock,
      label: "Avg PR Cycle Time",
      value: fmtHours(metrics?.avg_cycle_time_hours ?? 0),
      subtitle: "Open → merge, all merged PRs",
      sentiment: metrics ? (metrics.avg_cycle_time_hours < 48 ? "good" : "warn") : "neutral",
    },
    {
      icon: Timer,
      label: "Time to First Review",
      value: fmtHours(metrics?.avg_review_latency_hours ?? 0),
      subtitle: "Open → first reviewer activity",
      sentiment: metrics ? (metrics.avg_review_latency_hours < 12 ? "good" : "warn") : "neutral",
    },
    {
      icon: Hourglass,
      label: "Avg Open PR Age",
      value: fmtHours(metrics?.avg_open_pr_age_hours ?? 0),
      subtitle: "How long open PRs have been waiting",
      sentiment: metrics ? (metrics.avg_open_pr_age_hours < 48 ? "good" : "warn") : "neutral",
    },
    {
      icon: Rocket,
      label: "Deploy Frequency",
      value: metrics ? `${metrics.deploys_per_week.toFixed(1)}/wk` : "—",
      subtitle: `Merged PRs per week over ${dateRangeDays}d`,
      sentiment: metrics ? (metrics.deploys_per_week >= 2 ? "good" : "warn") : "neutral",
    },
  ]

  return (
    <div className="space-y-4">
      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <MetricCard key={m.label} metric={m} loading={dataLoading} />
        ))}
      </div>

      {/* PR Activity line chart */}
      <CycleTimeTrendChart pullRequests={pullRequests} loading={dataLoading} days={dateRangeDays} />

      {/* Lifecycle stages + bottleneck side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <LifecycleStages metrics={metrics} loading={dataLoading} />
        <BottleneckPanel metrics={metrics} contributors={contributors} loading={dataLoading} />
      </div>

      {/* Contributor activity */}
      <ContributorActivity contributors={contributors} loading={dataLoading} />
    </div>
  )
}