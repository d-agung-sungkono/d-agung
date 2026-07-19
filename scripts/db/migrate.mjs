import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

import { getPgSslConfig, loadEnvFile } from './env.mjs'

const { Client } = pg

loadEnvFile()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: getPgSslConfig(),
})

const migrationsDir = path.resolve(process.cwd(), 'db/migrations')
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

await client.connect()

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  for (const file of migrationFiles) {
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file])

    if (applied.rowCount) {
      console.log(`skip ${file}`)
      continue
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`apply ${file}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
} finally {
  await client.end()
}
