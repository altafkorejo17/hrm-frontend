const YEAR = new Date().getFullYear()

const links = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use',   href: '/terms' },
  { label: 'Support',        href: '/support' },
  { label: 'Docs',           href: '/docs' },
]

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 lg:px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">

        {/* Left — copyright + version */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>© {YEAR} HRM Platform</span>
          <span className="h-3 w-px bg-gray-200" />
          <span>v1.0.0</span>
          <span className="h-3 w-px bg-gray-200" />
          <span>All rights reserved</span>
        </div>

        {/* Right — status + links */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            All systems operational
          </span>

          <div className="hidden h-3 w-px bg-gray-200 sm:block" />

          <nav className="hidden items-center gap-3 sm:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs text-gray-400 transition-colors hover:text-gray-600"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

      </div>
    </footer>
  )
}
