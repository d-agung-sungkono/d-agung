'use server'

import { revalidatePath } from 'next/cache'
import type { PoolClient } from 'pg'

import { getDbPool, query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

function nullableValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function revalidateSocmeds() {
  revalidatePath('/os/socmeds')
  revalidatePath('/os/brands')
}

function getBrandIds(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll('brandIds')
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  )
}

async function validateBrandIds(client: PoolClient, userId: string, brandIds: string[]) {
  if (brandIds.length === 0) {
    throw new Error('At least one brand must be selected.')
  }

  const result = await client.query<{ id: string }>(
    `
      SELECT id
      FROM os_brands
      WHERE user_id = $1
        AND id = ANY($2::uuid[])
    `,
    [userId, brandIds]
  )

  if (result.rows.length !== brandIds.length) {
    throw new Error('One or more selected brands are invalid.')
  }
}

export async function createUserSocmed(formData: FormData) {
  const userId = await getOsUserId()
  const socmedId = String(formData.get('socmedId') ?? '')
  const account = String(formData.get('account') ?? '').trim()
  const label = String(formData.get('label') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  const linkedEmail = nullableValue(formData.get('linkedEmail'))
  const linkedWhatsapp = nullableValue(formData.get('linkedWhatsapp'))
  const status = String(formData.get('status') ?? 'active')
  const brandIds = getBrandIds(formData)

  if (!socmedId || !account || !label || !url) {
    throw new Error('socmedId, account, label, and url are required.')
  }

  const pool = getDbPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await validateBrandIds(client, userId, brandIds)

    const insertResult = await client.query<{ id: string }>(
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
          status
        )
        VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [userId, socmedId, account, label, url, linkedEmail, linkedWhatsapp, status]
    )

    const userSocmedId = insertResult.rows[0]?.id

    if (brandIds.length > 0 && userSocmedId) {
      await client.query(
        `
          INSERT INTO os_brand_social_media_accounts (brand_id, user_socmed_id)
          SELECT brand_id, $1
          FROM unnest($2::uuid[]) AS brand_id
          ON CONFLICT (brand_id, user_socmed_id) DO NOTHING
        `,
        [userSocmedId, brandIds]
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  revalidateSocmeds()
}

export async function updateUserSocmed(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')
  const socmedId = String(formData.get('socmedId') ?? '')
  const account = String(formData.get('account') ?? '').trim()
  const label = String(formData.get('label') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  const linkedEmail = nullableValue(formData.get('linkedEmail'))
  const linkedWhatsapp = nullableValue(formData.get('linkedWhatsapp'))
  const status = String(formData.get('status') ?? 'active')
  const brandIds = getBrandIds(formData)

  if (!id || !socmedId || !account || !label || !url) {
    throw new Error('id, socmedId, account, label, and url are required.')
  }

  const pool = getDbPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await validateBrandIds(client, userId, brandIds)

    await client.query(
      `
        UPDATE user_socmeds
        SET
          socmed_id = $1,
          account_group_id = NULL,
          account = $2,
          label = $3,
          url = $4,
          linked_email = $5,
          linked_whatsapp = $6,
          status = $7,
          updated_at = now()
        WHERE id = $8
          AND user_id = $9
      `,
      [socmedId, account, label, url, linkedEmail, linkedWhatsapp, status, id, userId]
    )

    await client.query('DELETE FROM os_brand_social_media_accounts WHERE user_socmed_id = $1', [id])

    if (brandIds.length > 0) {
      await client.query(
        `
          INSERT INTO os_brand_social_media_accounts (brand_id, user_socmed_id)
          SELECT brand_id, $1
          FROM unnest($2::uuid[]) AS brand_id
          ON CONFLICT (brand_id, user_socmed_id) DO NOTHING
        `,
        [id, brandIds]
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  revalidateSocmeds()
}

export async function deleteUserSocmed(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')

  if (!id) {
    throw new Error('id is required.')
  }

  await query('DELETE FROM user_socmeds WHERE id = $1 AND user_id = $2', [id, userId])
  revalidateSocmeds()
}
