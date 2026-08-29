import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Card, Text, Title } from '@mantine/core'

import LoginForm from '@/components/os/login-form'
import styles from '@/components/os/os-shell.module.css'
import { getOsSession } from '@/lib/os-auth'

export const metadata: Metadata = {
  title: 'Login | Agung OS',
}

export default async function LoginPage() {
  const session = await getOsSession()

  if (session) {
    redirect('/os')
  }

  return (
    <main className={styles.loginPage}>
      <Card component="section" className={styles.loginCard} aria-labelledby="login-title" padding="lg" radius="md" withBorder>
        <Text className={styles.eyebrow}>Private Area</Text>
        <Title className={styles.loginTitle} id="login-title" order={1}>
          Agung OS
        </Title>
        <Text className={styles.muted}>Sign in to continue to the personal operating system.</Text>

        <LoginForm />
      </Card>
    </main>
  )
}
