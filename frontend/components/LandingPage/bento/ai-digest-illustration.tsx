import { SparkIcon } from "../icons"

export function AiDigestIllustration() {
  const lines = [
    { w: "w-11/12", label: true },
    { w: "w-4/5" },
    { w: "w-full" },
    { w: "w-3/5" },
  ]
  return (
    <div className="w-full h-full flex items-center justify-center px-6 pb-6">
      <div className="w-full rounded-xl border border-border bg-card p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <SparkIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-foreground">Weekly digest</span>
          <span className="ml-auto text-[10px] font-medium text-primary">AI</span>
        </div>
        <div className="space-y-2.5">
          {lines.map((l, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full ${l.w} ${l.label ? "bg-primary/40" : "bg-foreground/15"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
