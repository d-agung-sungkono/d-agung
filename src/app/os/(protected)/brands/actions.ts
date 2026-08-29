'use server'

import { revalidatePath } from 'next/cache'

import { getDbPool } from '@/lib/db'
import { brandStatuses, type BrandStatus } from '@/lib/os-brands-schema'
import { getOsUserId } from '@/lib/os-settings'

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
const maxImageSize = 5 * 1024 * 1024
const defaultBrandColor = '#2563eb'

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

function normalizeBrandColor(value: FormDataEntryValue | null) {
  const normalized = normalizeRequiredValue(value) || defaultBrandColor

  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
    throw new Error('Brand color must be a valid hex color.')
  }

  return normalized.toLowerCase()
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

async function getUploadedLogo(formData: FormData) {
  const file = formData.get('imageFile')

  if (!(file instanceof File) || file.size === 0) {
    return null
  }

  if (file.size > maxImageSize) {
    throw new Error('Logo must be 5 MB or smaller.')
  }

  if (!allowedImageTypes.has(file.type)) {
    throw new Error('Logo must be JPG, PNG, WebP, GIF, or SVG.')
  }

  return {
    data: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
  }
}

function revalidateBrands(brandId?: string) {
  revalidatePath('/os/brands')
  revalidatePath('/os/today')

  if (brandId) {
    revalidatePath(`/os/brands/${brandId}`)
  }
}

export async function createBrand(formData: FormData) {
  const userId = await getOsUserId()
  const title = normalizeRequiredValue(formData.get('title'))
  const brandColor = normalizeBrandColor(formData.get('brandColor'))
  const description = normalizeNullableValue(formData.get('description'))
  const imageUrl = normalizeOptionalUrl(formData.get('imageUrl'), 'Image URL')
  const websiteUrl = normalizeOptionalUrl(formData.get('websiteUrl'), 'Website URL')
  const status = normalizeRequiredValue(formData.get('status')) || 'ACTIVE'
  const direction = normalizeNullableValue(formData.get('direction'))
  const nextDevelopment = normalizeNullableValue(formData.get('nextDevelopment'))
  const uploadedLogo = await getUploadedLogo(formData)

  if (!title) {
    throw new Error('Title is required.')
  }

  assertValidStatus(status)

  const result = await getDbPool().query<{ id: string }>(
    `
      INSERT INTO os_brands (
        user_id,
        title,
        brand_color,
        description,
        image_url,
        website_url,
        status,
        direction,
        next_development,
        image_blob,
        image_mime_type,
        image_uploaded_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::bytea, $11, CASE WHEN $10::bytea IS NULL THEN NULL ELSE now() END)
      RETURNING id
    `,
    [
      userId,
      title,
      brandColor,
      description,
      imageUrl,
      websiteUrl,
      status,
      direction,
      nextDevelopment,
      uploadedLogo?.data ?? null,
      uploadedLogo?.mimeType ?? null,
    ]
  )

  const brandId = result.rows[0]?.id

  if (brandId && uploadedLogo) {
    await getDbPool().query(
      `
        UPDATE os_brands
        SET image_url = $1, updated_at = now()
        WHERE id = $2
          AND user_id = $3
      `,
      [`/os/brands/image/${brandId}`, brandId, userId]
    )
  }

  revalidateBrands(brandId)

  return { id: brandId }
}

export async function updateBrand(formData: FormData) {
  const userId = await getOsUserId()
  const brandId = normalizeRequiredValue(formData.get('id'))
  const title = normalizeRequiredValue(formData.get('title'))
  const brandColor = normalizeBrandColor(formData.get('brandColor'))
  const description = normalizeNullableValue(formData.get('description'))
  const imageUrl = normalizeOptionalUrl(formData.get('imageUrl'), 'Image URL')
  const websiteUrl = normalizeOptionalUrl(formData.get('websiteUrl'), 'Website URL')
  const status = normalizeRequiredValue(formData.get('status')) || 'ACTIVE'
  const direction = normalizeNullableValue(formData.get('direction'))
  const nextDevelopment = normalizeNullableValue(formData.get('nextDevelopment'))
  const removeImage = formData.get('removeImage') === 'true'
  const uploadedLogo = await getUploadedLogo(formData)
  const logoPath = uploadedLogo ? `/os/brands/image/${brandId}` : null

  if (!brandId || !title) {
    throw new Error('Brand id and title are required.')
  }

  assertValidStatus(status)

  const result = await getDbPool().query(
    `
      UPDATE os_brands
      SET
        title = $1,
        brand_color = $2,
        description = $3,
        image_url = CASE
          WHEN $9::boolean THEN NULL
          WHEN $10::bytea IS NOT NULL THEN $11
          WHEN $4::text IS NOT NULL THEN $4
          ELSE image_url
        END,
        website_url = $5,
        status = $6,
        direction = $7,
        next_development = $8,
        image_blob = CASE
          WHEN $9::boolean THEN NULL
          WHEN $10::bytea IS NOT NULL THEN $10::bytea
          ELSE image_blob
        END,
        image_mime_type = CASE
          WHEN $9::boolean THEN NULL
          WHEN $10::bytea IS NOT NULL THEN $12
          ELSE image_mime_type
        END,
        image_uploaded_at = CASE
          WHEN $9::boolean THEN NULL
          WHEN $10::bytea IS NOT NULL THEN now()
          ELSE image_uploaded_at
        END,
        updated_at = now()
      WHERE id = $13
        AND user_id = $14
    `,
    [
      title,
      brandColor,
      description,
      imageUrl,
      websiteUrl,
      status,
      direction,
      nextDevelopment,
      removeImage,
      uploadedLogo?.data ?? null,
      logoPath,
      uploadedLogo?.mimeType ?? null,
      brandId,
      userId,
    ]
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
