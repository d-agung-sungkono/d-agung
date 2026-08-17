import 'server-only'

import { affiliateProducts as fallbackAffiliateProducts } from '@/data/affiliate-products'
import type {
  AffiliateMarketplace,
  AffiliateProduct,
  AffiliateProductContentLink,
  AffiliateProductType,
} from '@/data/affiliate-products'
import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

export type OsAffiliateProduct = AffiliateProduct & {
  contentLinks: AffiliateProductContentLink[]
  createdAt: string
  updatedAt: string
}

type AffiliateProductRow = {
  content_links: AffiliateProductContentLink[] | null
  id: string
  code: string
  name: string
  image: string
  has_image: boolean
  image_uploaded_at: string | null
  type: AffiliateProductType
  marketplace: AffiliateMarketplace
  destination_url: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

function mapAffiliateProductRow(row: AffiliateProductRow): OsAffiliateProduct {
  const imageVersion = row.image_uploaded_at ?? row.updated_at
  const image = imageVersion ? `${row.image}?v=${encodeURIComponent(imageVersion)}` : row.image

  return {
    code: row.code,
    contentLinks: row.content_links ?? [],
    createdAt: row.created_at,
    destinationUrl: row.destination_url,
    id: row.id,
    hasImage: row.has_image,
    image,
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
        has_image,
        image_uploaded_at,
        type,
        marketplace,
        destination_url,
        is_active,
        sort_order,
        created_at,
        updated_at,
        content_links
      FROM (
        SELECT
          oap.id,
          oap.code,
          oap.name,
          oap.image,
          oap.image_blob IS NOT NULL AS has_image,
          oap.image_uploaded_at,
          oap.type,
          oap.marketplace,
          oap.destination_url,
          oap.is_active,
          oap.sort_order,
          oap.created_at,
          oap.updated_at,
          COALESCE(content_links.links, '[]'::json) AS content_links
        FROM os_affiliate_products oap
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', oapcl.id,
              'title', oapcl.title,
              'url', oapcl.url,
              'sortOrder', oapcl.sort_order
            )
            ORDER BY oapcl.sort_order, oapcl.created_at
          ) AS links
          FROM os_affiliate_product_content_links oapcl
          WHERE oapcl.product_id = oap.id
        ) content_links ON true
        WHERE oap.user_id = $1
      ) products
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
        has_image,
        image_uploaded_at,
        type,
        marketplace,
        destination_url,
        is_active,
        sort_order,
        created_at,
        updated_at,
        content_links
      FROM (
        SELECT
          oap.id,
          oap.code,
          oap.name,
          oap.image,
          oap.image_blob IS NOT NULL AS has_image,
          oap.image_uploaded_at,
          oap.type,
          oap.marketplace,
          oap.destination_url,
          oap.is_active,
          oap.sort_order,
          oap.created_at,
          oap.updated_at,
          COALESCE(content_links.links, '[]'::json) AS content_links
        FROM os_affiliate_products oap
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', oapcl.id,
              'title', COALESCE(oapcl.title, cp.title),
              'url', oapcl.url,
              'sortOrder', oapcl.sort_order,
              'platform', s.name,
              'account', us.account,
              'status', cp.status
            )
            ORDER BY oapcl.sort_order, oapcl.created_at
          ) AS links
          FROM os_affiliate_product_content_links oapcl
          LEFT JOIN content_posts cp ON cp.user_id = oap.user_id AND cp.url = oapcl.url
          LEFT JOIN user_socmeds us ON us.id = cp.user_socmed_id
          LEFT JOIN socmeds s ON s.id = us.socmed_id
          WHERE oapcl.product_id = oap.id
        ) content_links ON true
        WHERE oap.user_id = $1
      ) products
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
