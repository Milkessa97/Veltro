import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16 rounded-xl border border-dashed border-gray-200 dark:border-[#1F1F23] bg-white dark:bg-[#0F0F12]",
        className,
      )}
    >
      <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
        <Icon className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5 text-pretty">{description}</p>
      {action}
    </div>
  )
}
