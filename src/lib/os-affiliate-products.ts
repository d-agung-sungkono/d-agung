import 'server-only'

import { affiliateProducts as fallbackAffiliateProducts } from '@/data/affiliate-products'
import type { AffiliateMarketplace, AffiliateProduct, AffiliateProductType } from '@/data/affiliate-products'
import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

export type OsAffiliateProduct = AffiliateProduct & {
  createdAt: string
  updatedAt: string
}

type AffiliateProductRow = {
  id: string
  code: string
  name: string
  image: string
  type: AffiliateProductType
  marketplace: AffiliateMarketplace
  destination_url: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

function mapAffiliateProductRow(row: AffiliateProductRow): OsAffiliateProduct {
  return {
    code: row.code,
    createdAt: row.created_at,
    destinationUrl: row.destination_url,
    id: row.id,
    image: row.image,
    isActive: row.is_active,
    marketplace: row.marketplace,
    name: row.name,
    sortOrder: row.sort_order,
    type: row.type,
    updatedAt: row.updated_at,
  }
}

export async function getOsAffiliateProducts() {
  const userId = await getOsUserId()
  const result = await query<AffiliateProductRow>(
    `
      SELECT
        id,
        code,
        name,
        image,
        type,
        marketplace,
        destination_url,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM os_affiliate_products
      WHERE user_id = $1
      ORDER BY is_active DESC, sort_order ASC, created_at DESC
    `,
    [userId]
  )

  return result.rows.map(mapAffiliateProductRow)
}

export async function getPublicAffiliateProducts() {
  const userId = await getOsUserId()
  const result = await query<AffiliateProductRow>(
    `
      SELECT
        id,
        code,
        name,
        image,
        type,
        marketplace,
        destination_url,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM os_affiliate_products
      WHERE user_id = $1
      ORDER BY is_active DESC, sort_order ASC, created_at DESC
    `,
    [userId]
  )

  if (result.rows.length === 0) {
    return fallbackAffiliateProducts
  }

  return result.rows.filter((row) => row.is_active).map(mapAffiliateProductRow)
}

export { fallbackAffiliateProducts }
