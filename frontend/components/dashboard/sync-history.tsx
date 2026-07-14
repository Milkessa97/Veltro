"use client"

import { CheckCircle2, AlertCircle, RefreshCw, History, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"

function formatDate(iso: string | null): string {
  if (!iso) return "Never"
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function SyncHistory() {
  const { activeRepo, isSyncing, triggerSync, lastSynced, error } = useRepo()

  if (!activeRepo) {
    return (
      <EmptyState
        icon={History}
        title="No repository selected"
        description="Select a repository from the sidebar to review its sync status."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sync status for <strong className="text-gray-800 dark:text-gray-200">{activeRepo.full_name}</strong>
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

      {error && (
        <Panel className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Last sync failed</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{error}</p>
            </div>
          </div>
        </Panel>
      )}

      <Panel className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
        {/* Sync status row */}
        <div className="p-4 flex items-start gap-3">
          <div
            className={cn(
              "p-2 rounded-lg flex-shrink-0",
              isSyncing
                ? "bg-blue-100 dark:bg-blue-900/30"
                : activeRepo.is_synced
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-zinc-100 dark:bg-zinc-800",
            )}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
            ) : activeRepo.is_synced ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <History className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  isSyncing
                    ? "text-blue-600 dark:text-blue-400"
                    : activeRepo.is_synced
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-500 dark:text-gray-400",
                )}
              >
                {isSyncing ? "Syncing…" : activeRepo.is_synced ? "Synced" : "Not yet synced"}
              </span>
              {lastSynced && (
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(lastSynced)}
                </span>
              )}
            </div>
            {!isSyncing && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {activeRepo.is_synced
                  ? "Pull requests, contributors, and review data are up to date."
                  : "Run your first sync to import pull requests and reviews from GitHub."}
              </p>
            )}
          </div>
        </div>

        {/* Repository info row */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-0.5">
              Repository
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{activeRepo.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-0.5">
              Visibility
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {activeRepo.is_private ? "Private" : "Public"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-0.5">
              Added
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(activeRepo.created_at)}</p>
          </div>
        </div>
      </Panel>
    </div>
  )
}


