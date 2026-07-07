export type Repo = {
  id: string
  name: string
  org: string
  branch: string
  prs: number
}

export const repos: Repo[] = [
  { id: "core-api", name: "core-api", org: "acme", branch: "main", prs: 14 },
  { id: "web-app", name: "web-app", org: "acme", branch: "main", prs: 23 },
  { id: "mobile", name: "mobile-client", org: "acme", branch: "develop", prs: 9 },
  { id: "design-system", name: "design-system", org: "acme", branch: "main", prs: 6 },
  { id: "infra", name: "infra", org: "acme", branch: "main", prs: 4 },
  { id: "billing", name: "billing-service", org: "acme", branch: "release", prs: 11 },
  { id: "docs", name: "docs-site", org: "acme", branch: "main", prs: 3 },
]

export type CyclePoint = { day: string; cycle: number; reviews: number }

export const cycleData: CyclePoint[] = [
  { day: "Mon", cycle: 26, reviews: 8 },
  { day: "Tue", cycle: 22, reviews: 12 },
  { day: "Wed", cycle: 28, reviews: 6 },
  { day: "Thu", cycle: 19, reviews: 14 },
  { day: "Fri", cycle: 15, reviews: 11 },
  { day: "Sat", cycle: 9, reviews: 4 },
  { day: "Sun", cycle: 12, reviews: 7 },
]

export type Insight = {
  id: string
  title: string
  severity: "high" | "medium" | "low"
  summary: string
  detail: string
}

export const insights: Insight[] = [
  {
    id: "1",
    title: "Reviews are the primary bottleneck",
    severity: "high",
    summary: "62% of cycle time is spent waiting for a first review.",
    detail:
      "Across the last 30 PRs, the median time-to-first-review is 14.2 hours — nearly 3x your merge time. Three reviewers hold 71% of the review load. Consider adding a rotation or a review SLA of 4 hours to cut cycle time by an estimated 40%.",
  },
  {
    id: "2",
    title: "Large PRs are stalling on rework",
    severity: "medium",
    summary: "PRs over 400 lines take 2.4x longer to merge.",
    detail:
      "Six PRs this week exceeded 400 changed lines and each required 3+ review rounds. Splitting feature work into smaller, stacked PRs would reduce rework loops and keep reviewers in flow.",
  },
  {
    id: "3",
    title: "CI flakiness adds hidden delay",
    severity: "low",
    summary: "9% of merges were blocked by a flaky test suite.",
    detail:
      "The integration test job failed and was retried on 4 PRs, adding an average of 38 minutes each. Quarantining the two flakiest specs would recover most of this lost time.",
  },
]
