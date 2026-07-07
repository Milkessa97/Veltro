"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { RepoMetrics } from "./dashboard-data"
import { SparkIcon, ChevronDownIcon, AlertIcon } from "./icons"

const severityStyles = {
  high: "text-primary bg-primary/15",
  medium: "text-foreground bg-foreground/10",
  low: "text-muted-foreground bg-foreground/5",
} as const

const severityLabel = { high: "High impact", medium: "Medium", low: "Low" } as const

export function AiInsights({ insights }: { insights: RepoMetrics["insights"] }) {
  const [openIndex, setOpenIndex] = useState<number>(0)

  return (
    <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <SparkIcon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI insights</h3>
          <p className="text-xs text-muted-foreground">Generated from this repo&apos;s recent activity</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {insights.map((insight, i) => {
          const open = openIndex === i
          return (
            <div key={insight.title} className="overflow-hidden rounded-xl border border-border bg-background/40">
              <button
                onClick={() => setOpenIndex(open ? -1 : i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                    severityStyles[insight.severity],
                  )}
                >
                  <AlertIcon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{insight.title}</span>
                <span className="hidden sm:inline text-[11px] font-medium text-muted-foreground">
                  {severityLabel[insight.severity]}
                </span>
                <ChevronDownIcon
                  className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
