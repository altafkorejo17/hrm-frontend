/**
 * Authenticated HTTP client for Server Components and Server Actions.
 * Automatically attaches the session access token and unwraps the NestJS
 * ApiResponse<T> envelope, returning T directly.
 */
import 'server-only'
import type { ApiResponse, ApiErrorBody } from '../api.types'
import { getAccessToken } from '../auth/session'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: ApiErrorBody,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isUnauthorized() { return this.status === 401 }
  get isForbidden()    { return this.status === 403 }
  get isNotFound()     { return this.status === 404 }
  get isValidation()   { return this.status === 400 }
}

type FetchOptions = {
  method?:     'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?:       unknown
  auth?:       boolean
  tags?:       string[]
  revalidate?: number | false
}

export async function apiFetch<T>(endpoint: string, opts: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, tags, revalidate } = opts

  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (auth) {
    const token = await getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${process.env.API_BASE_URL}/api/v1${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: revalidate === false ? 'no-store' : undefined,
    next: {
      ...(tags              ? { tags }               : {}),
      ...(typeof revalidate === 'number' ? { revalidate } : {}),
    },
  })

  const text = await res.text()
  const json: ApiResponse<T> | ApiErrorBody = text ? JSON.parse(text) : {}

  if (!res.ok) {
    const err = json as ApiErrorBody
    const msg = Array.isArray(err.message)
      ? err.message.join('. ')
      : (err.message ?? res.statusText)
    throw new ApiError(res.status, msg, err)
  }

  return (json as ApiResponse<T>).data as T
}

export const apiGet = <T>(ep: string, o?: Omit<FetchOptions, 'method' | 'body'>) =>
  apiFetch<T>(ep, { ...o, method: 'GET' })

export const apiPost = <T>(ep: string, body?: unknown, o?: Omit<FetchOptions, 'method'>) =>
  apiFetch<T>(ep, { ...o, method: 'POST', body })

export const apiPatch = <T>(ep: string, body?: unknown, o?: Omit<FetchOptions, 'method'>) =>
  apiFetch<T>(ep, { ...o, method: 'PATCH', body })

export const apiPut = <T>(ep: string, body?: unknown, o?: Omit<FetchOptions, 'method'>) =>
  apiFetch<T>(ep, { ...o, method: 'PUT', body })

export const apiDelete = <T>(ep: string, o?: Omit<FetchOptions, 'method' | 'body'>) =>
  apiFetch<T>(ep, { ...o, method: 'DELETE' })
