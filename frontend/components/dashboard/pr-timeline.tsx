"use client"

import { useState, useMemo } from "react"
import { Search, GitPullRequest } from "lucide-react"
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
import { pullRequests, prStateConfig, contributors, type PrState } from "@/lib/veltro-data"

const segments: { key: "waitingHours" | "reviewHours" | "readyHours"; label: string; color: string }[] = [
  { key: "waitingHours", label: "Waiting for review", color: "bg-violet-300 dark:bg-violet-900/60" },
  { key: "reviewHours", label: "In review", color: "bg-violet-500" },
  { key: "readyHours", label: "Ready to merge", color: "bg-indigo-600" },
]

const statusOptions: { value: PrState | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "waiting", label: "Waiting for review" },
  { value: "in-review", label: "In review" },
  { value: "ready", label: "Ready to merge" },
  { value: "merged", label: "Merged" },
]

export default function PrTimeline() {
  const { activeRepo } = useRepo()
  const [search, setSearch] = useState("")
  const [author, setAuthor] = useState("all")
  const [status, setStatus] = useState<PrState | "all">("all")

  const filtered = useMemo(() => {
    return pullRequests.filter((pr) => {
      const matchesSearch =
        search === "" ||
        pr.title.toLowerCase().includes(search.toLowerCase()) ||
        String(pr.number).includes(search)
      const matchesAuthor = author === "all" || pr.author.id === author
      const matchesStatus = status === "all" || pr.state === status
      return matchesSearch && matchesAuthor && matchesStatus
    })
  }, [search, author, status])

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
          <select value={author} onChange={(e) => setAuthor(e.target.value)} className={selectClass}>
            <option value="all">All authors</option>
            {contributors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PrState | "all")}
            className={selectClass}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
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

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No pull requests found"
          description="Try adjusting your search terms or filters to find what you're looking for."
        />
      ) : (
        <Panel className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
          {filtered.map((pr) => {
            const config = prStateConfig[pr.state]
            const total = pr.waitingHours + pr.reviewHours + pr.readyHours || 1
            return (
              <div key={pr.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">#{pr.number}</span>
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
                        src={pr.author.avatar || "/placeholder.svg"}
                        alt={pr.author.name}
                        width={18}
                        height={18}
                        className="rounded-full"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{pr.author.username}</span>
                    </div>
                  </div>

                  {/* Reviewer avatars */}
                  <div className="flex items-center -space-x-2 flex-shrink-0">
                    <TooltipProvider>
                      {pr.reviewers.map((r) => (
                        <Tooltip key={r.id}>
                          <TooltipTrigger asChild>
                            <Image
                              src={r.avatar || "/placeholder.svg"}
                              alt={r.name}
                              width={24}
                              height={24}
                              className="rounded-full ring-2 ring-white dark:ring-[#0F0F12]"
                            />
                          </TooltipTrigger>
                          <TooltipContent>Reviewer: {r.name}</TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>

                {/* Timeline segments */}
                <TooltipProvider>
                  <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {segments.map((s) => {
                      const value = pr[s.key]
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
                            {s.label}: {value}h
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
