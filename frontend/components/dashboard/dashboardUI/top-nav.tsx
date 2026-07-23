"use client"

import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { ChevronRight, RefreshCw } from "lucide-react"
import { usePathname } from "next/navigation"
import Profile01 from "./profile-01"
import { getCurrentUser, type UserInfo } from "@/lib/api/auth"
import { ThemeToggle } from "../theme-toggle"
import { cn } from "@/lib/utils"
import { useRepo, type DateRange } from "@/components/dashboard/repo-context"
import { formatRelativeTime } from "@/lib/veltro-data"

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/pr-timeline": "PR Timeline",
  "/dashboard/contributors": "Contributors",
  "/dashboard/ai-digests": "AI Digests",
  "/dashboard/sync-history": "Sync History",
}

const ranges: DateRange[] = ["7d", "30d", "90d"]

export default function TopNav() {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? "Overview"
  const { activeRepo, dateRange, setDateRange, lastSynced, isSyncing, triggerSync } = useRepo()

  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await getCurrentUser()
        setUser(data)
      } catch (err) {
        console.error(err)
      }
    }
    loadUser()
  }, [])

  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between bg-white dark:bg-[#0F0F12] border-b border-gray-200 dark:border-[#1F1F23] h-full gap-3">
      <div className="font-medium text-sm hidden sm:flex items-center space-x-1 truncate min-w-0">
        {activeRepo && (
          <>
            <span className="text-gray-700 dark:text-gray-300">
              {activeRepo.owner}/{activeRepo.name}
            </span>
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 mx-1" />
          </>
        )}
        <span className="text-gray-900 dark:text-gray-100">{title}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
        {/* Date range selector */}
        <div className="hidden sm:flex items-center rounded-lg border border-gray-200 dark:border-[#1F1F23] p-0.5">
          {ranges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                dateRange === range
                  ? "bg-gray-100 dark:bg-[#1F1F23] text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              )}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Last synced */}
        {lastSynced && (
          <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Synced {formatRelativeTime(lastSynced)}
          </span>
        )}

        {/* Sync Now */}
        <button
          type="button"
          onClick={triggerSync}
          disabled={isSyncing}
          className={cn(
            "flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-200",
            "bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900",
            "hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm hover:shadow",
            "disabled:opacity-60",
          )}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Now"}</span>
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.display_name}
                width={32}
                height={32}
                className="rounded-full ring-2 ring-gray-200 dark:ring-[#2B2B30] cursor-pointer w-8 h-8 object-cover"
                unoptimized
              />
            ) : (
              <div className="rounded-full w-8 h-8 bg-zinc-200 dark:bg-zinc-800 animate-pulse ring-2 ring-gray-200 dark:ring-[#2B2B30]" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] sm:w-80 bg-background border-border rounded-lg shadow-lg"
          >
            <Profile01
              name={user?.display_name || "GitHub User"}
              role={`@${user?.github_login || "username"}`}
              avatar={user?.avatar_url || "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-02-albo9B0tWOSLXCVZh9rX9KFxXIVWMr.png"}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
