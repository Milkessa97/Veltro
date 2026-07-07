"use client"

import { CheckCircle2, AlertCircle, Loader2, RefreshCw, History, GitPullRequest, MessageSquare, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"
import { syncEvents, formatRelativeTime, type SyncEventStatus } from "@/lib/veltro-data"

const statusConfig: Record<
  SyncEventStatus,
  { icon: React.ComponentType<{ className?: string }>; text: string; bg: string; label: string }
> = {
  success: {
    icon: CheckCircle2,
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Success",
  },
  failed: {
    icon: AlertCircle,
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Failed",
  },
  running: {
    icon: Loader2,
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    label: "Running",
  },
}

export default function SyncHistory() {
  const { activeRepo, isSyncing, triggerSync } = useRepo()

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chronological record of GitHub sync events for {activeRepo.name}.
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

      {syncEvents.length === 0 ? (
        <EmptyState
          icon={History}
          title="No sync events yet"
          description="Run your first sync to import pull requests and reviews from GitHub."
          action={
            <button
              type="button"
              onClick={triggerSync}
              className="py-2 px-4 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Sync Now
            </button>
          }
        />
      ) : (
        <Panel className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
          {syncEvents.map((event) => {
            const sc = statusConfig[event.status]
            return (
              <div key={event.id} className="p-4 flex items-start gap-3">
                <div className={cn("p-2 rounded-lg flex-shrink-0", sc.bg)}>
                  <sc.icon className={cn("w-4 h-4", sc.text, event.status === "running" && "animate-spin")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", sc.text)}>{sc.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 capitalize">
                        {event.trigger}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>

                  {event.error ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">{event.error}</p>
                  ) : (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <GitPullRequest className="w-3.5 h-3.5" />
                        {event.prsImported} PRs
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {event.reviewsImported} reviews
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {event.durationSeconds}s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </Panel>
      )}
    </div>
  )
}
