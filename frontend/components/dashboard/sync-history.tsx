"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  History,
  Clock,
  Loader2,
  GitPullRequest,
  Star,
  GitCommit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"
import { getSyncLogs, type SyncLog } from "@/lib/api/repositories"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(started: string, completed: string | null): string {
  if (!completed) return "—"
  const ms = new Date(completed).getTime() - new Date(started).getTime()
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    badgeClass: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-200 dark:ring-emerald-800",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    iconClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    badgeClass: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 ring-red-200 dark:ring-red-800",
  },
  running: {
    label: "Running",
    icon: Loader2,
    iconClass: "text-blue-600 dark:text-blue-400 animate-spin",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    badgeClass: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 ring-blue-200 dark:ring-blue-800",
  },
} as const

const triggerLabel: Record<string, string> = {
  manual: "Manual",
  webhook: "Webhook",
  scheduled: "Scheduled",
}

// ─── Single Log Row ────────────────────────────────────────────────────────────

function LogRow({ log }: { log: SyncLog }) {
  const cfg = statusConfig[log.status as keyof typeof statusConfig] ?? statusConfig.completed
  const Icon = cfg.icon

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={cn("p-1.5 rounded-lg flex-shrink-0 mt-0.5", cfg.bgClass)}>
          <Icon className={cn("w-3.5 h-3.5", cfg.iconClass)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: status badge + trigger + time */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded ring-1", cfg.badgeClass)}>
              {cfg.label}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {triggerLabel[log.triggered_by] ?? log.triggered_by}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {formatDate(log.started_at)}
            </span>
          </div>

          {/* Counts row */}
          {log.status !== "failed" && (
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <GitPullRequest className="w-3 h-3 text-violet-500" />
                {log.prs_fetched} PRs
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <Star className="w-3 h-3 text-indigo-500" />
                {log.reviews_fetched} reviews
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <GitCommit className="w-3 h-3 text-zinc-500" />
                {log.commits_fetched} commits
              </span>
              <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
                {formatDuration(log.started_at, log.completed_at)}
              </span>
            </div>
          )}

          {/* Error message */}
          {log.status === "failed" && log.error_message && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">
              {log.error_message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SyncHistory() {
  const { activeRepo, isSyncing, triggerSync, error: syncError } = useRepo()
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeRepo) return
    let cancelled = false
    setLoading(true)
    setFetchError(null)
    getSyncLogs(activeRepo.id)
      .then((data) => { if (!cancelled) setLogs(data) })
      .catch(() => { if (!cancelled) setFetchError("Could not load sync history.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeRepo?.id, isSyncing]) // re-fetch after a sync completes

  if (!activeRepo) {
    return (
      <EmptyState
        icon={History}
        title="No repository selected"
        description="Select a repository from the sidebar to review its sync history."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sync history for{" "}
          <strong className="text-gray-800 dark:text-gray-200">{activeRepo.full_name}</strong>
        </p>
        <button
          type="button"
          onClick={triggerSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Sync error from context */}
      {syncError && (
        <Panel className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Last sync failed</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{syncError}</p>
            </div>
          </div>
        </Panel>
      )}

      {/* Log list */}
      {loading ? (
        <Panel className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-2.5 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </Panel>
      ) : fetchError ? (
        <EmptyState icon={AlertCircle} title="Failed to load" description={fetchError} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No sync history yet"
          description="Run your first sync to start tracking PR, review, and commit imports."
          action={
            <button
              type="button"
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              Sync Now
            </button>
          }
        />
      ) : (
        <Panel className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </Panel>
      )}
    </div>
  )
}
