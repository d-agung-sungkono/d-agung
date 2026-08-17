'use server'

import { revalidatePath } from 'next/cache'

import type { AffiliateMarketplace, AffiliateProductType } from '@/data/affiliate-products'
import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

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

function getProductPayload(formData: FormData) {
  const code = getText(formData, 'code').toUpperCase()
  const name = getText(formData, 'name')
  const image = getText(formData, 'image') || '/images/products/placeholder.svg'
  const destinationUrl = getText(formData, 'destinationUrl')
  const type = getProductType(formData)
  const marketplace = getMarketplace(formData)
  const sortOrder = getSortOrder(formData)
  const isActive = formData.get('isActive') === 'on'

  if (!code || !name || !destinationUrl) {
    throw new Error('Code, name, and destination URL are required.')
  }

  validateUrl(image, 'Image')
  validateUrl(destinationUrl, 'Destination URL')

  return {
    code,
    destinationUrl,
    image,
    isActive,
    marketplace,
    name,
    sortOrder,
    type,
  }
}

function revalidateAffiliate() {
  revalidatePath('/affiliate')
  revalidatePath('/os/affiliate')
}

export async function createAffiliateProduct(formData: FormData) {
  const userId = await getOsUserId()
  const product = getProductPayload(formData)

  await query(
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
        sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      userId,
      product.code,
      product.name,
      product.image,
      product.type,
      product.marketplace,
      product.destinationUrl,
      product.isActive,
      product.sortOrder,
    ]
  )

  revalidateAffiliate()
}

export async function updateAffiliateProduct(formData: FormData) {
  const userId = await getOsUserId()
  const id = getText(formData, 'id')
  const product = getProductPayload(formData)

  if (!id) {
    throw new Error('Product id is required.')
  }

  await query(
    `
      UPDATE os_affiliate_products
      SET
        code = $1,
        name = $2,
        image = $3,
        type = $4,
        marketplace = $5,
        destination_url = $6,
        is_active = $7,
        sort_order = $8,
        updated_at = now()
      WHERE id = $9
        AND user_id = $10
    `,
    [
      product.code,
      product.name,
      product.image,
      product.type,
      product.marketplace,
      product.destinationUrl,
      product.isActive,
      product.sortOrder,
      id,
      userId,
    ]
  )

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
