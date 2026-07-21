const API_URL = "/api"

export interface DigestResponse {
  id: string
  user_id: string
  repository_id: string
  content: string
  period_start: string
  period_end: string
  is_stale: boolean
  generated_at: string
  type: string
}

export interface BottleneckExplanationResponse {
  contributor_login: string
  explanation: string
  generated_at: string
}

/**
 * Checks for a fresh cached weekly digest or generates one.
 */
export async function getWeeklyDigest(repositoryId: string): Promise<DigestResponse> {
  const res = await fetch(`${API_URL}/digest/${repositoryId}/weekly`, {
    credentials: "include",
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to fetch weekly digest: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Forces regeneration of a weekly digest.
 */
export async function regenerateDigest(repositoryId: string): Promise<DigestResponse> {
  const res = await fetch(`${API_URL}/digest/${repositoryId}/regenerate`, {
    method: "POST",
    credentials: "include",
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to regenerate digest: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Fetches bottleneck explanation for a given contributor.
 */
export async function getBottleneckExplanation(
  repositoryId: string,
  githubLogin: string
): Promise<BottleneckExplanationResponse> {
  const res = await fetch(`${API_URL}/digest/${repositoryId}/bottleneck/${githubLogin}`, {
    credentials: "include",
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to fetch bottleneck explanation: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Returns the history of generated digests for a repository.
 */
export async function getDigestHistory(repositoryId: string): Promise<DigestResponse[]> {
  const res = await fetch(`${API_URL}/digest/${repositoryId}/history`, {
    credentials: "include",
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to fetch digest history: ${res.statusText}`)
  }

  return res.json()
}
