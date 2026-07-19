import 'server-only'

import pg from 'pg'

const { Pool } = pg

declare global {
  var agungOsPool: pg.Pool | undefined
}

function getSslConfig() {
  const sslMode = process.env.PGSSLMODE

  if (!sslMode || sslMode === 'disable') {
    return undefined
  }

  return { rejectUnauthorized: false }
}

export function getDbPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.')
  }

  globalThis.agungOsPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    idleTimeoutMillis: 10_000,
    max: 5,
    ssl: getSslConfig(),
  })

  return globalThis.agungOsPool
}

function isRetryableConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const errorWithCode = error as Error & { code?: string }
  return (
    errorWithCode.code === 'ECONNRESET' ||
    errorWithCode.code === 'ETIMEDOUT' ||
    error.message.includes('Connection terminated') ||
    error.message.includes('read ECONNRESET')
  )
}

async function resetDbPool() {
  const pool = globalThis.agungOsPool
  globalThis.agungOsPool = undefined

  if (pool) {
    await pool.end().catch(() => undefined)
  }
}

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  try {
    return await getDbPool().query<T>(text, params)
  } catch (error) {
    if (!isRetryableConnectionError(error)) {
      throw error
    }

    await resetDbPool()
    return getDbPool().query<T>(text, params)
  }
}
