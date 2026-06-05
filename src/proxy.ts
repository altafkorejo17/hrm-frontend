import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/api.types'
import type { AuthTokens } from '@/lib/auth/types'

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password']

// Mirror COOKIES from lib/auth/session — cannot import server-only here
const COOKIE = { ACCESS: 'hrm_at', REFRESH: 'hrm_rt', USER: 'hrm_user' } as const

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

function isExpired(token: string | undefined): boolean {
  if (!token) return true
  const payload = decodeJwt(token)
  if (typeof payload?.exp !== 'number') return true
  return payload.exp * 1000 < Date.now() + 30_000 // 30 s buffer
}

async function silentRefresh(refreshToken: string): Promise<AuthTokens | null> {
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    })
    const json: ApiResponse<AuthTokens> = await res.json()
    return res.ok && json.success ? json.data : null
  } catch {
    return null
  }
}

function setTokenCookies(res: NextResponse, tokens: AuthTokens) {
  res.cookies.set(COOKIE.ACCESS,  tokens.accessToken,  { ...COOKIE_BASE, maxAge: 24 * 60 * 60 })
  res.cookies.set(COOKIE.REFRESH, tokens.refreshToken, { ...COOKIE_BASE, maxAge: 30 * 24 * 60 * 60 })
}

function clearTokenCookies(res: NextResponse) {
  Object.values(COOKIE).forEach((name) => res.cookies.delete(name))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))

  const accessToken  = request.cookies.get(COOKIE.ACCESS)?.value
  const refreshToken = request.cookies.get(COOKIE.REFRESH)?.value

  // ── Valid access token ────────────────────────────────────────────────────
  if (!isExpired(accessToken)) {
    if (isPublic) return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.next()
  }

  // ── Expired — try silent refresh ──────────────────────────────────────────
  if (refreshToken) {
    const tokens = await silentRefresh(refreshToken)

    if (tokens) {
      const response = isPublic
        ? NextResponse.redirect(new URL('/dashboard', request.url))
        : NextResponse.next()
      setTokenCookies(response, tokens)
      return response
    }

    // Refresh failed — clear cookies and redirect to login
    const url = new URL('/login', request.url)
    if (!isPublic) url.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(url)
    clearTokenCookies(response)
    return response
  }

  // ── No tokens ─────────────────────────────────────────────────────────────
  if (isPublic) return NextResponse.next()

  const url = new URL('/login', request.url)
  url.searchParams.set('callbackUrl', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
}
