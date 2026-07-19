'use server'

import { redirect } from 'next/navigation'

import { clearOsSession, createOsSession, validateOsCredentials } from '@/lib/os-auth'

export async function loginToOs(formData: FormData) {
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!validateOsCredentials(username, password)) {
    redirect('/os/login?error=invalid')
  }

  await createOsSession(username)
  redirect('/os')
}

export async function logoutFromOs() {
  await clearOsSession()
  redirect('/os/login')
}
