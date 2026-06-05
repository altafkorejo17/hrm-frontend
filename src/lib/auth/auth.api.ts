/**
 * Direct fetch calls to NestJS auth endpoints.
 * No Next.js-specific imports — callable from Server Actions and the proxy.
 *
 * Endpoints (verified against /api/docs):
 *   POST /api/v1/auth/check-email  body: { email }                      → { exists: boolean }
 *   POST /api/v1/auth/login        body: { email, password }           → AuthTokens
 *   POST /api/v1/auth/refresh      body: { refreshToken }              → AuthTokens
 *   GET  /api/v1/auth/me           header: Authorization: Bearer <at>  → AuthUser
 *   POST /api/v1/auth/logout       header: Authorization: Bearer <at>  → void
 */
import type { ApiResponse } from '../api.types'
import type { AuthTokens, AuthUser } from './types'

const base = () => `${process.env.API_BASE_URL}/api/v1/auth`

async function call<T>(endpoint: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${endpoint}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
    cache: 'no-store',
  })
  const text = await res.text()
  const json: ApiResponse<T> = text ? JSON.parse(text) : {}

  if (!res.ok || !json.success) {
    const msg = Array.isArray(json.message)
      ? json.message.join('. ')
      : (json.message ?? res.statusText)
    throw new Error(msg)
  }

  return json.data as T
}

export const checkEmailApi = (email: string) =>
  call<{ exists: boolean }>('/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const loginApi = (email: string, password: string) =>
  call<AuthTokens>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const refreshApi = (refreshToken: string) =>
  call<AuthTokens>('/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })

export const getMeApi = (accessToken: string) =>
  call<AuthUser>('/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

// Best-effort — do not throw; token may already be expired on the backend
export const logoutApi = (accessToken: string) =>
  fetch(`${base()}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  }).catch(() => {})
