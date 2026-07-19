import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Alert, Button, Card, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'

import { loginToOs } from '@/app/os/actions'
import styles from '@/components/os/os-shell.module.css'
import { getOsSession } from '@/lib/os-auth'

export const metadata: Metadata = {
  title: 'Login | Agung OS',
}

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getOsSession()

  if (session) {
    redirect('/os')
  }

  const params = await searchParams
  const hasError = params?.error === 'invalid'

  return (
    <main className={styles.loginPage}>
      <Card component="section" className={styles.loginCard} aria-labelledby="login-title" padding="lg" radius="md" withBorder>
        <Text className={styles.eyebrow}>Private Area</Text>
        <Title className={styles.loginTitle} id="login-title" order={1}>
          Agung OS
        </Title>
        <Text className={styles.muted}>Sign in to continue to the personal operating system.</Text>

        {hasError ? (
          <Alert className={styles.error} color="red" role="alert" variant="light">
            Username or password is incorrect.
          </Alert>
        ) : null}

        <form action={loginToOs} className={styles.loginForm}>
          <Stack gap="sm">
            <TextInput autoComplete="username" label="Username" name="username" required type="text" />
            <PasswordInput autoComplete="current-password" label="Password" name="password" required />
            <Button type="submit">
              Login
            </Button>
          </Stack>
        </form>
      </Card>
    </main>
  )
}
