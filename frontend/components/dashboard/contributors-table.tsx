"use client"

import { useState, useMemo, useEffect, Fragment } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown, Users2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Panel } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"
import { getContributorMetrics, type ContributorMetrics } from "@/lib/api/repositories"

type SortKey = "prs_opened" | "prs_reviewed" | "avg_cycle_time_hours"

type Bottleneck = "none" | "review" | "merge"

const columns: { key: SortKey; label: string }[] = [
  { key: "prs_opened", label: "PRs Opened" },
  { key: "prs_reviewed", label: "PRs Reviewed" },
  { key: "avg_cycle_time_hours", label: "Avg Cycle" },
]

const bottleneckConfig: Record<Bottleneck, { label: string; text: string; bg: string }> = {
  none: { label: "Healthy", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  review: { label: "Review bottleneck", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  merge: { label: "Merge bottleneck", text: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
}

/** Heuristic bottleneck detection from API data alone */
function detectBottleneck(c: ContributorMetrics): Bottleneck {
  // High cycle time and low review ratio → merge bottleneck
  if (c.avg_cycle_time_hours > 60 && c.prs_opened > 10) return "merge"
  // Opened far more than reviewed → review bottleneck (not pulling weight as reviewer)
  if (c.prs_opened > 0 && c.prs_reviewed / Math.max(c.prs_opened, 1) < 0.4 && c.prs_opened > 8) return "review"
  return "none"
}

function bottleneckSummary(c: ContributorMetrics, bn: Bottleneck): string {
  if (bn === "merge")
    return `${c.display_name} has an avg cycle time of ${c.avg_cycle_time_hours.toFixed(0)}h, suggesting PRs are sitting open for long periods before merging.`
  if (bn === "review")
    return `${c.display_name} opened ${c.prs_opened} PRs but reviewed only ${c.prs_reviewed}, which may indicate an unbalanced review load.`
  return `${c.display_name} maintains a healthy balance of authoring and reviewing. No blocking patterns detected this period.`
}

export default function ContributorsTable() {
  const { activeRepo, dateRangeDays } = useRepo()
  const [sortKey, setSortKey] = useState<SortKey>("prs_opened")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [contributors, setContributors] = useState<ContributorMetrics[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeRepo) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getContributorMetrics(activeRepo.id, dateRangeDays)
      .then((data) => { if (!cancelled) setContributors(data) })
      .catch(() => { if (!cancelled) setError("Failed to load contributor data.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeRepo?.id, dateRangeDays])

  const sorted = useMemo(() => {
    return [...contributors].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey]
      return sortDir === "asc" ? diff : -diff
    })
  }, [contributors, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  if (!activeRepo) {
    return (
      <EmptyState
        icon={Users2}
        title="No repository selected"
        description="Select a repository from the sidebar to view its contributor performance metrics."
      />
    )
  }

  if (loading) {
    return (
      <Panel className="overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-2 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </Panel>
    )
  }

  if (error) {
    return <EmptyState icon={Users2} title="Failed to load" description={error} />
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Users2}
        title="No contributor data"
        description="Sync the repository to import pull request and contributor data."
      />
    )
  }

  const maxActivity = Math.max(1, ...sorted.map((c) => c.prs_opened + c.prs_reviewed))

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ChevronsUpDown className="w-3 h-3 text-gray-400" />
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-gray-900 dark:text-gray-100" />
    ) : (
      <ChevronDown className="w-3 h-3 text-gray-900 dark:text-gray-100" />
    )
  }

  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#1F1F23]">
              <th className="font-medium px-4 py-3">Contributor</th>
              {columns.map((col) => (
                <th key={col.key} className="font-medium px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ml-auto"
                  >
                    {col.label}
                    <SortIcon column={col.key} />
                  </button>
                </th>
              ))}
              <th className="font-medium px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const bn = detectBottleneck(c)
              const bnConf = bottleneckConfig[bn]
              const isExpanded = expanded === c.id
              const isDismissed = dismissed.includes(c.id)
              const activity = c.prs_opened + c.prs_reviewed
              return (
                <Fragment key={c.id}>
                  <tr
                    className={cn(
                      "border-b border-gray-100 dark:border-[#1F1F23] transition-colors",
                      bn !== "none" && !isDismissed && "cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50",
                    )}
                    onClick={() => {
                      if (bn !== "none" && !isDismissed) setExpanded(isExpanded ? null : c.id)
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={c.avatar_url || "/placeholder.svg"}
                          alt={c.display_name}
                          width={32}
                          height={32}
                          className="rounded-full"
                          unoptimized
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.display_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">@{c.username}</span>
                            <span className="h-1 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <span
                                className="block h-full bg-zinc-900 dark:bg-zinc-100"
                                style={{ width: `${(activity / maxActivity) * 100}%` }}
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{c.prs_opened}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{c.prs_reviewed}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {c.avg_cycle_time_hours > 0 ? `${c.avg_cycle_time_hours.toFixed(1)}h` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-[11px] font-medium whitespace-nowrap",
                          bnConf.bg,
                          bnConf.text,
                        )}
                      >
                        {bnConf.label}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && !isDismissed && (
                    <tr className="bg-gray-50 dark:bg-[#1F1F23]/30">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                              {bottleneckSummary(c, bn)}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDismissed((prev) => [...prev, c.id])
                                  setExpanded(null)
                                }}
                                className="py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
