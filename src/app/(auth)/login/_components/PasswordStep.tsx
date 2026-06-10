import { type RefObject } from 'react'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { FieldError } from './FieldError'

type Props = {
  email: string
  password: string
  passwordError: string
  serverError: string
  isPending: boolean
  passwordRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onBlur: () => void
  onSubmit: (e: { preventDefault(): void }) => void
  onBack: () => void
}

export function PasswordStep({
  email,
  password,
  passwordError,
  serverError,
  isPending,
  passwordRef,
  onChange,
  onBlur,
  onSubmit,
  onBack,
}: Props) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormError message={serverError} />

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
          onClick={onBack}
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
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-describedby={passwordError ? 'password-error' : undefined}
          aria-invalid={Boolean(passwordError)}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-150 focus:ring-4 ${
            passwordError
              ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-500/10'
              : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/10'
          }`}
        />
        {passwordError && <FieldError id="password-error" message={passwordError} />}
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

      <Button type="submit" loading={isPending}>
        Sign in
      </Button>
    </form>
  )
}
