import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import bcrypt from 'bcryptjs'
import pg from 'pg'

import { getPgSslConfig, loadEnvFile } from './env.mjs'

const { Client } = pg

loadEnvFile()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const username = process.env.OS_USERNAME ?? 'd.agung'
const password = process.env.OS_PASSWORD ?? 'mudaberkarya'
const displayName = 'Agung'
const passwordHash = await bcrypt.hash(password, 12)

const profilesPath = path.resolve(process.cwd(), 'src/data/os/profiles.json')
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8')).filter((profile) => profile.platform !== 'YouTube')

const socmedSeeds = [
  { name: 'TikTok', slug: 'tiktok', baseUrl: 'https://www.tiktok.com' },
  { name: 'Instagram', slug: 'instagram', baseUrl: 'https://www.instagram.com' },
  { name: 'Threads', slug: 'threads', baseUrl: 'https://www.threads.net' },
  { name: 'Facebook', slug: 'facebook', baseUrl: 'https://www.facebook.com' },
  { name: 'LinkedIn', slug: 'linkedin', baseUrl: 'https://www.linkedin.com' },
  { name: 'X', slug: 'x', baseUrl: 'https://x.com' },
  { name: 'Shopee', slug: 'shopee', baseUrl: 'https://shopee.co.id' },
]

const groupSeeds = [
  {
    description: 'Affiliate and commerce accounts for product discovery and conversion experiments.',
    name: 'Agung Affiliate',
    slug: 'agung-affiliate',
  },
  {
    description: 'Branding and distribution accounts for personal brand, professional, and AMB channels.',
    name: 'Agung Branding',
    slug: 'agung-branding',
  },
  {
    description: 'Do-it niche account cluster.',
    name: 'Agung Do-It',
    slug: 'agung-do-it',
  },
]

function getGroupSlug(profile) {
  if (profile.label === 'Keranjang Diskon') {
    return 'agung-affiliate'
  }

  if (profile.label === 'Do-it') {
    return 'agung-do-it'
  }

  return 'agung-branding'
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: getPgSslConfig(),
})

await client.connect()

try {
  await client.query('BEGIN')

  const userResult = await client.query(
    `
      INSERT INTO os_users (username, password_hash, display_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name,
        updated_at = now()
      RETURNING id
    `,
    [username, passwordHash, displayName]
  )

  const userId = userResult.rows[0].id
  const socmedIds = new Map()
  const groupIds = new Map()

  for (const [index, socmed] of socmedSeeds.entries()) {
    const result = await client.query(
      `
        INSERT INTO socmeds (name, slug, base_url, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug)
        DO UPDATE SET
          name = EXCLUDED.name,
          base_url = EXCLUDED.base_url,
          sort_order = EXCLUDED.sort_order,
          updated_at = now()
        RETURNING id
      `,
      [socmed.name, socmed.slug, socmed.baseUrl, index]
    )

    socmedIds.set(socmed.name, result.rows[0].id)
  }

  for (const [index, group] of groupSeeds.entries()) {
    const result = await client.query(
      `
        INSERT INTO account_groups (user_id, name, slug, description, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, slug)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          sort_order = EXCLUDED.sort_order,
          updated_at = now()
        RETURNING id
      `,
      [userId, group.name, group.slug, group.description, index]
    )

    groupIds.set(group.slug, result.rows[0].id)
  }

  for (const [index, profile] of profiles.entries()) {
    const socmedId = socmedIds.get(profile.platform)
    const groupId = groupIds.get(getGroupSlug(profile))

    if (!socmedId) {
      continue
    }

    await client.query(
      `
        INSERT INTO user_socmeds (
          user_id,
          socmed_id,
          account_group_id,
          account,
          label,
          url,
          linked_email,
          linked_whatsapp,
          status,
          sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, $8)
        ON CONFLICT (user_id, socmed_id, account)
        DO UPDATE SET
          account_group_id = EXCLUDED.account_group_id,
          label = EXCLUDED.label,
          url = EXCLUDED.url,
          linked_email = EXCLUDED.linked_email,
          linked_whatsapp = EXCLUDED.linked_whatsapp,
          status = EXCLUDED.status,
          sort_order = EXCLUDED.sort_order,
          updated_at = now()
      `,
      [userId, socmedId, groupId, profile.account, profile.label, profile.url, profile.status, index]
    )
  }

  await client.query('COMMIT')
  console.log(`seeded OS user ${username}, ${socmedSeeds.length} socmeds, ${groupSeeds.length} groups, and ${profiles.length} user socmeds`)
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  await client.end()
}
