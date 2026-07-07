"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL!

/**
 * Server action: POST /auth/logout, then wipe the local session and redirect.
 * Using a server action ensures the request carries the httpOnly cookies
 * (credentials: "include" is automatic on the server side).
 */
export async function logoutAction() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  const refreshToken = cookieStore.get("refresh_token")?.value

  // Build cookie header to forward both tokens to the backend
  const cookieHeader = [
    accessToken ? `access_token=${accessToken}` : "",
    refreshToken ? `refresh_token=${refreshToken}` : "",
  ]
    .filter(Boolean)
    .join("; ")

  // Fire-and-forget — if the backend is down we still clear the frontend session
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  }).catch(() => {})

  // Redirect to login — Next.js will handle clearing the response
  redirect("/login")
}
