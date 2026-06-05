import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  errors?: string[]
}

export function Input({ label, errors, id, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={errors?.length ? `${id}-error` : undefined}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-150 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {errors?.length ? (
        <ul id={`${id}-error`} aria-live="polite" className="space-y-0.5">
          {errors.map((e) => (
            <li key={e} className="flex items-center gap-1 text-xs text-red-500">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm0 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm-.5-5.5a.5.5 0 0 1 1 0V7a.5.5 0 0 1-1 0V4.5zm.5 4a.625.625 0 1 1 0-1.25A.625.625 0 0 1 6 8.5z" />
              </svg>
              {e}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
