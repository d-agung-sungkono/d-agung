import 'server-only'

import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import { cookies, headers } from 'next/headers'

import { query } from '@/lib/db'

const SESSION_COOKIE = 'agung_os_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

type AuthUserRow = {
  id: string
  username: string
  password_hash: string
  status: 'active' | 'disabled'
}

type DbSessionRow = {
  session_id: string
  user_id: string
  username: string
  display_name: string
  expires_at: string
}

type OsSession = {
  displayName: string
  expiresAt: string
  sessionId: string
  userId: string
  username: string
}

type RequestMetadata = {
  ipAddress: string | null
  userAgent: string | null
}

function getSessionSecret() {
  return process.env.OS_SESSION_SECRET ?? 'development-secret'
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(`${token}.${getSessionSecret()}`).digest('hex')
}

async function getRequestMetadata(): Promise<RequestMetadata> {
  const headerStore = await headers()
  const forwardedFor = headerStore.get('x-forwarded-for')
  const realIp = headerStore.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || null
  const userAgent = headerStore.get('user-agent')

  return { ipAddress, userAgent }
}

async function logLoginAttempt({
  failureReason = null,
  sessionId = null,
  success,
  userId = null,
  usernameAttempted,
}: {
  failureReason?: string | null
  sessionId?: string | null
  success: boolean
  userId?: string | null
  usernameAttempted: string
}) {
  const { ipAddress, userAgent } = await getRequestMetadata()

  await query(
    `
      INSERT INTO os_login_logs (
        user_id,
        session_id,
        username_attempted,
        success,
        failure_reason,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [userId, sessionId, usernameAttempted, success, failureReason, ipAddress, userAgent]
  )
}

export async function validateOsCredentials(username: string, password: string) {
  const normalizedUsername = username.trim()

  if (!normalizedUsername || !password) {
    await logLoginAttempt({
      failureReason: 'missing_credentials',
      success: false,
      usernameAttempted: normalizedUsername,
    })
    return null
  }

  const result = await query<AuthUserRow>(
    `
      SELECT id, username, password_hash, status
      FROM os_users
      WHERE username = $1
      LIMIT 1
    `,
    [normalizedUsername]
  )

  const user = result.rows[0]

  if (!user) {
    await logLoginAttempt({
      failureReason: 'user_not_found',
      success: false,
      usernameAttempted: normalizedUsername,
    })
    return null
  }

  if (user.status !== 'active') {
    await logLoginAttempt({
      failureReason: 'user_disabled',
      success: false,
      userId: user.id,
      usernameAttempted: normalizedUsername,
    })
    return null
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash)

  if (!isValidPassword) {
    await logLoginAttempt({
      failureReason: 'invalid_password',
      success: false,
      userId: user.id,
      usernameAttempted: normalizedUsername,
    })
    return null
  }

  return { id: user.id, username: user.username }
}

export async function createOsSession(user: { id: string; username: string }) {
  const cookieStore = await cookies()
  const { ipAddress, userAgent } = await getRequestMetadata()
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)

  const result = await query<{ id: string }>(
    `
      INSERT INTO os_user_sessions (
        user_id,
        token_hash,
        expires_at,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [user.id, tokenHash, expiresAt.toISOString(), ipAddress, userAgent]
  )

  await logLoginAttempt({
    sessionId: result.rows[0]?.id ?? null,
    success: true,
    userId: user.id,
    usernameAttempted: user.username,
  })

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/os',
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export async function clearOsSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await query(
      `
        UPDATE os_user_sessions
        SET
          revoked_at = COALESCE(revoked_at, now()),
          last_seen_at = now()
        WHERE token_hash = $1
      `,
      [hashSessionToken(token)]
    ).catch(() => null)
  }

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

  const tokenHash = hashSessionToken(cookie.value)
  const result = await query<DbSessionRow>(
    `
      SELECT
        s.id AS session_id,
        u.id AS user_id,
        u.username,
        u.display_name,
        s.expires_at
      FROM os_user_sessions s
      INNER JOIN os_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.status = 'active'
      LIMIT 1
    `,
    [tokenHash]
  )

  const session = result.rows[0]

  if (!session) {
    await clearOsSession()
    return null
  }

  await query(
    `
      UPDATE os_user_sessions
      SET last_seen_at = now()
      WHERE id = $1
    `,
    [session.session_id]
  ).catch(() => null)

  return {
    displayName: session.display_name,
    expiresAt: session.expires_at,
    sessionId: session.session_id,
    userId: session.user_id,
    username: session.username,
  } satisfies OsSession
}
