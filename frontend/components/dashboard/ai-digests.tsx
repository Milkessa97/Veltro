"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sparkles,
  RefreshCw,
  Clock,
  Zap,
  History,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel, PanelHeader } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"
import {
  getWeeklyDigest,
  regenerateDigest,
  getDigestHistory,
  type DigestResponse,
} from "@/lib/api/digest"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatPeriod(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  const e = new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  return `${s} – ${e}`
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function DigestSkeleton() {
  return (
    <Panel className="p-6">
      <div className="space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="space-y-2 pt-2">
          <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-full" />
          <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-11/12" />
          <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-4/5" />
          <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-3/4" />
        </div>
      </div>
    </Panel>
  )
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const isKeyRequired =
    message.toLowerCase().includes("api key") || message.toLowerCase().includes("402")

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20">
      {isKeyRequired ? (
        <KeyRound className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-700 dark:text-red-400">
          {isKeyRequired ? "Gemini API Key Required" : "Something went wrong"}
        </p>
        <p className="text-xs text-red-600 dark:text-red-500 mt-0.5 leading-relaxed">
          {isKeyRequired
            ? "Add your Gemini API key in Settings → Gemini API Key to enable AI digests."
            : message}
        </p>
      </div>
      {onRetry && !isKeyRequired && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  )
}

// ─── Digest Card ─────────────────────────────────────────────────────────────

function DigestCard({
  digest,
  isLatest,
  onRegenerate,
  isRegenerating,
}: {
  digest: DigestResponse
  isLatest: boolean
  onRegenerate: () => void
  isRegenerating: boolean
}) {
  const [expanded, setExpanded] = useState(isLatest)

  return (
    <Panel className="overflow-hidden">
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 p-5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatPeriod(digest.period_start, digest.period_end)}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-2.5 h-2.5" />
              Weekly Summary
            </span>
            {digest.is_stale && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                Stale
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Generated {formatRelativeTime(digest.generated_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isLatest && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRegenerate()
              }}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin")} />
              {isRegenerating ? "Regenerating…" : "Regenerate"}
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-[#1F1F23]">
          {isRegenerating ? (
            <div className="space-y-2 animate-pulse pt-4">
              <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-full" />
              <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-11/12" />
              <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-3/4" />
            </div>
          ) : (
            <div className="pt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {digest.content}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AiDigests() {
  const { activeRepo } = useRepo()

  const [latestDigest, setLatestDigest] = useState<DigestResponse | null>(null)
  const [history, setHistory] = useState<DigestResponse[]>([])
  const [isLoadingLatest, setIsLoadingLatest] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const repoId = activeRepo?.id ?? null

  const loadLatest = useCallback(async () => {
    if (!repoId) return
    setIsLoadingLatest(true)
    setError(null)
    try {
      const digest = await getWeeklyDigest(repoId)
      setLatestDigest(digest)
    } catch (err: any) {
      setError(err.message || "Failed to load digest.")
    } finally {
      setIsLoadingLatest(false)
    }
  }, [repoId])

  const loadHistory = useCallback(async () => {
    if (!repoId) return
    setIsLoadingHistory(true)
    try {
      const items = await getDigestHistory(repoId)
      // Exclude the current latest so history only shows older ones
      setHistory(items.filter((d) => d.id !== latestDigest?.id))
    } catch {
      // history failing is non-blocking
    } finally {
      setIsLoadingHistory(false)
    }
  }, [repoId, latestDigest?.id])

  const handleRegenerate = async () => {
    if (!repoId) return
    setIsRegenerating(true)
    setError(null)
    try {
      const fresh = await regenerateDigest(repoId)
      setLatestDigest(fresh)
    } catch (err: any) {
      setError(err.message || "Regeneration failed.")
    } finally {
      setIsRegenerating(false)
    }
  }

  // Load latest digest on repo change
  useEffect(() => {
    setLatestDigest(null)
    setHistory([])
    setShowHistory(false)
    setError(null)
    if (repoId) loadLatest()
  }, [repoId, loadLatest])

  // Load history when user toggles it
  useEffect(() => {
    if (showHistory && history.length === 0) {
      loadHistory()
    }
  }, [showHistory, history.length, loadHistory])

  if (!activeRepo) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No repository selected"
        description="Select a repository from the sidebar to view its AI-generated engineering digests."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Plain-English engineering summaries powered by Gemini AI.
        </p>
        <button
          type="button"
          onClick={() => loadLatest()}
          disabled={isLoadingLatest || isRegenerating}
          className="flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-60 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Generate Now
        </button>
      </div>

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={loadLatest} />}

      {/* Latest digest */}
      {isLoadingLatest ? (
        <DigestSkeleton />
      ) : latestDigest ? (
        <DigestCard
          digest={latestDigest}
          isLatest
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
        />
      ) : !error ? (
        <EmptyState
          icon={Sparkles}
          title="No digest yet"
          description="Once your repository has been synced, click Generate Now to create your first weekly engineering digest."
          action={
            <button
              type="button"
              onClick={loadLatest}
              className="py-2 px-4 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Generate first digest
            </button>
          }
        />
      ) : null}

      {/* History toggle */}
      {latestDigest && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            {showHistory ? "Hide history" : "View digest history"}
            {showHistory ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showHistory && (
            <div className="space-y-3 mt-4">
              {isLoadingHistory ? (
                <>
                  <DigestSkeleton />
                  <DigestSkeleton />
                </>
              ) : history.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">
                  No previous digests found.
                </p>
              ) : (
                history.map((d) => (
                  <DigestCard
                    key={d.id}
                    digest={d}
                    isLatest={false}
                    onRegenerate={() => {}}
                    isRegenerating={false}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
