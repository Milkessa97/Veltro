"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { getRepositories, syncRepo, type Repository } from "@/lib/api/repositories"
import { getPreferences, updatePreferences } from "@/lib/api/preferences"
import { toast } from "@/hooks/use-toast"

export type DateRange = "7d" | "30d" | "90d"

const DATE_RANGE_DAYS: Record<DateRange, number> = { "7d": 7, "30d": 30, "90d": 90 }

interface RepoContextValue {
  repositories: Repository[]
  activeRepo: Repository | null
  setActiveRepoId: (id: string) => void
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  dateRangeDays: number
  /** ISO timestamp of the active repo's last sync, or null */
  lastSynced: string | null
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  triggerSync: () => void
}

const RepoContext = createContext<RepoContextValue | null>(null)

export function RepoProvider({ children }: { children: ReactNode }) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [activeRepoId, setActiveRepoIdState] = useState<string | null>(null)
  const [dateRange, setDateRangeState] = useState<DateRange>("30d")
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bootstrap: fetch repos + preferences in parallel
  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        const [repos, prefs] = await Promise.all([getRepositories(), getPreferences()])
        if (cancelled) return
        setRepositories(repos)

        // Restore saved default_repository_id; fall back to first repo
        const savedId = prefs.default_repository_id
        const initialId =
          savedId && repos.some((r) => r.id === savedId)
            ? savedId
            : repos[0]?.id ?? null
        setActiveRepoIdState(initialId)

        // Restore saved date range preference
        const savedDays = prefs.default_date_range_days
        const dr: DateRange =
          savedDays === 7 ? "7d" : savedDays === 90 ? "90d" : "30d"
        setDateRangeState(dr)
      } catch (err) {
        if (!cancelled) setError("Failed to load repositories. Please refresh.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    bootstrap()
    return () => { cancelled = true }
  }, [])

  const activeRepo = repositories.find((r) => r.id === activeRepoId) ?? null

  // Auto-poll repositories if the active repository is not synced yet (initial signup/sync background tasks).
  // Caps at MAX_POLL_ATTEMPTS to prevent hammering the backend indefinitely when a sync stalls.
  const MAX_POLL_ATTEMPTS = 20
  useEffect(() => {
    if (!activeRepo || activeRepo.is_synced) return

    // Capture the ID at effect-creation time so the async poll closure
    // always has a stable non-null string reference, even if activeRepo
    // changes to null between poll ticks.
    const repoId = activeRepo.id

    let intervalId: NodeJS.Timeout
    let cancelled = false
    let attempts = 0

    async function poll() {
      attempts++
      if (attempts > MAX_POLL_ATTEMPTS) {
        clearInterval(intervalId)
        return
      }
      try {
        const repos = await getRepositories()
        if (cancelled) return
        setRepositories(repos)
        // Stop polling as soon as the active repo flips to synced
        const updatedActive = repos.find((r) => r.id === repoId)
        if (updatedActive?.is_synced) {
          clearInterval(intervalId)
        }
      } catch (err) {
        console.error("Failed to poll repository status:", err)
      }
    }

    intervalId = setInterval(poll, 5000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [activeRepo?.id, activeRepo?.is_synced])

  const setActiveRepoId = useCallback(
    (id: string) => {
      setActiveRepoIdState(id)
      // Persist silently; don't block the UI
      updatePreferences({ default_repository_id: id }).catch(() => {})
    },
    []
  )

  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range)
    updatePreferences({ default_date_range_days: DATE_RANGE_DAYS[range] }).catch(() => {})
  }, [])

  const triggerSync = useCallback(async () => {
    if (!activeRepoId || isSyncing) return
    setIsSyncing(true)
    setError(null)
    try {
      const updated = await syncRepo(activeRepoId)
      setRepositories((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      )
      toast({
        title: "Sync Completed",
        description: `Successfully updated metrics for ${updated.full_name}.`,
      })
    } catch (err: any) {
      const detail = err.detail
      const errorMessage = err.message || "Sync failed. Please try again."
      setError(errorMessage)
      
      if (detail && detail.error === "rate_limit_exceeded") {
        toast({
          title: "Repo Cooldown Active",
          description: detail.message,
          variant: "destructive",
        })
      } else if (detail && detail.error === "user_rate_limit_exceeded") {
        toast({
          title: "Sync Rate Limit",
          description: detail.message,
          variant: "destructive",
        })
      } else if (
        detail &&
        (detail.error === "sync_in_progress" || detail.error === "user_sync_concurrency_limit")
      ) {
        toast({
          title: "Sync Already Active",
          description: detail.message,
        })
      } else {
        toast({
          title: "Sync Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsSyncing(false)
    }
  }, [activeRepoId, isSyncing])

  return (
    <RepoContext.Provider
      value={{
        repositories,
        activeRepo,
        setActiveRepoId,
        dateRange,
        setDateRange,
        dateRangeDays: DATE_RANGE_DAYS[dateRange],
        lastSynced: activeRepo?.synced_at ?? null,
        isLoading,
        isSyncing,
        error,
        triggerSync,
      }}
    >
      {children}
    </RepoContext.Provider>
  )
}

export function useRepo() {
  const ctx = useContext(RepoContext)
  if (!ctx) throw new Error("useRepo must be used within RepoProvider")
  return ctx
}
