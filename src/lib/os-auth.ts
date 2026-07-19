import 'server-only'

import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'agung_os_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

type SessionPayload = {
  username: string
  expiresAt: number
}

function getCredentials() {
  return {
    username: process.env.OS_USERNAME ?? 'd.agung',
    password: process.env.OS_PASSWORD ?? 'mudaberkarya',
    secret: process.env.OS_SESSION_SECRET ?? 'development-secret',
  }
}

function sign(value: string) {
  return createHmac('sha256', getCredentials().secret).update(value).digest('base64url')
}

function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${body}.${sign(body)}`
}

function verifySession(value: string): SessionPayload | null {
  const [body, signature] = value.split('.')

  if (!body || !signature) {
    return null
  }

  const expectedSignature = sign(body)
  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload

    if (!payload.username || payload.expiresAt < Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function validateOsCredentials(username: string, password: string) {
  const credentials = getCredentials()
  return username === credentials.username && password === credentials.password
}

export async function createOsSession(username: string) {
  const cookieStore = await cookies()
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000

  cookieStore.set({
    name: SESSION_COOKIE,
    value: encodeSession({ username, expiresAt }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/os',
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export async function clearOsSession() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/os',
    maxAge: 0,
  })
}

export async function getOsSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_COOKIE)

  if (!cookie?.value) {
    return null
  }

  return verifySession(cookie.value)
}
