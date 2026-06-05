import 'server-only'
import { cookies } from 'next/headers'
import type { AuthTokens, AuthUser } from './types'

export const COOKIES = {
  ACCESS_TOKEN:  'hrm_at',
  REFRESH_TOKEN: 'hrm_rt',
  USER:          'hrm_user',
} as const

// Align these with your NestJS JWT expiresIn config
const ACCESS_MAX_AGE  = 24 * 60 * 60       // 1 day
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60  // 30 days

const SECURE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function setAuthCookies(tokens: AuthTokens, user?: AuthUser) {
  const store = await cookies()

  store.set(COOKIES.ACCESS_TOKEN, tokens.accessToken, {
    ...SECURE_BASE,
    maxAge: ACCESS_MAX_AGE,
  })
  store.set(COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
    ...SECURE_BASE,
    maxAge: REFRESH_MAX_AGE,
  })

  if (user) {
    // Not httpOnly — readable by client JS for display (no sensitive data here)
    store.set(COOKIES.USER, JSON.stringify(user), {
      secure: SECURE_BASE.secure,
      sameSite: SECURE_BASE.sameSite,
      path: SECURE_BASE.path,
      maxAge: REFRESH_MAX_AGE,
    })
  }
}

export async function clearAuthCookies() {
  const store = await cookies()
  Object.values(COOKIES).forEach((name) => store.delete(name))
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIES.ACCESS_TOKEN)?.value
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIES.REFRESH_TOKEN)?.value
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const raw = (await cookies()).get(COOKIES.USER)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}
