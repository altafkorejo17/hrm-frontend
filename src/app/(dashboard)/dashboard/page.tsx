import type { Metadata } from 'next'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Dashboard' }

// ── Static data (replace with real API calls) ─────────────────────────────────

const stats = [
  {
    label: 'Total Employees',
    value: '248',
    change: '+12 this month',
    up: true,
    color: 'blue',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    ),
  },
  {
    label: 'Active Today',
    value: '186',
    change: '75% attendance',
    up: true,
    color: 'emerald',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    ),
  },
  {
    label: 'On Leave',
    value: '14',
    change: '+3 from yesterday',
    up: false,
    color: 'amber',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    ),
  },
  {
    label: 'Open Positions',
    value: '7',
    change: '3 urgent',
    up: false,
    color: 'violet',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    ),
  },
]

const quickActions = [
  { label: 'Add Employee',    href: '/employees/new',   color: 'blue',    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /> },
  { label: 'Run Payroll',     href: '/payroll/run',     color: 'emerald', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /> },
  { label: 'Approve Leave',   href: '/leave/pending',   color: 'amber',   icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /> },
  { label: 'New Department',  href: '/departments/new', color: 'violet',  icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /> },
]

const activity = [
  { label: 'Sarah Johnson joined the Engineering team',      time: '2 min ago',  type: 'join' },
  { label: 'Michael Chen submitted a leave request',         time: '18 min ago', type: 'leave' },
  { label: 'March payroll processed — $124,500 disbursed',   time: '1 hr ago',   type: 'payroll' },
  { label: 'Performance review cycle started for Q1',        time: '3 hr ago',   type: 'review' },
  { label: 'Emma Wilson promoted to Senior Developer',       time: '5 hr ago',   type: 'promote' },
  { label: 'IT Department budget updated',                    time: 'Yesterday',  type: 'update' },
]

const activityDot: Record<string, string> = {
  join:    'bg-emerald-400',
  leave:   'bg-amber-400',
  payroll: 'bg-blue-400',
  review:  'bg-violet-400',
  promote: 'bg-pink-400',
  update:  'bg-gray-400',
}

const statColors: Record<string, { bg: string; icon: string; badge: string }> = {
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
  violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  badge: 'bg-violet-100 text-violet-700' },
}

const actionColors: Record<string, string> = {
  blue:    'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
  emerald: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
  amber:   'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
  violet:  'text-violet-600 bg-violet-50 group-hover:bg-violet-600 group-hover:text-white',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getSessionUser()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}{user ? `, ${user.firstName}` : ''}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening with your team today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const c = statColors[s.color]
          return (
            <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm shadow-gray-100 ring-1 ring-gray-100">
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg}`}>
                  <svg className={`h-5 w-5 ${c.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {s.icon}
                  </svg>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.badge}`}>
                  {s.up
                    ? <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
                    : <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>
                  }
                  {s.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                <p className="mt-0.5 text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Lower grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Quick actions — 2/5 */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm shadow-gray-100 ring-1 ring-gray-100 h-full">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group flex flex-col items-center gap-2.5 rounded-xl p-4 text-center ring-1 ring-gray-100 transition-all duration-150 hover:shadow-sm hover:ring-gray-200"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${actionColors[a.color]}`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      {a.icon}
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity — 3/5 */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm shadow-gray-100 ring-1 ring-gray-100 h-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
              <Link href="/activity" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>

            <ul className="space-y-1">
              {activity.map((item, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50">
                  <div className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center">
                    <span className={`h-2 w-2 rounded-full ${activityDot[item.type]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 leading-snug">{item.label}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* ── Dept headcount bar ── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm shadow-gray-100 ring-1 ring-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Headcount by Department</h2>
          <Link href="/departments" className="text-xs font-medium text-blue-600 hover:text-blue-700">
            Manage →
          </Link>
        </div>

        <div className="space-y-3">
          {[
            { dept: 'Engineering',  count: 82,  total: 248, color: 'bg-blue-500' },
            { dept: 'Sales',        count: 54,  total: 248, color: 'bg-emerald-500' },
            { dept: 'Marketing',    count: 38,  total: 248, color: 'bg-violet-500' },
            { dept: 'Operations',   count: 44,  total: 248, color: 'bg-amber-500' },
            { dept: 'HR & Admin',   count: 30,  total: 248, color: 'bg-pink-500' },
          ].map((d) => (
            <div key={d.dept} className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-sm text-gray-600">{d.dept}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2">
                <div
                  className={`h-2 rounded-full ${d.color} transition-all duration-500`}
                  style={{ width: `${(d.count / d.total) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-medium text-gray-700">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
