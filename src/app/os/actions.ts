'use server'

import { redirect } from 'next/navigation'

import { clearOsSession, createOsSession, validateOsCredentials } from '@/lib/os-auth'

type LoginState = {
  error: 'invalid' | null
}

export async function loginToOs(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')
  const user = await validateOsCredentials(username, password)

  if (!user) {
    return { error: 'invalid' }
  }

  await createOsSession(user)
  redirect('/os')
}

export async function logoutFromOs() {
  await clearOsSession()
  redirect('/os/login')
}
