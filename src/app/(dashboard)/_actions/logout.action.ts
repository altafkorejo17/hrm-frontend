'use server'

import { redirect } from 'next/navigation'
import { clearAuthCookies, getAccessToken } from '@/lib/auth/session'
import { logoutApi } from '@/lib/auth/auth.api'

export async function logoutAction() {
  const accessToken = await getAccessToken()
  if (accessToken) await logoutApi(accessToken)
  await clearAuthCookies()
  redirect('/login')
}
