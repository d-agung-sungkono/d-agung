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
    ssl: getSslConfig(),
  })

  return globalThis.agungOsPool
}

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  return getDbPool().query<T>(text, params)
}
