"use client"

import {
  LayoutDashboard,
  GitPullRequest,
  Users2,
  Sparkles,
  History,
  Settings,
  LogOut,
  Menu,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useRepo } from "@/components/dashboard/repo-context"
import type { Repository } from "@/lib/api/repositories"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/pr-timeline", icon: GitPullRequest, label: "PR Timeline" },
  { href: "/dashboard/contributors", icon: Users2, label: "Contributors" },
  { href: "/dashboard/ai-digests", icon: Sparkles, label: "AI Digests" },
  { href: "/dashboard/sync-history", icon: History, label: "Sync History" },
]

function SyncIndicator({ isSynced, isSyncing }: { isSynced: boolean; isSyncing: boolean }) {
  if (isSyncing) return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
  if (isSynced) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
  return <Activity className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
}

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { repositories, activeRepo, setActiveRepoId } = useRepo()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed")
      if (saved !== null) {
        setIsCollapsed(saved === "true")
      }
    }
  }, [])

  function toggleCollapse() {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  function handleNavigation() {
    setIsMobileMenuOpen(false)
  }

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: any
    children: React.ReactNode
  }) {
    const isActive = pathname === href
    const labelString = typeof children === "string" ? children : ""
    return (
      <Link
        href={href}
        onClick={handleNavigation}
        className={cn(
          "flex items-center py-2 text-sm rounded-md transition-colors",
          isCollapsed ? "justify-center px-2" : "px-3",
          isActive
            ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-[#1F1F23]"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]",
        )}
        title={isCollapsed ? labelString : undefined}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0", isCollapsed ? "mr-0" : "mr-3")} />
        {!isCollapsed && <span className="truncate">{children}</span>}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white dark:bg-[#0F0F12] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-[70] bg-white dark:bg-[#0F0F12] transform transition-all duration-300 ease-in-out",
          "lg:translate-x-0 lg:static border-r border-gray-200 dark:border-[#1F1F23]",
          isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-64 lg:w-16" : "w-64 lg:w-64",
        )}
      >
        <div className="h-full flex flex-col">
          <div
            className={cn(
              "h-16 px-4 flex items-center border-b border-gray-200 dark:border-[#1F1F23]",
              isCollapsed ? "justify-center" : "justify-between",
            )}
          >
            {!isCollapsed ? (
              <Link href="/dashboard" className="flex items-center gap-3">
                <img src="/veltro-logo-dark-bg.svg" alt="Company Logo" width="70" height="70" />
              </Link>
            ) : (
              <Link href="/dashboard" className="flex items-center justify-center">
                <img src="/veltro-v-mark.svg" alt="Logo Mark" width="28" height="28" />
              </Link>
            )}

            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] text-gray-500 dark:text-gray-400 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <div className={cn("flex-1 overflow-y-auto py-4", isCollapsed ? "px-2" : "px-4")}>
            <div className="space-y-6">
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Insights
                  </div>
                )}
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <NavItem key={item.href} href={item.href} icon={item.icon}>
                      {item.label}
                    </NavItem>
                  ))}
                </div>
              </div>

              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Repositories
                  </div>
                )}
                <div className="space-y-1">
                  {repositories.map((repo) => {
                    const isActive = activeRepo?.id === repo.id
                    return (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => {
                          setActiveRepoId(repo.id)
                          handleNavigation()
                        }}
                        className={cn(
                          "w-full flex items-center py-2 text-sm rounded-md transition-colors text-left",
                          isCollapsed ? "justify-center px-2" : "px-3 gap-2",
                          isActive
                            ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-[#1F1F23]"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]",
                        )}
                        title={isCollapsed ? repo.name : undefined}
                      >
                        {repo.is_private ? (
                          <Lock className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        )}
                        {!isCollapsed && (
                          <>
                            <span className="truncate flex-1">{repo.name}</span>
                            <SyncIndicator isSynced={repo.is_synced} isSyncing={activeRepo?.id === repo.id} />
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={cn("py-4 border-t border-gray-200 dark:border-[#1F1F23]", isCollapsed ? "px-2" : "px-4")}>
            <div className="space-y-1">
              <NavItem href="#" icon={Settings}>
                Settings
              </NavItem>
              <NavItem href="#" icon={LogOut}>
                Logout
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
