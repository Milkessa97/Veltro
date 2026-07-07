"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { repos, type Repo } from "./dashboard-data"
import { RepoIcon, BranchIcon, SearchIcon, CheckIcon, ChevronDownIcon } from "./icons"

export function RepoPicker({
  selected,
  onSelect,
}: {
  selected: Repo
  onSelect: (repo: Repo) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const filtered = repos.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-primary/40"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <RepoIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {selected.org}/{selected.name}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BranchIcon className="h-3 w-3" />
            {selected.branch}
          </span>
        </span>
        <ChevronDownIcon className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-[320px] max-w-[90vw] overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-fade-in-up">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No repositories found</li>
            )}
            {filtered.map((repo) => {
              const active = repo.id === selected.id
              return (
                <li key={repo.id}>
                  <button
                    onClick={() => {
                      onSelect(repo)
                      setOpen(false)
                      setQuery("")
                    }}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-foreground/5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-muted-foreground group-hover:text-foreground">
                      <RepoIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">
                        {repo.org}/{repo.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BranchIcon className="h-3 w-3" />
                        {repo.branch}
                      </span>
                    </span>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
