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
    } catch (err) {
      setError("Sync failed. Please try again.")
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
