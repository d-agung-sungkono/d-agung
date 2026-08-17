'use server'

import { revalidatePath } from 'next/cache'

import type { AffiliateMarketplace, AffiliateProductType } from '@/data/affiliate-products'
import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

const maxImageSize = 5_000_000
const placeholderImage = '/images/products/placeholder.svg'
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
const productTypes = new Set<AffiliateProductType>(['affiliate', 'dropship', 'owned'])
const marketplaces = new Set<AffiliateMarketplace>(['shopee', 'tokopedia', 'other'])

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function getSortOrder(formData: FormData) {
  const rawValue = Number.parseInt(getText(formData, 'sortOrder'), 10)

  if (!Number.isFinite(rawValue) || rawValue < 1) {
    throw new Error('Sort order must be at least 1.')
  }

  return rawValue
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

function getContentLinks(formData: FormData) {
  const rawLinks = formData
    .getAll('contentLinks')
    .flatMap((value) => String(value ?? '').split('\n'))
    .map((value) => value.trim())

  if (rawLinks.some((value) => value.length === 0)) {
    throw new Error('Content link cannot be empty. Fill it or remove the row.')
  }

  return Array.from(new Set(rawLinks))
}

function validateContentLinks(urls: string[]) {
  for (const url of urls) {
    validateUrl(url, 'Content link')
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
  const removeImage = formData.get('removeImage') === 'true'
  const uploadedImage = await getUploadedImage(formData)
  const contentLinks = getContentLinks(formData)

  if (!code || !name || !destinationUrl) {
    throw new Error('Code, name, and destination URL are required.')
  }

  validateUrl(destinationUrl, 'Destination URL')
  validateContentLinks(contentLinks)

  return {
    code,
    destinationUrl,
    isActive,
    marketplace,
    name,
    sortOrder,
    type,
    contentLinks,
    removeImage,
    uploadedImage,
  }
}

function revalidateAffiliate() {
  revalidatePath('/affiliate')
  revalidatePath('/os/affiliate')
}

async function syncContentLinks(productId: string, urls: string[]) {
  await query('DELETE FROM os_affiliate_product_content_links WHERE product_id = $1', [productId])

  if (urls.length === 0) {
    return
  }

  await query(
    `
      INSERT INTO os_affiliate_product_content_links (
        product_id,
        url,
        sort_order
      )
      SELECT $1, url, sort_order::integer
      FROM unnest($2::text[]) WITH ORDINALITY AS content_link(url, sort_order)
      ON CONFLICT (product_id, url) DO UPDATE SET
        sort_order = EXCLUDED.sort_order,
        updated_at = now()
    `,
    [productId, urls]
  )
}

export async function createAffiliateProduct(formData: FormData) {
  const userId = await getOsUserId()
  const product = await getProductPayload(formData)

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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::bytea, $11, CASE WHEN $10::bytea IS NULL THEN NULL ELSE now() END)
      RETURNING id
    `,
    [
      userId,
      product.code,
      product.name,
      placeholderImage,
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

  await syncContentLinks(result.rows[0].id, product.contentLinks)
  revalidateAffiliate()
}

export async function updateAffiliateProduct(formData: FormData) {
  const userId = await getOsUserId()
  const id = getText(formData, 'id')
  const product = await getProductPayload(formData)
  const imagePath = product.uploadedImage ? `/affiliate/image/${id}` : undefined

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
        image = CASE
          WHEN $8::boolean THEN $9
          WHEN $10::bytea IS NOT NULL THEN $11
          ELSE image
        END,
        image_blob = CASE
          WHEN $8::boolean THEN NULL
          WHEN $10::bytea IS NOT NULL THEN $10::bytea
          ELSE image_blob
        END,
        image_mime_type = CASE
          WHEN $8::boolean THEN NULL
          WHEN $10::bytea IS NOT NULL THEN $12
          ELSE image_mime_type
        END,
        image_uploaded_at = CASE
          WHEN $8::boolean THEN NULL
          WHEN $10::bytea IS NOT NULL THEN now()
          ELSE image_uploaded_at
        END,
        updated_at = now()
      WHERE id = $13
        AND user_id = $14
    `,
    [
      product.code,
      product.name,
      product.type,
      product.marketplace,
      product.destinationUrl,
      product.isActive,
      product.sortOrder,
      product.removeImage,
      placeholderImage,
      product.uploadedImage?.data ?? null,
      imagePath ?? null,
      product.uploadedImage?.mimeType ?? null,
      id,
      userId,
    ]
  )

  await syncContentLinks(id, product.contentLinks)
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
