"use client"

import { useState } from "react"
import {
  Clock,
  Timer,
  GitPullRequest,
  GitMerge,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Users2,
  FolderGit2,
  BarChart3,
  AlertTriangle,
} from "lucide-react"
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
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
import { contributors, cycleTimeSeries, pullRequests, formatRelativeTime } from "@/lib/veltro-data"

interface Metric {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend: number
  positive: boolean
  description: string
}

const metrics: Metric[] = [
  {
    icon: Clock,
    label: "Avg PR Cycle Time",
    value: "26h",
    trend: -14,
    positive: true,
    description: "Open to merge, across all PRs",
  },
  {
    icon: Timer,
    label: "Avg Time to First Review",
    value: "5.2h",
    trend: -8,
    positive: true,
    description: "From ready for review to first comment",
  },
  {
    icon: GitPullRequest,
    label: "Open PRs",
    value: "18",
    trend: 3,
    positive: false,
    description: "Oldest open 4d 6h",
  },
  {
    icon: GitMerge,
    label: "Merged This Week",
    value: "41",
    trend: 9,
    positive: true,
    description: "vs 38 last week",
  },
]

const chartConfig = {
  cycleTime: { label: "Cycle Time (h)", color: "hsl(var(--primary))" },
  reviewTime: { label: "Review Time (h)", color: "hsl(261 83% 68%)" },
} satisfies ChartConfig

function MetricCard({ metric }: { metric: Metric }) {
  const TrendIcon = metric.trend < 0 ? TrendingDown : TrendingUp
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <metric.icon className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            metric.positive
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
          )}
        >
          <TrendIcon className="w-3 h-3" />
          {Math.abs(metric.trend)}%
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
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{metric.description}</p>
    </Panel>
  )
}

function AiInsights() {
  const [loading, setLoading] = useState(false)
  const [generatedAt, setGeneratedAt] = useState("2026-07-06T07:00:00Z")
  const [stale, setStale] = useState(true)

  function regenerate() {
    setLoading(true)
    setTimeout(() => {
      setGeneratedAt(new Date().toISOString())
      setStale(false)
      setLoading(false)
    }, 1800)
  }

  return (
    <Panel className="p-6">
      <PanelHeader
        icon={Sparkles}
        title="AI Insights"
        action={
          <div className="flex items-center gap-2">
            {stale && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                Stale
              </span>
            )}
            <button
              type="button"
              onClick={regenerate}
              disabled={loading}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Regenerate
            </button>
          </div>
        }
      />
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-full" />
          <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-11/12" />
          <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-4/5" />
          <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-2/3" />
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 text-pretty">
            Engineering velocity improved this period. Average cycle time dropped 14% to 26 hours, driven by faster
            first reviews from Sarah and Priya. The primary drag is merge latency on ready-to-merge PRs, which sat an
            average of 35 hours before landing. Marcus and Tom are carrying elevated review queues; redistributing two
            or three reviews would likely reduce waiting time across the board.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Generated {formatRelativeTime(generatedAt)}
          </p>
        </>
      )}
    </Panel>
  )
}

function ContributorActivity() {
  const top = [...contributors].sort((a, b) => b.activity - a.activity).slice(0, 5)
  const max = Math.max(...top.map((c) => c.activity))

  return (
    <Panel className="p-6">
      <PanelHeader icon={Users2} title="Contributor Activity" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity visualization */}
        <div className="space-y-3">
          {top.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <Image
                src={c.avatar || "/placeholder.svg"}
                alt={c.name}
                width={24}
                height={24}
                className="rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{c.activity}</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                    style={{ width: `${(c.activity / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top contributor summary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="font-medium pb-2">Contributor</th>
                <th className="font-medium pb-2 text-right">Opened</th>
                <th className="font-medium pb-2 text-right">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {top.map((c) => (
                <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={c.avatar || "/placeholder.svg"}
                        alt={c.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span className="text-xs text-gray-900 dark:text-gray-100">{c.username}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-xs text-gray-600 dark:text-gray-300">{c.prsOpened}</td>
                  <td className="py-2 text-right text-xs text-gray-600 dark:text-gray-300">{c.prsReviewed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  )
}

export default function Overview() {
  const { activeRepo, isSyncing, triggerSync } = useRepo()
  const openPrs = pullRequests.filter((p) => p.state !== "merged").length

  if (!activeRepo) {
    return (
      <EmptyState
        icon={FolderGit2}
        title="No repository selected"
        description="Connect a GitHub repository to start visualizing PR cycle time, review latency, and team health metrics."
        action={
          <button
            type="button"
            className="py-2 px-4 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Connect repositories
          </button>
        }
      />
    )
  }

  if (activeRepo.syncStatus === "error" && !isSyncing) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Last sync failed"
        description={`We couldn't pull the latest data for ${activeRepo.owner}/${activeRepo.name}. The GitHub API returned a rate limit error. Retry the sync to refresh metrics.`}
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

  if (activeRepo.syncStatus === "syncing" || isSyncing) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Panel key={m.label} className="p-6">
            <div className="space-y-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-6 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </Panel>
        ))}
        <div className="col-span-full flex items-center justify-center gap-2 py-10 text-sm text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Syncing {activeRepo.owner}/{activeRepo.name} from GitHub…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} metric={{ ...m, value: m.label === "Open PRs" ? String(openPrs) : m.value }} />
        ))}
      </div>

      <Panel className="p-6">
        <PanelHeader icon={BarChart3} title="Cycle Time Trend" />
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <LineChart data={cycleTimeSeries} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="cycleTime"
              type="monotone"
              stroke="var(--color-cycleTime)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey="reviewTime"
              type="monotone"
              stroke="var(--color-reviewTime)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </Panel>

      <AiInsights />
      <ContributorActivity />
    </div>
  )
}
