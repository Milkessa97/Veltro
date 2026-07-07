"use client"

import { useState, useMemo, Fragment } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown, Sparkles, Users2, ArrowRight } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Panel } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"
import { contributors as allContributors, type Contributor } from "@/lib/veltro-data"

type SortKey = "prsOpened" | "prsReviewed" | "avgCycleTimeHours" | "avgReviewTimeHours" | "pendingReviews"

const columns: { key: SortKey; label: string }[] = [
  { key: "prsOpened", label: "PRs Opened" },
  { key: "prsReviewed", label: "PRs Reviewed" },
  { key: "avgCycleTimeHours", label: "Avg Cycle" },
  { key: "avgReviewTimeHours", label: "Avg Review" },
  { key: "pendingReviews", label: "Pending" },
]

const bottleneckConfig: Record<Contributor["bottleneck"], { label: string; text: string; bg: string }> = {
  none: { label: "Healthy", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  review: { label: "Review bottleneck", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  merge: { label: "Merge bottleneck", text: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
}

export default function ContributorsTable() {
  const { activeRepo } = useRepo()
  const [sortKey, setSortKey] = useState<SortKey>("prsOpened")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])

  const sorted = useMemo(() => {
    return [...allContributors].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey]
      return sortDir === "asc" ? diff : -diff
    })
  }, [sortKey, sortDir])

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

  const maxActivity = Math.max(...sorted.map((c) => c.activity))

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
        <table className="w-full text-left min-w-[720px]">
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
              const bn = bottleneckConfig[c.bottleneck]
              const isExpanded = expanded === c.id
              const isDismissed = dismissed.includes(c.id)
              return (
                <Fragment key={c.id}>
                  <tr
                    className={cn(
                      "border-b border-gray-100 dark:border-[#1F1F23] transition-colors",
                      c.bottleneck !== "none" && !isDismissed && "cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50",
                    )}
                    onClick={() => {
                      if (c.bottleneck !== "none" && !isDismissed) setExpanded(isExpanded ? null : c.id)
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={c.avatar || "/placeholder.svg"}
                          alt={c.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">@{c.username}</span>
                            <span className="h-1 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <span
                                className="block h-full bg-zinc-900 dark:bg-zinc-100"
                                style={{ width: `${(c.activity / maxActivity) * 100}%` }}
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{c.prsOpened}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{c.prsReviewed}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {c.avgCycleTimeHours}h
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {c.avgReviewTimeHours}h
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {c.pendingReviews}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-[11px] font-medium whitespace-nowrap",
                          bn.bg,
                          bn.text,
                        )}
                      >
                        {bn.label}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && !isDismissed && (
                    <tr className="bg-gray-50 dark:bg-[#1F1F23]/30">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 text-pretty">
                              {c.bottleneckSummary}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                type="button"
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                              >
                                View PRs
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
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
