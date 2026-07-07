"use client"

import { useState } from "react"
import { Sparkles, RefreshCw, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel } from "./panel"
import { EmptyState } from "./empty-state"
import { useRepo } from "./repo-context"
import { digests as initialDigests, formatRelativeTime, type Digest } from "@/lib/veltro-data"

const typeConfig: Record<Digest["type"], { text: string; bg: string }> = {
  "Weekly Summary": { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  "Bottleneck Report": { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  "Velocity Report": { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
}

export default function AiDigests() {
  const { activeRepo } = useRepo()
  const [digests, setDigests] = useState<Digest[]>(initialDigests)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  function regenerate(id: string) {
    setRegenerating(id)
    setTimeout(() => {
      setDigests((prev) => prev.map((d) => (d.id === id ? { ...d, generatedAt: new Date().toISOString() } : d)))
      setRegenerating(null)
    }, 1600)
  }

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Plain-English engineering summaries generated from your sync history.
        </p>
        <button
          type="button"
          className="flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Now
        </button>
      </div>

      {digests.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No digests yet"
          description="Once your repository has enough activity, Veltro will generate weekly engineering digests here."
          action={
            <button
              type="button"
              className="py-2 px-4 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Generate first digest
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {digests.map((digest, index) => {
            const tc = typeConfig[digest.type]
            const isNewest = index === 0
            const isRegenerating = regenerating === digest.id
            return (
              <Panel key={digest.id} className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{digest.week}</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", tc.bg, tc.text)}>
                        {digest.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Generated {formatRelativeTime(digest.generatedAt)}
                    </p>
                  </div>
                  {isNewest && (
                    <button
                      type="button"
                      onClick={() => regenerate(digest.id)}
                      disabled={isRegenerating}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors disabled:opacity-60 flex-shrink-0"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin")} />
                      Regenerate
                    </button>
                  )}
                </div>
                {isRegenerating ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-full" />
                    <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-11/12" />
                    <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-3/4" />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 text-pretty">
                    {digest.summary}
                  </p>
                )}
              </Panel>
            )
          })}
        </div>
      )}
    </div>
  )
}
