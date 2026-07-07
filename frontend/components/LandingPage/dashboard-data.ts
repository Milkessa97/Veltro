export type Repo = {
  id: string
  name: string
  org: string
  branch: string
}

export const repos: Repo[] = [
  { id: "web-app", name: "web-app", org: "acme", branch: "main" },
  { id: "api-server", name: "api-server", org: "acme", branch: "main" },
  { id: "design-system", name: "design-system", org: "acme", branch: "develop" },
  { id: "mobile-client", name: "mobile-client", org: "acme", branch: "main" },
  { id: "infra", name: "infra", org: "acme", branch: "main" },
]

export type RepoMetrics = {
  cycleTime: number[]
  cycleTimeLabels: string[]
  summary: { label: string; value: string; delta: string; positive: boolean }[]
  insights: { title: string; severity: "high" | "medium" | "low"; detail: string }[]
}

const labels = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"]

export const metricsByRepo: Record<string, RepoMetrics> = {
  "web-app": {
    cycleTime: [58, 52, 61, 47, 44, 39, 41, 33],
    cycleTimeLabels: labels,
    summary: [
      { label: "Avg cycle time", value: "33h", delta: "-19%", positive: true },
      { label: "Merged PRs", value: "48", delta: "+12%", positive: true },
      { label: "Review wait", value: "9h", delta: "-8%", positive: true },
      { label: "Open bottlenecks", value: "3", delta: "+1", positive: false },
    ],
    insights: [
      {
        title: "Reviews stall on Fridays",
        severity: "high",
        detail:
          "PRs opened after Thursday 3pm wait 2.4x longer for a first review. Consider a rotation so late-week PRs get picked up before the weekend.",
      },
      {
        title: "Large PRs slow cycle time",
        severity: "medium",
        detail:
          "PRs over 400 lines take 61% longer to merge. Splitting the auth refactor into smaller changes would likely cut a full day from cycle time.",
      },
      {
        title: "One reviewer is a hotspot",
        severity: "low",
        detail:
          "42% of reviews route to a single maintainer. Spreading review load would reduce the risk of a single-person bottleneck.",
      },
    ],
  },
  "api-server": {
    cycleTime: [72, 69, 64, 66, 58, 55, 60, 51],
    cycleTimeLabels: labels,
    summary: [
      { label: "Avg cycle time", value: "51h", delta: "-11%", positive: true },
      { label: "Merged PRs", value: "31", delta: "+4%", positive: true },
      { label: "Review wait", value: "14h", delta: "+6%", positive: false },
      { label: "Open bottlenecks", value: "5", delta: "+2", positive: false },
    ],
    insights: [
      {
        title: "Integration tests block merges",
        severity: "high",
        detail:
          "Flaky integration tests caused 18 re-runs this week, adding ~6h to average cycle time. Stabilizing the top 3 flaky suites would have the biggest impact.",
      },
      {
        title: "Review wait is climbing",
        severity: "medium",
        detail:
          "First-review wait rose from 11h to 14h over the last month as PR volume increased without adding reviewers.",
      },
    ],
  },
  "design-system": {
    cycleTime: [40, 38, 42, 35, 33, 30, 28, 27],
    cycleTimeLabels: labels,
    summary: [
      { label: "Avg cycle time", value: "27h", delta: "-14%", positive: true },
      { label: "Merged PRs", value: "22", delta: "+9%", positive: true },
      { label: "Review wait", value: "6h", delta: "-12%", positive: true },
      { label: "Open bottlenecks", value: "1", delta: "-1", positive: true },
    ],
    insights: [
      {
        title: "Healthy, fast-moving repo",
        severity: "low",
        detail:
          "Cycle time is trending down and review wait is under 6h. Keep PRs small and this repo will stay a model for the rest of the org.",
      },
    ],
  },
  "mobile-client": {
    cycleTime: [80, 76, 70, 74, 68, 65, 63, 59],
    cycleTimeLabels: labels,
    summary: [
      { label: "Avg cycle time", value: "59h", delta: "-9%", positive: true },
      { label: "Merged PRs", value: "18", delta: "-3%", positive: false },
      { label: "Review wait", value: "16h", delta: "-4%", positive: true },
      { label: "Open bottlenecks", value: "4", delta: "0", positive: false },
    ],
    insights: [
      {
        title: "Release branches pile up",
        severity: "high",
        detail:
          "Two long-lived release branches are diverging from main, causing repeated merge conflicts that add hours to each PR.",
      },
      {
        title: "Slow first review on native code",
        severity: "medium",
        detail:
          "PRs touching native modules wait 22h on average because only two engineers can review them.",
      },
    ],
  },
  infra: {
    cycleTime: [50, 55, 49, 52, 46, 48, 43, 45],
    cycleTimeLabels: labels,
    summary: [
      { label: "Avg cycle time", value: "45h", delta: "-3%", positive: true },
      { label: "Merged PRs", value: "14", delta: "+1%", positive: true },
      { label: "Review wait", value: "11h", delta: "+2%", positive: false },
      { label: "Open bottlenecks", value: "2", delta: "0", positive: false },
    ],
    insights: [
      {
        title: "Approvals require two owners",
        severity: "medium",
        detail:
          "Required dual approval on infra changes is sound for safety but adds ~8h of wait. Consider auto-requesting both owners on PR open.",
      },
    ],
  },
}
