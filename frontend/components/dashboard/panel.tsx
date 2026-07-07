import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  icon: Icon,
  title,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white text-left flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />}
        {title}
      </h2>
      {action}
    </div>
  )
}
