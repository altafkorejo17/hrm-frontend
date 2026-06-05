'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { checkEmailAction, loginAction } from '../_actions/login.action'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

type Step = 'email' | 'password'

// ── Client validators ─────────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [step,     setStep]     = useState<Step>('email')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')

  // client-side field errors (shown on blur / submit attempt)
  const [emailTouched,    setEmailTouched]    = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  const [isPending, startTransition] = useTransition()

  const passwordRef = useRef<HTMLInputElement>(null)
  const emailRef    = useRef<HTMLInputElement>(null)

  // Focus password input when step changes
  useEffect(() => {
    if (step === 'password') passwordRef.current?.focus()
  }, [step])

  // ── Derived validation ─────────────────────────────────────────────────────

  const emailError =
    emailTouched && !email.trim()       ? 'Email is required.' :
    emailTouched && !isValidEmail(email)? 'Enter a valid email address.' : ''

  const passwordError =
    passwordTouched && !password          ? 'Password is required.' :
    passwordTouched && password.length < 6? 'Password must be at least 6 characters.' : ''

  // ── Step 1 — continue with email ──────────────────────────────────────────

  function handleEmailSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setEmailTouched(true)
    if (!email.trim() || !isValidEmail(email)) return

    setError('')
    startTransition(async () => {
      const result = await checkEmailAction(email.trim())
      if (result.ok) {
        setStep('password')
      } else {
        setError(result.error)
      }
    })
  }

  // ── Step 2 — sign in ──────────────────────────────────────────────────────

  function handlePasswordSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setPasswordTouched(true)
    if (!password || password.length < 6) return

    setError('')
    startTransition(async () => {
      const result = await loginAction(email.trim(), password, callbackUrl)
      // result is only returned on failure; success triggers a server-side redirect
      if (result) setError(result.error)
    })
  }

  // ── Back to email ─────────────────────────────────────────────────────────

  function handleBack() {
    setStep('email')
    setPassword('')
    setPasswordTouched(false)
    setError('')
    setTimeout(() => emailRef.current?.focus(), 50)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative overflow-hidden">

      {/* ── Step 1 — Email ── */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          step === 'email'
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none absolute inset-0 -translate-x-8 opacity-0'
        }`}
      >
        <form onSubmit={handleEmailSubmit} noValidate className="flex flex-col gap-5">
          <FormError message={step === 'email' ? error : undefined} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onBlur={() => setEmailTouched(true)}
              aria-describedby={emailError ? 'email-error' : undefined}
              aria-invalid={Boolean(emailError)}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-150 focus:ring-4 ${
                emailError
                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-500/10'
                  : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/10'
              }`}
            />
            {emailError && (
              <FieldError id="email-error" message={emailError} />
            )}
          </div>

          <Button type="submit" loading={isPending && step === 'email'}>
            <span>Continue</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Button>
        </form>
      </div>

      {/* ── Step 2 — Password ── */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          step === 'password'
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none absolute inset-0 translate-x-8 opacity-0'
        }`}
      >
        <form onSubmit={handlePasswordSubmit} noValidate className="flex flex-col gap-5">
          <FormError message={step === 'password' ? error : undefined} />

          {/* Confirmed email chip */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {email[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="truncate text-sm font-medium text-gray-800">{email}</span>
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="ml-2 shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Change
            </button>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <a href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>
            <input
              ref={passwordRef}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onBlur={() => setPasswordTouched(true)}
              aria-describedby={passwordError ? 'password-error' : undefined}
              aria-invalid={Boolean(passwordError)}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-150 focus:ring-4 ${
                passwordError
                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-500/10'
                  : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/10'
              }`}
            />
            {passwordError && (
              <FieldError id="password-error" message={passwordError} />
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 accent-blue-600"
            />
            <label htmlFor="remember" className="cursor-pointer text-sm text-gray-600">
              Remember me for 30 days
            </label>
          </div>

          <Button type="submit" loading={isPending && step === 'password'}>
            Sign in
          </Button>
        </form>
      </div>

    </div>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1 text-xs text-red-500">
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm0 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm-.5-5.5a.5.5 0 0 1 1 0V7a.5.5 0 0 1-1 0V4.5zm.5 4a.625.625 0 1 1 0-1.25A.625.625 0 0 1 6 8.5z" />
      </svg>
      {message}
    </p>
  )
}
