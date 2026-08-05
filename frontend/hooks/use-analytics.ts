/**
 * useAnalytics
 *
 * Centralised wrapper around Vercel Analytics' `track()`.
 * Import this hook anywhere you need to fire a custom event — it keeps all
 * event names and property shapes in one place so they stay consistent.
 */

import { track } from "@vercel/analytics"

// ─── Event payload types ──────────────────────────────────────────────────────

export type LoginInitiatedPayload = {
  method: "github_oauth"
}

export type OnboardingStepCompletedPayload = {
  step: "repo" | "date_range" | "digest"
  step_index: number
}

export type OnboardingCompletedPayload = {
  date_range_days: number
  digest_expanded: boolean
  repo_count: number
}

export type RepositorySelectedPayload = {
  repo_id: string
  repo_name: string
  is_private: boolean
}

export type RepositorySyncedPayload = {
  repo_name: string
  trigger: "manual"
}

export type DateRangeChangedPayload = {
  range: "7d" | "30d" | "90d"
  days: number
}

export type DigestGeneratedPayload = {
  repo_id: string
}

export type DigestRegeneratedPayload = {
  repo_id: string
  was_stale: boolean
}

export type DigestHistoryViewedPayload = {
  repo_id: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalytics() {
  return {
    /** User clicked "Login with GitHub" on the login page. */
    loginInitiated(payload: LoginInitiatedPayload) {
      track("Login Initiated", payload)
    },

    /** User advanced past a step in the onboarding wizard. */
    onboardingStepCompleted(payload: OnboardingStepCompletedPayload) {
      track("Onboarding Step Completed", payload)
    },

    /** User finished all onboarding steps and landed on the dashboard. */
    onboardingCompleted(payload: OnboardingCompletedPayload) {
      track("Onboarding Completed", payload)
    },

    /** User switched the active repository (sidebar or onboarding). */
    repositorySelected(payload: RepositorySelectedPayload) {
      track("Repository Selected", payload)
    },

    /** User triggered a manual GitHub sync that succeeded. */
    repositorySynced(payload: RepositorySyncedPayload) {
      track("Repository Synced", payload)
    },

    /** User changed the dashboard date range filter. */
    dateRangeChanged(payload: DateRangeChangedPayload) {
      track("Date Range Changed", payload)
    },

    /** User clicked "Generate Now" on the AI Digests page. */
    digestGenerated(payload: DigestGeneratedPayload) {
      track("Digest Generated", payload)
    },

    /** User clicked "Regenerate" on an existing digest card. */
    digestRegenerated(payload: DigestRegeneratedPayload) {
      track("Digest Regenerated", payload)
    },

    /** User expanded the digest history panel. */
    digestHistoryViewed(payload: DigestHistoryViewedPayload) {
      track("Digest History Viewed", payload)
    },
  }
}