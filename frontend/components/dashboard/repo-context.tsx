"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { repositories as initialRepos, type Repository } from "@/lib/veltro-data"

export type DateRange = "7d" | "30d" | "90d"

interface RepoContextValue {
  repositories: Repository[]
  activeRepo: Repository | null
  setActiveRepoId: (id: string) => void
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  lastSynced: string
  isSyncing: boolean
  triggerSync: () => void
}

const RepoContext = createContext<RepoContextValue | null>(null)

export function RepoProvider({ children }: { children: ReactNode }) {
  const [repositories, setRepositories] = useState<Repository[]>(initialRepos)
  const [activeRepoId, setActiveRepoId] = useState<string>(initialRepos[0]?.id ?? "")
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [lastSynced, setLastSynced] = useState<string>("2026-07-06T09:12:00Z")
  const [isSyncing, setIsSyncing] = useState(false)

  const activeRepo = repositories.find((r) => r.id === activeRepoId) ?? null

  const triggerSync = useCallback(() => {
    if (!activeRepoId) return
    setIsSyncing(true)
    setRepositories((prev) =>
      prev.map((r) => (r.id === activeRepoId ? { ...r, syncStatus: "syncing" } : r)),
    )
    setTimeout(() => {
      const now = new Date().toISOString()
      setIsSyncing(false)
      setLastSynced(now)
      setRepositories((prev) =>
        prev.map((r) => (r.id === activeRepoId ? { ...r, syncStatus: "synced", lastSynced: now } : r)),
      )
    }, 2200)
  }, [activeRepoId])

  return (
    <RepoContext.Provider
      value={{
        repositories,
        activeRepo,
        setActiveRepoId,
        dateRange,
        setDateRange,
        lastSynced,
        isSyncing,
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
