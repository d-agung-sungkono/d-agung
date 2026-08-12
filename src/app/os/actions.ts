'use server'

import { redirect } from 'next/navigation'

import { clearOsSession, createOsSession, validateOsCredentials } from '@/lib/os-auth'

export async function loginToOs(formData: FormData) {
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')
  const user = await validateOsCredentials(username, password)

  if (!user) {
    redirect('/os/login?error=invalid')
  }

  await createOsSession(user)
  redirect('/os')
}

export async function logoutFromOs() {
  await clearOsSession()
  redirect('/os/login')
}
