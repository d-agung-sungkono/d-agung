'use server'

import { revalidatePath } from 'next/cache'

import { query } from '@/lib/db'
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

function revalidateContent() {
  revalidatePath('/os')
  revalidatePath('/os/content')
  revalidatePath('/os/today')
}

export async function createContentPost(formData: FormData) {
  const userId = await getOsUserId()
  const userSocmedId = nullableValue(formData.get('userSocmedId'))
  const title = String(formData.get('title') ?? '').trim()
  const url = nullableValue(formData.get('url'))
  const scheduledAt = normalizeJakartaDateTime(formData.get('scheduledAt'))
  const status = String(formData.get('status') ?? 'draft')
  const notes = nullableValue(formData.get('notes'))

  if (!userSocmedId || !title || !scheduledAt) {
    throw new Error('Account, title, and schedule are required.')
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
        notes
      )
      VALUES ($1, $2, gen_random_uuid()::text, $3, $4, $5, CASE WHEN $6 = 'published' THEN $5::timestamptz ELSE NULL END, $6, $7)
    `,
    [userId, userSocmedId, title, url, scheduledAt, status, notes]
  )

  revalidateContent()
}

export async function updateContentPost(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')
  const userSocmedId = nullableValue(formData.get('userSocmedId'))
  const title = String(formData.get('title') ?? '').trim()
  const url = nullableValue(formData.get('url'))
  const scheduledAt = normalizeJakartaDateTime(formData.get('scheduledAt'))
  const status = String(formData.get('status') ?? 'draft')
  const notes = nullableValue(formData.get('notes'))

  if (!id || !userSocmedId || !title || !scheduledAt) {
    throw new Error('id, account, title, and schedule are required.')
  }

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
        updated_at = now()
      WHERE id = $7
        AND user_id = $8
    `,
    [userSocmedId, title, url, scheduledAt, status, notes, id, userId]
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
