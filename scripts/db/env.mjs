import fs from 'node:fs'
import path from 'node:path'

export function loadEnvFile(file = '.env.local') {
  const envPath = path.resolve(process.cwd(), file)

  if (!fs.existsSync(envPath)) {
    return
  }

  const content = fs.readFileSync(envPath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex)
    let value = trimmed.slice(separatorIndex + 1)
    value = value.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

export function getPgSslConfig() {
  const sslMode = process.env.PGSSLMODE

  if (!sslMode || sslMode === 'disable') {
    return undefined
  }

  return { rejectUnauthorized: false }
}
