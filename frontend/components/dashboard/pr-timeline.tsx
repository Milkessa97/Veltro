"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, GitPullRequest, RefreshCw } from "lucide-react"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Panel } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"
import { getPullRequests, type PullRequestDetail } from "@/lib/api/repositories"

// ─── Display config ───────────────────────────────────────────────────────────

type DisplayState = "open" | "closed" | "merged"

const stateConfig: Record<DisplayState, { label: string; dot: string; text: string; bg: string }> = {
  open: {
    label: "Open",
    dot: "bg-violet-400 dark:bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-950/40",
  },
  closed: {
    label: "Closed",
    dot: "bg-red-400 dark:bg-red-500",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950/40",
  },
  merged: {
    label: "Merged",
    dot: "bg-zinc-500",
    text: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
  },
}

const segments: { key: "waitingHours" | "reviewHours" | "mergeHours"; label: string; color: string }[] = [
  { key: "waitingHours", label: "Waiting for review", color: "bg-violet-300 dark:bg-violet-900/60" },
  { key: "reviewHours", label: "In review", color: "bg-violet-500" },
  { key: "mergeHours", label: "Ready / merge", color: "bg-indigo-600" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoursBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000)
}

function deriveSegments(pr: PullRequestDetail) {
  const waitingHours = hoursBetween(pr.opened_at, pr.first_review_at)
  const reviewEnd = pr.merged_at ?? pr.closed_at
  const reviewHours = hoursBetween(pr.first_review_at, reviewEnd)
  const mergeHours = pr.merged_at ? hoursBetween(pr.first_review_at ?? pr.opened_at, pr.merged_at) - reviewHours : 0
  return { waitingHours, reviewHours, mergeHours: Math.max(0, mergeHours) }
}

// ─── Component ────────────────────────────────────────────────────────────────

const STATE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "merged", label: "Merged" },
]

export default function PrTimeline() {
  const { activeRepo, dateRangeDays } = useRepo()
  const [search, setSearch] = useState("")
  const [authorFilter, setAuthorFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pullRequests, setPullRequests] = useState<PullRequestDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeRepo) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getPullRequests(activeRepo.id, dateRangeDays)
      .then((data) => { if (!cancelled) setPullRequests(data) })
      .catch(() => { if (!cancelled) setError("Failed to load pull requests.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeRepo?.id, dateRangeDays])

  // Unique authors for the filter dropdown
  const authors = useMemo(() => {
    const seen = new Map<string, string>()
    pullRequests.forEach((pr) => seen.set(pr.author.id, pr.author.display_name))
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [pullRequests])

  const filtered = useMemo(() => {
    return pullRequests.filter((pr) => {
      const matchSearch =
        search === "" ||
        pr.title.toLowerCase().includes(search.toLowerCase()) ||
        String(pr.github_pr_number).includes(search)
      const matchAuthor = authorFilter === "all" || pr.author.id === authorFilter
      const matchStatus = statusFilter === "all" || pr.state === statusFilter
      return matchSearch && matchAuthor && matchStatus
    })
  }, [pullRequests, search, authorFilter, statusFilter])

  if (!activeRepo) {
    return (
      <EmptyState
        icon={GitPullRequest}
        title="No repository selected"
        description="Select a repository from the sidebar to view its pull request timeline."
      />
    )
  }

  const selectClass =
    "text-sm rounded-lg border border-gray-200 dark:border-[#1F1F23] bg-white dark:bg-[#0F0F12] text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Panel className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or number..."
              className={cn(selectClass, "w-full pl-9")}
            />
          </div>
          <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className={selectClass}>
            <option value="all">All authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            {STATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </Panel>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-sm", s.color)} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <Panel className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse space-y-3">
              <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </Panel>
      ) : error ? (
        <EmptyState icon={GitPullRequest} title="Failed to load" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No pull requests found"
          description="Try adjusting your search terms or filters."
        />
      ) : (
        <Panel className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
          {filtered.map((pr) => {
            const state = pr.state as DisplayState
            const config = stateConfig[state] ?? stateConfig.open
            const { waitingHours, reviewHours, mergeHours } = deriveSegments(pr)
            const total = waitingHours + reviewHours + mergeHours || 1
            const segValues = { waitingHours, reviewHours, mergeHours }

            return (
              <div key={pr.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        #{pr.github_pr_number}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1",
                          config.bg,
                          config.text,
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                        {config.label}
                      </span>
                      {pr.labels.map((l) => (
                        <span
                          key={l.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ background: `#${l.color}22`, color: `#${l.color}` }}
                        >
                          {l.name}
                        </span>
                      ))}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate max-w-md cursor-default">
                            {pr.title}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent>{pr.title}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Image
                        src={pr.author.avatar_url || "/placeholder.svg"}
                        alt={pr.author.display_name}
                        width={18}
                        height={18}
                        className="rounded-full"
                        unoptimized
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">@{pr.author.github_login}</span>
                    </div>
                  </div>

                  {/* Reviewer avatars */}
                  <div className="flex items-center -space-x-2 flex-shrink-0">
                    <TooltipProvider>
                      {pr.reviewers.map((r) => (
                        <Tooltip key={r.id}>
                          <TooltipTrigger asChild>
                            <Image
                              src={r.avatar_url || "/placeholder.svg"}
                              alt={r.display_name}
                              width={24}
                              height={24}
                              className="rounded-full ring-2 ring-white dark:ring-[#0F0F12]"
                              unoptimized
                            />
                          </TooltipTrigger>
                          <TooltipContent>Reviewer: {r.display_name}</TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>

                {/* Timeline bar */}
                <TooltipProvider>
                  <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {segments.map((s) => {
                      const value = segValues[s.key]
                      if (value <= 0) return null
                      return (
                        <Tooltip key={s.key}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(s.color, "h-full cursor-default")}
                              style={{ width: `${(value / total) * 100}%` }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {s.label}: {value.toFixed(1)}h
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </TooltipProvider>
              </div>
            )
          })}
        </Panel>
      )}
    </div>
  )
}
