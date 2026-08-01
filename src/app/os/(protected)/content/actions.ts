'use server'

import { revalidatePath } from 'next/cache'

import { query } from '@/lib/db'
import { scrapeContentLink, type ScrapedContentResult } from '@/lib/os-content-scraper'
import { getOsUserId } from '@/lib/os-settings'

function nullableValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function normalizeJakartaDateTime(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return ''
  }

  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) {
    return normalized
  }

  return `${normalized}:00+07:00`
}

function nullableTime(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return null
  }

  return normalized.length === 5 ? `${normalized}:00` : normalized
}

function positiveInteger(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function revalidateContent() {
  revalidatePath('/os')
  revalidatePath('/os/content')
  revalidatePath('/os/today')
}

function buildScrapedMetadata(formData: FormData, fallbackUrl: string) {
  const scrapedAt = nullableValue(formData.get('scrapedAt'))

  if (!scrapedAt) {
    return {}
  }

  return {
    scrape: {
      canonicalUrl: fallbackUrl,
      description: nullableValue(formData.get('scrapeDescription')),
      image: nullableValue(formData.get('scrapeImage')),
      scrapedAt,
      siteName: nullableValue(formData.get('scrapeSiteName')),
      sourceUrl: nullableValue(formData.get('sourceUrl')) ?? fallbackUrl,
      title: String(formData.get('title') ?? '').trim(),
    },
  }
}

export async function scrapeContentPostLink(formData: FormData): Promise<ScrapedContentResult> {
  return scrapeContentLink(String(formData.get('url') ?? '').trim())
}

export async function createContentPost(formData: FormData) {
  const userId = await getOsUserId()
  const userSocmedId = nullableValue(formData.get('userSocmedId'))
  const url = String(formData.get('url') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const scheduledAt = normalizeJakartaDateTime(formData.get('scheduledAt'))
  const status = String(formData.get('status') ?? 'draft')
  const notes = nullableValue(formData.get('notes'))

  if (!userSocmedId || !url || !title || !scheduledAt) {
    throw new Error('Account, content link, title, and schedule are required.')
  }

  await query(
    `
      INSERT INTO content_posts (
        user_id,
        user_socmed_id,
        source_key,
        title,
        url,
        scheduled_at,
        published_at,
        status,
        notes,
        metadata
      )
      VALUES ($1, $2, gen_random_uuid()::text, $3, $4, $5, CASE WHEN $6 = 'published' THEN $5::timestamptz ELSE NULL END, $6, $7, $8::jsonb)
    `,
    [
      userId,
      userSocmedId,
      title,
      url,
      scheduledAt,
      status,
      notes,
      JSON.stringify(buildScrapedMetadata(formData, url)),
    ]
  )

  revalidateContent()
}

export async function updateContentPost(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')
  const userSocmedId = nullableValue(formData.get('userSocmedId'))
  const url = String(formData.get('url') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const scheduledAt = normalizeJakartaDateTime(formData.get('scheduledAt'))
  const status = String(formData.get('status') ?? 'draft')
  const notes = nullableValue(formData.get('notes'))

  if (!id || !userSocmedId || !url || !title || !scheduledAt) {
    throw new Error('id, account, content link, title, and schedule are required.')
  }

  const metadata = buildScrapedMetadata(formData, url)

  await query(
    `
      UPDATE content_posts
      SET
        user_socmed_id = $1,
        title = $2,
        url = $3,
        scheduled_at = $4,
        published_at = CASE WHEN $5 = 'published' THEN COALESCE(published_at, $4::timestamptz) ELSE NULL END,
        status = $5,
        notes = $6,
        metadata = CASE WHEN $7::jsonb = '{}'::jsonb THEN metadata ELSE metadata || $7::jsonb END,
        updated_at = now()
      WHERE id = $8
        AND user_id = $9
    `,
    [
      userSocmedId,
      title,
      url,
      scheduledAt,
      status,
      notes,
      JSON.stringify(metadata),
      id,
      userId,
    ]
  )

  revalidateContent()
}

export async function deleteContentPost(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')

  if (!id) {
    throw new Error('id is required.')
  }

  await query('DELETE FROM content_posts WHERE id = $1 AND user_id = $2', [id, userId])
  revalidateContent()
}

export async function createContentTarget(formData: FormData) {
  const userId = await getOsUserId()
  const userSocmedId = nullableValue(formData.get('userSocmedId'))
  const name = String(formData.get('name') ?? '').trim()
  const cadenceDays = positiveInteger(formData.get('cadenceDays'), 1)
  const startDate = String(formData.get('startDate') ?? '').trim()
  const preferredTime = nullableTime(formData.get('preferredTime'))
  const status = String(formData.get('status') ?? 'active')
  const notes = nullableValue(formData.get('notes'))

  if (!userSocmedId || !name || !startDate) {
    throw new Error('Account, name, and start date are required.')
  }

  await query(
    `
      INSERT INTO content_targets (
        user_id,
        user_socmed_id,
        name,
        cadence_days,
        start_date,
        preferred_time,
        timezone,
        status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Asia/Jakarta', $7, $8)
    `,
    [userId, userSocmedId, name, cadenceDays, startDate, preferredTime, status, notes]
  )

  revalidateContent()
}

export async function updateContentTarget(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '').trim()
  const userSocmedId = nullableValue(formData.get('userSocmedId'))
  const name = String(formData.get('name') ?? '').trim()
  const cadenceDays = positiveInteger(formData.get('cadenceDays'), 1)
  const startDate = String(formData.get('startDate') ?? '').trim()
  const preferredTime = nullableTime(formData.get('preferredTime'))
  const status = String(formData.get('status') ?? 'active')
  const notes = nullableValue(formData.get('notes'))

  if (!id || !userSocmedId || !name || !startDate) {
    throw new Error('id, account, name, and start date are required.')
  }

  await query(
    `
      UPDATE content_targets
      SET
        user_socmed_id = $1,
        name = $2,
        cadence_days = $3,
        start_date = $4,
        preferred_time = $5,
        status = $6,
        notes = $7,
        updated_at = now()
      WHERE id = $8
        AND user_id = $9
    `,
    [userSocmedId, name, cadenceDays, startDate, preferredTime, status, notes, id, userId]
  )

  revalidateContent()
}

export async function deleteContentTarget(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    throw new Error('id is required.')
  }

  await query('DELETE FROM content_targets WHERE id = $1 AND user_id = $2', [id, userId])
  revalidateContent()
}
