import 'server-only'

import { query } from '@/lib/db'

export type SocmedOption = {
  id: string
  name: string
}

export type BrandOption = {
  id: string
  name: string
  status: string
}

export type UserSocmed = {
  brandIds: string[]
  brandNames: string[]
  id: string
  socmedId: string
  platform: string
  account: string
  label: string
  url: string
  linkedEmail: string | null
  linkedWhatsapp: string | null
  status: string
}

type UserRow = {
  id: string
}

type BrandRow = {
  id: string
  name: string
  status: string
}

type UserSocmedRow = {
  brand_ids: string[] | null
  brand_names: string[] | null
  id: string
  socmed_id: string
  platform: string
  account: string
  label: string
  url: string
  linked_email: string | null
  linked_whatsapp: string | null
  status: string
}

export async function getOsUserId() {
  const username = process.env.OS_USERNAME ?? 'd.agung'
  const result = await query<UserRow>('SELECT id FROM os_users WHERE username = $1 LIMIT 1', [username])
  const user = result.rows[0]

  if (!user) {
    throw new Error(`OS user ${username} is not seeded.`)
  }

  return user.id
}

export async function getSettingsData() {
  const userId = await getOsUserId()
  const [socmedsResult, brandsResult, userSocmedsResult] = await Promise.all([
    query<SocmedOption>('SELECT id, name FROM socmeds WHERE status = $1 ORDER BY sort_order, name', ['active']),
    query<BrandRow>(
      `
        SELECT id, title AS name, status
        FROM os_brands
        WHERE user_id = $1
        ORDER BY
          CASE status
            WHEN 'ACTIVE' THEN 0
            WHEN 'PAUSED' THEN 1
            ELSE 2
          END,
          title
      `,
      [userId]
    ),
    query<UserSocmedRow>(
      `
        SELECT
          us.id,
          us.socmed_id,
          s.name AS platform,
          us.account,
          us.label,
          us.url,
          us.linked_email,
          us.linked_whatsapp,
          us.status,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT b.id), NULL) AS brand_ids,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT b.title), NULL) AS brand_names
        FROM user_socmeds us
        INNER JOIN socmeds s ON s.id = us.socmed_id
        LEFT JOIN os_brand_social_media_accounts rel ON rel.user_socmed_id = us.id
        LEFT JOIN os_brands b ON b.id = rel.brand_id
        WHERE us.user_id = $1
        GROUP BY us.id, s.name
        ORDER BY us.sort_order, s.name, us.account
      `,
      [userId]
    ),
  ])

  return {
    brands: brandsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
    })),
    socmeds: socmedsResult.rows,
    userSocmeds: userSocmedsResult.rows.map((row) => ({
      account: row.account,
      brandIds: row.brand_ids ?? [],
      brandNames: row.brand_names ?? [],
      id: row.id,
      label: row.label,
      linkedEmail: row.linked_email,
      linkedWhatsapp: row.linked_whatsapp,
      platform: row.platform,
      socmedId: row.socmed_id,
      status: row.status,
      url: row.url,
    })),
  }
}
