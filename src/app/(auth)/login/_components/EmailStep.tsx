import { type RefObject } from 'react'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { FieldError } from './FieldError'

type Props = {
  email: string
  emailError: string
  serverError: string
  isPending: boolean
  emailRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onBlur: () => void
  onSubmit: (e: { preventDefault(): void }) => void
}

export function EmailStep({
  email,
  emailError,
  serverError,
  isPending,
  emailRef,
  onChange,
  onBlur,
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormError message={serverError} />

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
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-describedby={emailError ? 'email-error' : undefined}
          aria-invalid={Boolean(emailError)}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-150 focus:ring-4 ${
            emailError
              ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-500/10'
              : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/10'
          }`}
        />
        {emailError && <FieldError id="email-error" message={emailError} />}
      </div>

      <Button type="submit" loading={isPending}>
        <span>Continue</span>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Button>
    </form>
  )
}
