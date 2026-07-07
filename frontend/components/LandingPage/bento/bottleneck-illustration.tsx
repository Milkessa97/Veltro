import { AlertIcon } from "../icons"

export function BottleneckIllustration() {
  const items = [
    { name: "#412 Auth refactor", days: "6d waiting", level: "high" },
    { name: "#398 API cleanup", days: "3d waiting", level: "med" },
    { name: "#421 UI polish", days: "1d waiting", level: "low" },
  ]
  const color = { high: "text-primary", med: "text-foreground/70", low: "text-muted-foreground" } as const
  const bar = { high: "w-full bg-primary", med: "w-2/3 bg-primary/60", low: "w-1/3 bg-primary/30" } as const

  return (
    <div className="w-full h-full flex items-center justify-center px-6 pb-6">
      <div className="w-full space-y-2.5">
        {items.map((it) => (
          <div key={it.name} className="rounded-lg border border-border bg-card p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertIcon className={`h-4 w-4 ${color[it.level as keyof typeof color]}`} />
              <span className="text-sm text-foreground truncate">{it.name}</span>
              <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{it.days}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-foreground/10">
              <div className={`h-full rounded-full ${bar[it.level as keyof typeof bar]}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
