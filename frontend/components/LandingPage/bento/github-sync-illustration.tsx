import { GithubIcon, RepoIcon, CheckIcon } from "../icons"

export function GithubSyncIllustration() {
  const repos = ["web-app", "api-server", "design-system"]
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-6 pb-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full glow-spot" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-foreground animate-float">
          <GithubIcon className="h-7 w-7" />
        </span>
      </div>
      <div className="w-full space-y-2">
        {repos.map((r) => (
          <div key={r} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 backdrop-blur-sm">
            <RepoIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{r}</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-primary">
              <CheckIcon className="h-3.5 w-3.5" />
              Synced
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
