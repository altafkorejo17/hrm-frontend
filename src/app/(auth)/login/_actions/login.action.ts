'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { setAuthCookies } from '@/lib/auth/session'
import { checkEmailApi, loginApi, getMeApi } from '@/lib/auth/auth.api'

// ── Step 1 — verify email exists ──────────────────────────────────────────────

const EmailSchema = z.email('Please enter a valid email address.').trim()

export type CheckEmailResult =
  | { ok: true }
  | { ok: false; error: string }

export async function checkEmailAction(email: string): Promise<CheckEmailResult> {
  const parsed = EmailSchema.safeParse(email)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid email.' }
  }

  try {
    const { exists } = await checkEmailApi(parsed.data)
    if (!exists) return { ok: false, error: 'No account found with that email address.' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Unable to verify email. Please try again.' }
  }
}

// ── Step 2 — sign in ──────────────────────────────────────────────────────────

const LOGIN_ERROR_MAP: Record<string, string> = {
  'invalid credentials':   'The password you entered is incorrect. Please try again.',
  'account is inactive':   'Your account has been deactivated. Please contact your administrator.',
  'account not found':     'No account found with that email address.',
  'too many requests':     'Too many sign-in attempts. Please wait a few minutes and try again.',
}

function friendlyLoginError(raw: string): string {
  const key = raw.toLowerCase()
  for (const [pattern, message] of Object.entries(LOGIN_ERROR_MAP)) {
    if (key.includes(pattern)) return message
  }
  return 'We were unable to sign you in. Please check your credentials and try again.'
}

const PasswordSchema = z
  .string()
  .min(6, { message: 'Password must be at least 6 characters.' })

export type LoginResult = { ok: false; error: string }

export async function loginAction(
  email: string,
  password: string,
  callbackUrl?: string,
): Promise<LoginResult> {
  const parsed = PasswordSchema.safeParse(password)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid password.' }
  }

  try {
    const tokens = await loginApi(email, parsed.data)
    const user   = await getMeApi(tokens.accessToken)
    await setAuthCookies(tokens, user)
  } catch (err) {
    return {
      ok: false,
      error: friendlyLoginError(err instanceof Error ? err.message : ''),
    }
  }

  redirect(callbackUrl?.startsWith('/') ? callbackUrl : '/dashboard')
}
