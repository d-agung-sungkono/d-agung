import 'server-only'

import { query } from '@/lib/db'

export type SocmedOption = {
  id: string
  name: string
}

export type AccountGroupOption = {
  description: string | null
  id: string
  name: string
  slug: string
  sortOrder: number
  status: string
}

export type UserSocmed = {
  id: string
  socmedId: string
  accountGroupId: string | null
  platform: string
  account: string
  label: string
  url: string
  linkedEmail: string | null
  linkedWhatsapp: string | null
  status: string
  groupName: string | null
}

type UserRow = {
  id: string
}

type AccountGroupRow = {
  description: string | null
  id: string
  name: string
  slug: string
  sort_order: number
  status: string
}

type UserSocmedRow = {
  id: string
  socmed_id: string
  account_group_id: string | null
  platform: string
  account: string
  label: string
  url: string
  linked_email: string | null
  linked_whatsapp: string | null
  status: string
  group_name: string | null
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
  const [socmedsResult, groupsResult, userSocmedsResult] = await Promise.all([
    query<SocmedOption>('SELECT id, name FROM socmeds WHERE status = $1 ORDER BY sort_order, name', ['active']),
    query<AccountGroupRow>(
      `
        SELECT id, name, slug, description, status, sort_order
        FROM account_groups
        WHERE user_id = $1
        ORDER BY sort_order, name
      `,
      [userId]
    ),
    query<UserSocmedRow>(
      `
        SELECT
          us.id,
          us.socmed_id,
          us.account_group_id,
          s.name AS platform,
          us.account,
          us.label,
          us.url,
          us.linked_email,
          us.linked_whatsapp,
          us.status,
          ag.name AS group_name
        FROM user_socmeds us
        INNER JOIN socmeds s ON s.id = us.socmed_id
        LEFT JOIN account_groups ag ON ag.id = us.account_group_id
        WHERE us.user_id = $1
        ORDER BY us.sort_order, s.name, us.account
      `,
      [userId]
    ),
  ])

  return {
    groups: groupsResult.rows.map((row) => ({
      description: row.description,
      id: row.id,
      name: row.name,
      slug: row.slug,
      sortOrder: row.sort_order,
      status: row.status,
    })),
    socmeds: socmedsResult.rows,
    userSocmeds: userSocmedsResult.rows.map((row) => ({
      account: row.account,
      accountGroupId: row.account_group_id,
      groupName: row.group_name,
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
