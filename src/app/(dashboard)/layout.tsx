import { getSessionUser } from '@/lib/auth/session'
import { Sidebar } from './_components/Sidebar'
import { Header }  from './_components/Header'
import { Footer }  from './_components/Footer'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Fixed sidebar */}
      <Sidebar user={user} />

      {/* Main column: header → scrollable content → footer */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        <Footer />
      </div>

    </div>
  )
}
