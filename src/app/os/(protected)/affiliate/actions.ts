'use server'

import { revalidatePath } from 'next/cache'

import type { AffiliateMarketplace, AffiliateProductType } from '@/data/affiliate-products'
import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

const maxImageSize = 5_000_000
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
const productTypes = new Set<AffiliateProductType>(['affiliate', 'dropship', 'owned'])
const marketplaces = new Set<AffiliateMarketplace>(['shopee', 'tokopedia', 'other'])

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function getSortOrder(formData: FormData) {
  const rawValue = Number.parseInt(getText(formData, 'sortOrder'), 10)

  return Number.isFinite(rawValue) ? rawValue : 0
}

function getProductType(formData: FormData) {
  const value = getText(formData, 'type') as AffiliateProductType

  if (!productTypes.has(value)) {
    throw new Error('Product type is invalid.')
  }

  return value
}

function getMarketplace(formData: FormData) {
  const value = getText(formData, 'marketplace') as AffiliateMarketplace

  if (!marketplaces.has(value)) {
    throw new Error('Marketplace is invalid.')
  }

  return value
}

function validateUrl(value: string, fieldLabel: string) {
  if (!value) {
    return
  }

  if (value.startsWith('/')) {
    return
  }

  try {
    const parsedUrl = new URL(value)

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error()
    }
  } catch {
    throw new Error(`${fieldLabel} must be a valid http(s) URL or local path.`)
  }
}

async function getUploadedImage(formData: FormData) {
  const file = formData.get('imageFile')

  if (!(file instanceof File) || file.size === 0) {
    return null
  }

  if (file.size > maxImageSize) {
    throw new Error('Image must be 5 MB or smaller.')
  }

  if (!allowedImageTypes.has(file.type)) {
    throw new Error('Image must be JPG, PNG, WebP, GIF, or SVG.')
  }

  return {
    data: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
  }
}

async function getProductPayload(formData: FormData) {
  const code = getText(formData, 'code').toUpperCase()
  const name = getText(formData, 'name')
  const destinationUrl = getText(formData, 'destinationUrl')
  const type = getProductType(formData)
  const marketplace = getMarketplace(formData)
  const sortOrder = getSortOrder(formData)
  const isActive = formData.get('isActive') === 'on'
  const uploadedImage = await getUploadedImage(formData)

  if (!code || !name || !destinationUrl) {
    throw new Error('Code, name, and destination URL are required.')
  }

  validateUrl(destinationUrl, 'Destination URL')

  return {
    code,
    destinationUrl,
    isActive,
    marketplace,
    name,
    sortOrder,
    type,
    uploadedImage,
  }
}

function revalidateAffiliate() {
  revalidatePath('/affiliate')
  revalidatePath('/os/affiliate')
}

export async function createAffiliateProduct(formData: FormData) {
  const userId = await getOsUserId()
  const product = await getProductPayload(formData)

  if (!product.uploadedImage) {
    throw new Error('Product image is required.')
  }

  const result = await query<{ id: string }>(
    `
      INSERT INTO os_affiliate_products (
        user_id,
        code,
        name,
        image,
        type,
        marketplace,
        destination_url,
        is_active,
        sort_order,
        image_blob,
        image_mime_type,
        image_uploaded_at
      )
      VALUES ($1, $2, $3, '/images/products/placeholder.svg', $4, $5, $6, $7, $8, $9::bytea, $10, CASE WHEN $9::bytea IS NULL THEN NULL ELSE now() END)
      RETURNING id
    `,
    [
      userId,
      product.code,
      product.name,
      product.type,
      product.marketplace,
      product.destinationUrl,
      product.isActive,
      product.sortOrder,
      product.uploadedImage?.data ?? null,
      product.uploadedImage?.mimeType ?? null,
    ]
  )

  if (product.uploadedImage) {
    await query(
      `
        UPDATE os_affiliate_products
        SET image = $1, updated_at = now()
        WHERE id = $2
          AND user_id = $3
      `,
      [`/affiliate/image/${result.rows[0].id}`, result.rows[0].id, userId]
    )
  }

  revalidateAffiliate()
}

export async function updateAffiliateProduct(formData: FormData) {
  const userId = await getOsUserId()
  const id = getText(formData, 'id')
  const product = await getProductPayload(formData)

  if (!id) {
    throw new Error('Product id is required.')
  }

  await query(
    `
      UPDATE os_affiliate_products
      SET
        code = $1,
        name = $2,
        type = $3,
        marketplace = $4,
        destination_url = $5,
        is_active = $6,
        sort_order = $7,
        image_blob = COALESCE($8::bytea, image_blob),
        image_mime_type = CASE WHEN $8::bytea IS NULL THEN image_mime_type ELSE $9 END,
        image_uploaded_at = CASE WHEN $8::bytea IS NULL THEN image_uploaded_at ELSE now() END,
        updated_at = now()
      WHERE id = $10
        AND user_id = $11
    `,
    [
      product.code,
      product.name,
      product.type,
      product.marketplace,
      product.destinationUrl,
      product.isActive,
      product.sortOrder,
      product.uploadedImage?.data ?? null,
      product.uploadedImage?.mimeType ?? null,
      id,
      userId,
    ]
  )

  if (product.uploadedImage) {
    await query(
      `
        UPDATE os_affiliate_products
        SET image = $1, updated_at = now()
        WHERE id = $2
          AND user_id = $3
      `,
      [`/affiliate/image/${id}`, id, userId]
    )
  }

  revalidateAffiliate()
}

export async function setAffiliateProductActive(formData: FormData) {
  const userId = await getOsUserId()
  const id = getText(formData, 'id')
  const isActive = getText(formData, 'isActive') === 'true'

  if (!id) {
    throw new Error('Product id is required.')
  }

  await query(
    `
      UPDATE os_affiliate_products
      SET is_active = $1, updated_at = now()
      WHERE id = $2
        AND user_id = $3
    `,
    [isActive, id, userId]
  )

  revalidateAffiliate()
}

export async function deleteAffiliateProduct(formData: FormData) {
  const userId = await getOsUserId()
  const id = getText(formData, 'id')

  if (!id) {
    throw new Error('Product id is required.')
  }

  await query('DELETE FROM os_affiliate_products WHERE id = $1 AND user_id = $2', [id, userId])
  revalidateAffiliate()
}
