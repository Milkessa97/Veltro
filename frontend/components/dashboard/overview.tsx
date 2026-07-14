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
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Panel, PanelHeader } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"
import {
  getRepoMetrics,
  getContributorMetrics,
  type RepoMetrics,
  type ContributorMetrics,
} from "@/lib/api/repositories"
import { formatRelativeTime } from "@/lib/veltro-data"

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

// ─── Bottleneck Panel ─────────────────────────────────────────────────────────

function BottleneckPanel({ metrics, loading }: { metrics: RepoMetrics | null; loading: boolean }) {
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
        <div className="flex items-center gap-6">
          {/* Radial progress */}
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
    ])
      .then(([m, c]) => {
        if (!cancelled) {
          setMetrics(m)
          setContributors(c)
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
        {[...Array(8)].map((_, i) => (
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
        {[...Array(8)].map((_, i) => (
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
    {
      icon: GitPullRequest,
      label: "Open PRs",
      value: String(metrics?.open_prs ?? "—"),
      subtitle: `${metrics?.total_prs ?? 0} total in this period`,
      sentiment: "neutral",
    },
    {
      icon: GitMerge,
      label: "Merged PRs",
      value: String(metrics?.merged_prs ?? "—"),
      subtitle: `${metrics?.closed_prs ?? 0} closed without merge`,
      sentiment: "neutral",
    },
    {
      icon: BarChart3,
      label: "Additions / Deletions",
      value: metrics ? `+${metrics.total_additions.toLocaleString()}` : "—",
      subtitle: metrics ? `−${metrics.total_deletions.toLocaleString()} lines removed` : "Sync to load",
      sentiment: "neutral",
    },
    {
      icon: Users2,
      label: "Contributors",
      value: String(contributors.length || "—"),
      subtitle: "Active in this period",
      sentiment: "neutral",
    },
  ]

  return (
    <div className="space-y-4">
      {/* 8 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <MetricCard key={m.label} metric={m} loading={dataLoading} />
        ))}
      </div>

      {/* Lifecycle stages + bottleneck side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <LifecycleStages metrics={metrics} loading={dataLoading} />
        <BottleneckPanel metrics={metrics} loading={dataLoading} />
      </div>

      {/* Contributor activity */}
      <ContributorActivity contributors={contributors} loading={dataLoading} />
    </div>
  )
}