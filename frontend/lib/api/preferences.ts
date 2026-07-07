const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface UserPreferences {
  default_repository_id: string | null
  default_date_range_days: number
  digest_panel_expanded: boolean
  is_onboarded: boolean
}

export interface UpdatePreferencesPayload {
  default_repository_id?: string | null
  default_date_range_days?: number
  digest_panel_expanded?: boolean
  is_onboarded?: boolean
}

/**
 * Fetches the authenticated user's preferences from the backend.
 * Credentials are included so the HTTP-only cookie is sent automatically.
 */
export async function getPreferences(): Promise<UserPreferences> {
  const res = await fetch(`${API_URL}/preferences`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch preferences: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Partially updates the authenticated user's preferences.
 * Only the fields included in the payload are changed on the backend.
 */
export async function updatePreferences(
  payload: UpdatePreferencesPayload
): Promise<UserPreferences> {
  const res = await fetch(`${API_URL}/preferences`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Failed to update preferences: ${res.statusText}`)
  }

  return res.json()
}
