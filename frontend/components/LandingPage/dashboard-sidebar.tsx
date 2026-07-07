"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DashboardIcon, SettingsIcon, MenuIcon, CloseIcon, GithubIcon } from "./icons"
import { logoutAction } from "@/app/actions/auth"

const nav = [
  { name: "Overview", href: "/dashboard", Icon: DashboardIcon },
  { name: "Preferences", href: "/dashboard/settings", Icon: SettingsIcon },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarBody = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <Link href="/" className={cn("flex items-center gap-2", collapsed && "md:justify-center md:w-full")}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            D
          </span>
          {!collapsed && <span className="text-foreground text-lg font-semibold">DevPulse</span>}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground"
          aria-label="Close menu"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map(({ name, href, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={name}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                collapsed && "md:justify-center",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
              {!collapsed && <span>{name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <div className={cn("rounded-lg border border-border bg-card p-3", collapsed && "md:hidden")}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-foreground">
              <GithubIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">acme-eng</p>
              <p className="truncate text-xs text-muted-foreground">Connected</p>
            </div>
          </div>
        </div>

        {/* Logout — form action fires a POST server action, no client-side fetch needed */}
        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors",
              collapsed && "md:justify-center",
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {!collapsed && <span>Log out</span>}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top trigger */}
      <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-foreground"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <span className="text-foreground font-semibold">DevPulse</span>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex sticky top-0 h-screen shrink-0 border-r border-border bg-background/60 backdrop-blur transition-all duration-300",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-background animate-fade-in-up">
            {SidebarBody}
          </div>
        </div>
      )}
    </>
  )
}
