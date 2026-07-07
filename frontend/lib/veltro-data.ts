// Veltro - Engineering Team Health Platform
// Mock data layer. In a real app these would come from the GitHub sync pipeline.

export type SyncStatus = "synced" | "syncing" | "error" | "never"

export interface Repository {
  id: string
  name: string
  owner: string
  visibility: "public" | "private"
  syncStatus: SyncStatus
  lastSynced: string // ISO
}

export interface Contributor {
  id: string
  username: string
  name: string
  avatar: string
  prsOpened: number
  prsReviewed: number
  avgCycleTimeHours: number
  avgReviewTimeHours: number
  pendingReviews: number
  bottleneck: "none" | "review" | "merge"
  activity: number // 0-100 relative activity indicator
  bottleneckSummary: string
}

export type PrState = "waiting" | "in-review" | "ready" | "merged"

export interface PullRequest {
  id: string
  number: number
  title: string
  author: Contributor
  state: PrState
  reviewers: Contributor[]
  // hours spent in each phase
  waitingHours: number
  reviewHours: number
  readyHours: number
  createdAt: string
}

export interface CyclePoint {
  date: string
  cycleTime: number
  reviewTime: number
}

export interface Digest {
  id: string
  week: string
  type: "Weekly Summary" | "Bottleneck Report" | "Velocity Report"
  summary: string
  generatedAt: string
}

export type SyncEventStatus = "success" | "failed" | "running"

export interface SyncEvent {
  id: string
  status: SyncEventStatus
  trigger: "manual" | "scheduled" | "webhook"
  timestamp: string
  prsImported: number
  reviewsImported: number
  durationSeconds: number
  error?: string
}

const AVATARS: Record<number, string> = {
  1: "/avatars/sarah.png",
  2: "/avatars/marcus.png",
  3: "/avatars/priya.png",
  4: "/avatars/diego.png",
  5: "/avatars/ana.png",
  6: "/avatars/tom.png",
}
const AV = (n: number) => AVATARS[n]

export const repositories: Repository[] = [
  {
    id: "1",
    name: "veltro-api",
    owner: "veltro",
    visibility: "private",
    syncStatus: "synced",
    lastSynced: "2026-07-06T09:12:00Z",
  },
  {
    id: "2",
    name: "veltro-web",
    owner: "veltro",
    visibility: "public",
    syncStatus: "synced",
    lastSynced: "2026-07-06T08:40:00Z",
  },
  {
    id: "3",
    name: "veltro-infra",
    owner: "veltro",
    visibility: "private",
    syncStatus: "error",
    lastSynced: "2026-07-05T22:03:00Z",
  },
  {
    id: "4",
    name: "design-system",
    owner: "veltro",
    visibility: "public",
    syncStatus: "syncing",
    lastSynced: "2026-07-06T09:20:00Z",
  },
]

export const contributors: Contributor[] = [
  {
    id: "c1",
    username: "sarah-chen",
    name: "Sarah Chen",
    avatar: AV(1),
    prsOpened: 34,
    prsReviewed: 58,
    avgCycleTimeHours: 22,
    avgReviewTimeHours: 4,
    pendingReviews: 2,
    bottleneck: "none",
    activity: 96,
    bottleneckSummary:
      "Sarah maintains a healthy balance of authoring and reviewing. No blocking patterns detected this period.",
  },
  {
    id: "c2",
    username: "marcus-lee",
    name: "Marcus Lee",
    avatar: AV(2),
    prsOpened: 21,
    prsReviewed: 12,
    avgCycleTimeHours: 61,
    avgReviewTimeHours: 19,
    pendingReviews: 7,
    bottleneck: "review",
    activity: 64,
    bottleneckSummary:
      "Marcus has 7 pending reviews and an average review turnaround of 19h, which is delaying several PRs. Consider redistributing review load.",
  },
  {
    id: "c3",
    username: "priya-nair",
    name: "Priya Nair",
    avatar: AV(3),
    prsOpened: 28,
    prsReviewed: 41,
    avgCycleTimeHours: 30,
    avgReviewTimeHours: 6,
    pendingReviews: 3,
    bottleneck: "none",
    activity: 82,
    bottleneckSummary: "Priya is a reliable reviewer with steady throughput. No bottlenecks detected.",
  },
  {
    id: "c4",
    username: "diego-ramos",
    name: "Diego Ramos",
    avatar: AV(4),
    prsOpened: 40,
    prsReviewed: 9,
    avgCycleTimeHours: 74,
    avgReviewTimeHours: 8,
    pendingReviews: 1,
    bottleneck: "merge",
    activity: 71,
    bottleneckSummary:
      "Diego opens the most PRs but they sit in a ready-to-merge state for an average of 2 days. Merges are the primary bottleneck.",
  },
  {
    id: "c5",
    username: "ana-costa",
    name: "Ana Costa",
    avatar: AV(5),
    prsOpened: 17,
    prsReviewed: 33,
    avgCycleTimeHours: 26,
    avgReviewTimeHours: 5,
    pendingReviews: 0,
    bottleneck: "none",
    activity: 58,
    bottleneckSummary: "Ana clears her review queue promptly. No bottlenecks detected.",
  },
  {
    id: "c6",
    username: "tom-baker",
    name: "Tom Baker",
    avatar: AV(6),
    prsOpened: 12,
    prsReviewed: 6,
    avgCycleTimeHours: 88,
    avgReviewTimeHours: 27,
    pendingReviews: 5,
    bottleneck: "review",
    activity: 39,
    bottleneckSummary:
      "Tom's review latency (27h) is the highest on the team and is contributing to a growing backlog of waiting PRs.",
  },
]

const byId = (id: string) => contributors.find((c) => c.id === id)!

export const pullRequests: PullRequest[] = [
  {
    id: "pr1",
    number: 1482,
    title: "Add rate limiting to the sync ingestion endpoint",
    author: byId("c1"),
    state: "in-review",
    reviewers: [byId("c3"), byId("c2")],
    waitingHours: 3,
    reviewHours: 8,
    readyHours: 0,
    createdAt: "2026-07-05T14:00:00Z",
  },
  {
    id: "pr2",
    number: 1479,
    title: "Refactor contributor metrics aggregation query",
    author: byId("c4"),
    state: "ready",
    reviewers: [byId("c1")],
    waitingHours: 6,
    reviewHours: 12,
    readyHours: 40,
    createdAt: "2026-07-04T09:30:00Z",
  },
  {
    id: "pr3",
    number: 1475,
    title: "Fix flaky timeline chart snapshot tests",
    author: byId("c3"),
    state: "merged",
    reviewers: [byId("c5")],
    waitingHours: 2,
    reviewHours: 5,
    readyHours: 3,
    createdAt: "2026-07-03T11:15:00Z",
  },
  {
    id: "pr4",
    number: 1471,
    title: "Introduce AI digest regeneration cron",
    author: byId("c2"),
    state: "waiting",
    reviewers: [byId("c6")],
    waitingHours: 22,
    reviewHours: 0,
    readyHours: 0,
    createdAt: "2026-07-05T20:00:00Z",
  },
  {
    id: "pr5",
    number: 1468,
    title: "Improve dark mode contrast on sync badges",
    author: byId("c5"),
    state: "in-review",
    reviewers: [byId("c1"), byId("c3")],
    waitingHours: 4,
    reviewHours: 6,
    readyHours: 0,
    createdAt: "2026-07-05T08:45:00Z",
  },
  {
    id: "pr6",
    number: 1463,
    title: "Add pagination to the pull request list API",
    author: byId("c1"),
    state: "merged",
    reviewers: [byId("c4"), byId("c3")],
    waitingHours: 1,
    reviewHours: 4,
    readyHours: 2,
    createdAt: "2026-07-02T16:20:00Z",
  },
  {
    id: "pr7",
    number: 1460,
    title: "Cache repository sync status in Redis",
    author: byId("c4"),
    state: "ready",
    reviewers: [byId("c2")],
    waitingHours: 8,
    reviewHours: 10,
    readyHours: 30,
    createdAt: "2026-07-01T13:10:00Z",
  },
  {
    id: "pr8",
    number: 1457,
    title: "Handle webhook retries with exponential backoff",
    author: byId("c6"),
    state: "waiting",
    reviewers: [byId("c2")],
    waitingHours: 30,
    reviewHours: 0,
    readyHours: 0,
    createdAt: "2026-07-05T18:30:00Z",
  },
]

export const cycleTimeSeries: CyclePoint[] = [
  { date: "Jun 08", cycleTime: 38, reviewTime: 9 },
  { date: "Jun 15", cycleTime: 42, reviewTime: 11 },
  { date: "Jun 22", cycleTime: 35, reviewTime: 8 },
  { date: "Jun 29", cycleTime: 31, reviewTime: 7 },
  { date: "Jul 06", cycleTime: 28, reviewTime: 6 },
  { date: "Jul 13", cycleTime: 33, reviewTime: 7 },
  { date: "Jul 20", cycleTime: 26, reviewTime: 5 },
]

export const digests: Digest[] = [
  {
    id: "d1",
    week: "Week of Jul 6, 2026",
    type: "Weekly Summary",
    summary:
      "Cycle time improved 14% week-over-week, landing at 26h on average. Review latency dropped to 5h thanks to Priya and Ana clearing their queues quickly. The main drag remains merge latency on veltro-api, where ready PRs waited an average of 35h. Recommend enabling auto-merge for approved PRs.",
    generatedAt: "2026-07-06T07:00:00Z",
  },
  {
    id: "d2",
    week: "Week of Jun 29, 2026",
    type: "Bottleneck Report",
    summary:
      "Marcus and Tom accounted for 68% of pending reviews this week. Two PRs waited over 30h for a first review. Consider adding a secondary reviewer rotation to smooth out review load during peak hours.",
    generatedAt: "2026-06-29T07:00:00Z",
  },
  {
    id: "d3",
    week: "Week of Jun 22, 2026",
    type: "Velocity Report",
    summary:
      "The team merged 41 PRs, a 9% increase over the prior week. First-review latency held steady at 8h. No critical bottlenecks detected, though Diego's ready-to-merge queue is trending upward and worth monitoring.",
    generatedAt: "2026-06-22T07:00:00Z",
  },
]

export const syncEvents: SyncEvent[] = [
  {
    id: "s1",
    status: "success",
    trigger: "scheduled",
    timestamp: "2026-07-06T09:12:00Z",
    prsImported: 24,
    reviewsImported: 61,
    durationSeconds: 42,
  },
  {
    id: "s2",
    status: "success",
    trigger: "manual",
    timestamp: "2026-07-06T06:03:00Z",
    prsImported: 8,
    reviewsImported: 19,
    durationSeconds: 27,
  },
  {
    id: "s3",
    status: "failed",
    trigger: "webhook",
    timestamp: "2026-07-05T22:03:00Z",
    prsImported: 0,
    reviewsImported: 0,
    durationSeconds: 12,
    error: "GitHub API rate limit exceeded (403). Retry scheduled in 15 minutes.",
  },
  {
    id: "s4",
    status: "success",
    trigger: "scheduled",
    timestamp: "2026-07-05T09:12:00Z",
    prsImported: 31,
    reviewsImported: 74,
    durationSeconds: 55,
  },
  {
    id: "s5",
    status: "success",
    trigger: "scheduled",
    timestamp: "2026-07-04T09:12:00Z",
    prsImported: 19,
    reviewsImported: 47,
    durationSeconds: 38,
  },
]

export const prStateConfig: Record<
  PrState,
  { label: string; dot: string; text: string; bg: string }
> = {
  waiting: {
    label: "Waiting for review",
    dot: "bg-violet-400 dark:bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-950/40",
  },
  "in-review": {
    label: "In review",
    dot: "bg-purple-500 dark:bg-purple-400",
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-950/40",
  },
  ready: {
    label: "Ready to merge",
    dot: "bg-indigo-600 dark:bg-indigo-400",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-950/40",
  },
  merged: {
    label: "Merged",
    dot: "bg-zinc-500",
    text: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
  },
}

export function formatRelativeTime(iso: string): string {
  const now = new Date("2026-07-06T10:00:00Z").getTime()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
