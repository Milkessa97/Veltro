const API_URL = "/api"

export interface UserInfo {
  id: string
  github_id: number
  github_login: string
  display_name: string
  avatar_url: string
  created_at: string
  last_login_at: string
  is_onboarded: boolean
}

/**
 * Fetches the currently authenticated user's details from the backend.
 * Credentials are included so the HTTP-only cookie is sent automatically.
 */
export async function getCurrentUser(): Promise<UserInfo> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch current user info: ${res.statusText}`)
  }

  return res.json()
}
