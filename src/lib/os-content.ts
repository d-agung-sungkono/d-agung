import 'server-only'

import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

export type ContentProfileOption = {
  id: string
  platform: string
  account: string
  label: string
  groupName: string | null
}

export type ContentPost = {
  id: string
  title: string
  userSocmedId: string | null
  platform: string
  account: string
  label: string
  groupName: string | null
  url: string | null
  scheduledAt: string
  publishedAt: string | null
  status: string
  notes: string | null
}

export type ContentTarget = {
  id: string
  name: string
  userSocmedId: string
  platform: string
  account: string
  label: string
  groupName: string | null
  cadenceDays: number
  startDate: string
  preferredTime: string | null
  timezone: string
  status: string
  notes: string | null
  latestPublishedAt: string | null
  nextDueAt: string
}

type ProfileRow = {
  id: string
  platform: string
  account: string
  label: string
  group_name: string | null
}

type ContentPostRow = {
  id: string
  title: string
  user_socmed_id: string | null
  platform: string | null
  account: string | null
  label: string | null
  group_name: string | null
  url: string | null
  scheduled_at: Date
  published_at: Date | null
  status: string
  notes: string | null
}

type ContentTargetRow = {
  id: string
  name: string
  user_socmed_id: string
  platform: string
  account: string
  label: string
  group_name: string | null
  cadence_days: number
  start_date: string
  preferred_time: string | null
  timezone: string
  status: string
  notes: string | null
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function getJakartaDateKey(value: Date | string = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  }).format(value instanceof Date ? value : new Date(value))
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00+07:00`)
  date.setUTCDate(date.getUTCDate() + days)
  return getJakartaDateKey(date)
}

function toJakartaDateTime(dateKey: string, preferredTime: string | null) {
  const time = preferredTime ? preferredTime.slice(0, 5) : '09:00'
  return `${dateKey}T${time}:00+07:00`
}

function getNextDueDate(target: Pick<ContentTarget, 'cadenceDays' | 'preferredTime' | 'startDate'>, latestPublishedAt: string | null) {
  if (!latestPublishedAt) {
    return toJakartaDateTime(target.startDate, target.preferredTime)
  }

  return toJakartaDateTime(addDays(getJakartaDateKey(latestPublishedAt), target.cadenceDays), target.preferredTime)
}

export async function getContentData() {
  const userId = await getOsUserId()
  const [profilesResult, postsResult, targetsResult] = await Promise.all([
    query<ProfileRow>(
      `
        SELECT
          us.id,
          s.name AS platform,
          us.account,
          us.label,
          ag.name AS group_name
        FROM user_socmeds us
        INNER JOIN socmeds s ON s.id = us.socmed_id
        LEFT JOIN account_groups ag ON ag.id = us.account_group_id
        WHERE us.user_id = $1
          AND us.status = 'active'
        ORDER BY ag.sort_order, us.sort_order, s.name, us.account
      `,
      [userId]
    ),
    query<ContentPostRow>(
      `
        SELECT
          cp.id,
          cp.title,
          cp.user_socmed_id,
          s.name AS platform,
          us.account,
          us.label,
          ag.name AS group_name,
          cp.url,
          cp.scheduled_at,
          cp.published_at,
          cp.status,
          cp.notes
        FROM content_posts cp
        LEFT JOIN user_socmeds us ON us.id = cp.user_socmed_id
        LEFT JOIN socmeds s ON s.id = us.socmed_id
        LEFT JOIN account_groups ag ON ag.id = us.account_group_id
        WHERE cp.user_id = $1
        ORDER BY cp.scheduled_at DESC, cp.created_at DESC
      `,
      [userId]
    ),
    query<ContentTargetRow>(
      `
        SELECT
          ct.id,
          ct.name,
          ct.user_socmed_id,
          s.name AS platform,
          us.account,
          us.label,
          ag.name AS group_name,
          ct.cadence_days,
          ct.start_date::text,
          ct.preferred_time::text,
          ct.timezone,
          ct.status,
          ct.notes
        FROM content_targets ct
        INNER JOIN user_socmeds us ON us.id = ct.user_socmed_id
        INNER JOIN socmeds s ON s.id = us.socmed_id
        LEFT JOIN account_groups ag ON ag.id = us.account_group_id
        WHERE ct.user_id = $1
        ORDER BY ct.status, ct.start_date, ct.name
      `,
      [userId]
    ),
  ])

  const posts = postsResult.rows.map((row) => ({
    account: row.account ?? '-',
    groupName: row.group_name,
    id: row.id,
    label: row.label ?? 'Unmapped Account',
    notes: row.notes,
    platform: row.platform ?? 'Unmapped',
    publishedAt: row.published_at ? toIsoString(row.published_at) : null,
    scheduledAt: toIsoString(row.scheduled_at),
    status: row.status,
    title: row.title,
    url: row.url,
    userSocmedId: row.user_socmed_id,
  }))
  const latestPublishedBySocmedId = new Map<string, string>()

  for (const post of posts) {
    if (post.status !== 'published' || !post.publishedAt || !post.userSocmedId) {
      continue
    }

    const current = latestPublishedBySocmedId.get(post.userSocmedId)
    if (!current || new Date(post.publishedAt) > new Date(current)) {
      latestPublishedBySocmedId.set(post.userSocmedId, post.publishedAt)
    }
  }

  return {
    posts,
    profiles: profilesResult.rows.map((row) => ({
      account: row.account,
      groupName: row.group_name,
      id: row.id,
      label: row.label,
      platform: row.platform,
    })),
    targets: targetsResult.rows.map((row) => {
      const target = {
        account: row.account,
        cadenceDays: row.cadence_days,
        groupName: row.group_name,
        id: row.id,
        label: row.label,
        platform: row.platform,
        preferredTime: row.preferred_time,
        startDate: row.start_date,
        status: row.status,
        timezone: row.timezone,
        userSocmedId: row.user_socmed_id,
        name: row.name,
        notes: row.notes,
      }
      const latestPublishedAt = latestPublishedBySocmedId.get(row.user_socmed_id) ?? null

      return {
        ...target,
        latestPublishedAt,
        nextDueAt: getNextDueDate(target, latestPublishedAt),
      }
    }),
  }
}

export async function getContentTargetsDueToday() {
  const { targets } = await getContentData()
  const today = getJakartaDateKey()

  return targets
    .filter((target) => target.status === 'active' && getJakartaDateKey(target.nextDueAt) <= today)
    .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt) || a.name.localeCompare(b.name))
}
