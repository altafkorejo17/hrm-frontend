export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1 text-xs text-red-500">
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm0 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm-.5-5.5a.5.5 0 0 1 1 0V7a.5.5 0 0 1-1 0V4.5zm.5 4a.625.625 0 1 1 0-1.25A.625.625 0 0 1 6 8.5z" />
      </svg>
      {message}
    </p>
  )
}
