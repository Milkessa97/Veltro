import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Edge middleware — lightweight auth gate based on cookie presence only.
 * This does NOT verify the JWT signature (that requires the backend's
 * secret, which the edge runtime shouldn't hold). Real authorization
 * happens server-side in FastAPI via get_current_user on every request.
 * This middleware exists purely to redirect unauthenticated users away
 * from protected pages before they render, and to skip /login for
 * users who already have a session cookie.
 */
export default function middleware(req: NextRequest) {
  const { nextUrl } = req
  const hasAccessToken = !!req.cookies.get("access_token")?.value

  const isProtected =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/onboarding")
  const isLoginPage = nextUrl.pathname === "/login"

  if (hasAccessToken && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  if (!hasAccessToken && isProtected) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}