import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import DashboardPage from './(app)/page'

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <DashboardPage />
}
