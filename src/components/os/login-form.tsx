'use client'

import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useActionState, useState } from 'react'

import { loginToOs } from '@/app/os/actions'

import styles from './os-shell.module.css'

const initialState = {
  error: null,
}

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginToOs, initialState)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <>
      {state.error === 'invalid' ? (
        <Alert className={styles.error} color="red" role="alert" variant="light">
          Username or password is incorrect.
        </Alert>
      ) : null}

      <form action={formAction} className={styles.loginForm}>
        <Stack gap="sm">
          <TextInput
            autoComplete="username"
            label="Username"
            name="username"
            onChange={(event) => setUsername(event.currentTarget.value)}
            required
            type="text"
            value={username}
          />
          <PasswordInput
            autoComplete="current-password"
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            value={password}
          />
          <Button loading={isPending} type="submit">
            Login
          </Button>
        </Stack>
      </form>
    </>
  )
}
