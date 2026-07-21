const API_URL = "/api"

// ─── Repository ───────────────────────────────────────────────────────────────

export interface Repository {
  id: string
  github_id: number | null
  owner: string
  name: string
  full_name: string
  is_private: boolean
  is_synced: boolean
  synced_at: string | null
  created_at: string
}

/** Fetches the user's repositories. Pass sync=true to refresh from GitHub. */
export async function getRepositories(sync = false): Promise<Repository[]> {
  const url = `${API_URL}/repos${sync ? "?sync=true" : ""}`
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to fetch repositories: ${res.statusText}`)
  return res.json()
}

/** Triggers a full data sync for one repository (PRs, contributors, reviews). */
export async function syncRepo(id: string): Promise<Repository> {
  const res = await fetch(`${API_URL}/repos/${id}/sync`, {
    method: "POST",
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`)
  return res.json()
}

// ─── Pull Requests ────────────────────────────────────────────────────────────

export interface PRContributor {
  id: string
  github_id: number
  github_login: string
  display_name: string
  avatar_url: string
}

export interface PRLabel {
  id: string
  name: string
  color: string
}

export interface PullRequestDetail {
  id: string
  repository_id: string
  github_pr_number: number
  title: string
  /** "open" | "closed" | "merged" */
  state: string
  opened_at: string
  first_review_at: string | null
  merged_at: string | null
  closed_at: string | null
  additions: number
  deletions: number
  author: PRContributor
  labels: PRLabel[]
  reviewers: PRContributor[]
}

/**
 * Fetches pull requests for a repository with full author/reviewer detail.
 * @param days   Filter to PRs opened within this many days (default 30)
 * @param state  "open" | "closed" | "merged" — omit for all
 */
export async function getPullRequests(
  repoId: string,
  days = 30,
  state?: string
): Promise<PullRequestDetail[]> {
  const params = new URLSearchParams({ days: String(days) })
  if (state) params.set("state", state)
  const res = await fetch(`${API_URL}/repos/${repoId}/pull-requests?${params}`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to fetch pull requests: ${res.statusText}`)
  return res.json()
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface RepoMetrics {
  total_prs: number
  open_prs: number
  closed_prs: number
  merged_prs: number
  avg_cycle_time_hours: number
  avg_review_latency_hours: number
  total_additions: number
  total_deletions: number
  // New analytics fields
  avg_open_pr_age_hours: number
  deploys_per_week: number
  avg_coding_time_hours: number
  avg_review_time_hours: number
  bottleneck_score: number
}

/** Returns aggregated metrics for the repository over `days` days. */
export async function getRepoMetrics(repoId: string, days = 30): Promise<RepoMetrics> {
  const res = await fetch(`${API_URL}/repos/${repoId}/metrics?days=${days}`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`)
  return res.json()
}

// ─── Contributor Metrics ──────────────────────────────────────────────────────

export interface ContributorMetrics {
  id: string
  username: string
  display_name: string
  avatar_url: string
  prs_opened: number
  prs_reviewed: number
  avg_cycle_time_hours: number
  /** PRs where this contributor was formally requested as reviewer */
  review_assignments: number
  /** PRs where this contributor reviewed organically (no assignment) */
  organic_reviews: number
}

/** Returns per-contributor metrics for the repository over `days` days. */
export async function getContributorMetrics(
  repoId: string,
  days = 30
): Promise<ContributorMetrics[]> {
  const res = await fetch(`${API_URL}/repos/${repoId}/contributors-metrics?days=${days}`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to fetch contributor metrics: ${res.statusText}`)
  return res.json()
}

// ─── Sync Logs ────────────────────────────────────────────────────────────────

export interface SyncLog {
  id: string
  repository_id: string
  /** "running" | "completed" | "failed" */
  status: string
  /** "manual" | "webhook" | "scheduled" */
  triggered_by: string
  prs_fetched: number
  reviews_fetched: number
  commits_fetched: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}

/** Returns the most recent sync log entries for the repository (newest first). */
export async function getSyncLogs(repoId: string, limit = 20): Promise<SyncLog[]> {
  const res = await fetch(`${API_URL}/repos/${repoId}/sync-logs?limit=${limit}`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to fetch sync logs: ${res.statusText}`)
  return res.json()
}
