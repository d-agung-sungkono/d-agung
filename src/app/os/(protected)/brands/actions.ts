'use server'

import { revalidatePath } from 'next/cache'

import { getDbPool } from '@/lib/db'
import { brandStatuses, type BrandStatus } from '@/lib/os-brands-schema'
import { getOsUserId } from '@/lib/os-settings'

function normalizeNullableValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function normalizeRequiredValue(value: FormDataEntryValue | null) {
  return String(value ?? '').trim()
}

function assertValidStatus(value: string): asserts value is BrandStatus {
  if (!brandStatuses.includes(value as BrandStatus)) {
    throw new Error('Invalid brand status.')
  }
}

function normalizeOptionalUrl(value: FormDataEntryValue | null, fieldName: string) {
  const normalized = normalizeNullableValue(value)

  if (!normalized) {
    return null
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(normalized)
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`)
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(`${fieldName} must use http or https.`)
  }

  return parsedUrl.toString()
}

function revalidateBrands(brandId?: string) {
  revalidatePath('/os/brands')

  if (brandId) {
    revalidatePath(`/os/brands/${brandId}`)
  }
}

export async function createBrand(formData: FormData) {
  const userId = await getOsUserId()
  const title = normalizeRequiredValue(formData.get('title'))
  const description = normalizeNullableValue(formData.get('description'))
  const imageUrl = normalizeOptionalUrl(formData.get('imageUrl'), 'Image URL')
  const websiteUrl = normalizeOptionalUrl(formData.get('websiteUrl'), 'Website URL')
  const status = normalizeRequiredValue(formData.get('status')) || 'ACTIVE'
  const direction = normalizeNullableValue(formData.get('direction'))
  const nextDevelopment = normalizeNullableValue(formData.get('nextDevelopment'))

  if (!title) {
    throw new Error('Title is required.')
  }

  assertValidStatus(status)

  const result = await getDbPool().query<{ id: string }>(
    `
      INSERT INTO os_brands (
        user_id,
        title,
        description,
        image_url,
        website_url,
        status,
        direction,
        next_development
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [userId, title, description, imageUrl, websiteUrl, status, direction, nextDevelopment]
  )

  const brandId = result.rows[0]?.id
  revalidateBrands(brandId)

  return { id: brandId }
}

export async function updateBrand(formData: FormData) {
  const userId = await getOsUserId()
  const brandId = normalizeRequiredValue(formData.get('id'))
  const title = normalizeRequiredValue(formData.get('title'))
  const description = normalizeNullableValue(formData.get('description'))
  const imageUrl = normalizeOptionalUrl(formData.get('imageUrl'), 'Image URL')
  const websiteUrl = normalizeOptionalUrl(formData.get('websiteUrl'), 'Website URL')
  const status = normalizeRequiredValue(formData.get('status')) || 'ACTIVE'
  const direction = normalizeNullableValue(formData.get('direction'))
  const nextDevelopment = normalizeNullableValue(formData.get('nextDevelopment'))

  if (!brandId || !title) {
    throw new Error('Brand id and title are required.')
  }

  assertValidStatus(status)

  const result = await getDbPool().query(
    `
      UPDATE os_brands
      SET
        title = $1,
        description = $2,
        image_url = $3,
        website_url = $4,
        status = $5,
        direction = $6,
        next_development = $7,
        updated_at = now()
      WHERE id = $8
        AND user_id = $9
    `,
    [title, description, imageUrl, websiteUrl, status, direction, nextDevelopment, brandId, userId]
  )

  if (result.rowCount === 0) {
    throw new Error('Brand not found.')
  }

  revalidateBrands(brandId)
}

export async function updateBrandConnections(formData: FormData) {
  const userId = await getOsUserId()
  const brandId = normalizeRequiredValue(formData.get('brandId'))
  const socialMediaAccountIds = Array.from(
    new Set(
      formData
        .getAll('socialMediaAccountIds')
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  )

  if (!brandId) {
    throw new Error('Brand id is required.')
  }

  const pool = getDbPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const brandResult = await client.query<{ id: string }>(
      `
        SELECT id
        FROM os_brands
        WHERE id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [brandId, userId]
    )

    if (!brandResult.rows[0]) {
      throw new Error('Brand not found.')
    }

    if (socialMediaAccountIds.length > 0) {
      const availableAccountsResult = await client.query<{ id: string }>(
        `
          SELECT id
          FROM user_socmeds
          WHERE user_id = $1
            AND id = ANY($2::uuid[])
        `,
        [userId, socialMediaAccountIds]
      )

      if (availableAccountsResult.rows.length !== socialMediaAccountIds.length) {
        throw new Error('One or more selected social media accounts are invalid.')
      }
    }

    await client.query('DELETE FROM os_brand_social_media_accounts WHERE brand_id = $1', [brandId])

    if (socialMediaAccountIds.length > 0) {
      await client.query(
        `
          INSERT INTO os_brand_social_media_accounts (brand_id, user_socmed_id)
          SELECT $1, account_id
          FROM unnest($2::uuid[]) AS account_id
          ON CONFLICT (brand_id, user_socmed_id) DO NOTHING
        `,
        [brandId, socialMediaAccountIds]
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  revalidateBrands(brandId)
}
