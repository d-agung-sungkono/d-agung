import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

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
      <section className={styles.loginCard} aria-labelledby="login-title">
        <p className={styles.eyebrow}>Private Area</p>
        <h1 className={styles.loginTitle} id="login-title">
          Agung OS
        </h1>
        <p className={styles.muted}>Sign in to continue to the personal operating system.</p>

        {hasError ? (
          <p className={styles.error} role="alert">
            Username or password is incorrect.
          </p>
        ) : null}

        <form action={loginToOs} className={styles.loginForm}>
          <label className={styles.field} htmlFor="username">
            <span className={styles.label}>Username</span>
            <input
              autoComplete="username"
              className={styles.input}
              id="username"
              name="username"
              required
              type="text"
            />
          </label>

          <label className={styles.field} htmlFor="password">
            <span className={styles.label}>Password</span>
            <input
              autoComplete="current-password"
              className={styles.input}
              id="password"
              name="password"
              required
              type="password"
            />
          </label>

          <button className={styles.primaryButton} type="submit">
            Login
          </button>
        </form>
      </section>
    </main>
  )
}
