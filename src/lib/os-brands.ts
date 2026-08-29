import 'server-only'

import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'
import type { BrandDetail, BrandSocialAccount, BrandStatus } from '@/lib/os-brands-schema'

type BrandListRow = {
  brand_color: string
  connected_social_accounts: string | number
  description: string | null
  direction: string | null
  has_image: boolean
  id: string
  image_uploaded_at: Date | null
  image_url: string | null
  next_development: string | null
  status: BrandStatus
  title: string
  updated_at: Date
  website_url: string | null
}

type BrandDetailRow = {
  brand_color: string
  created_at: Date
  description: string | null
  direction: string | null
  has_image: boolean
  id: string
  image_uploaded_at: Date | null
  image_url: string | null
  next_development: string | null
  status: BrandStatus
  title: string
  updated_at: Date
  website_url: string | null
}

type BrandConnectionRow = {
  account: string
  id: string
  label: string
  platform: string
  status: string
  url: string
}

type ContentActivityRow = {
  planned_count: string | number
  published_count: string | number
  total_count: string | number
}

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0)
}

function mapConnectionRow(row: BrandConnectionRow): BrandSocialAccount {
  return {
    account: row.account,
    id: row.id,
    label: row.label,
    platform: row.platform,
    status: row.status,
    url: row.url,
  }
}

function getVersionedImageUrl(imageUrl: string | null, uploadedAt: Date | null, updatedAt: Date) {
  if (!imageUrl) {
    return null
  }

  const imageVersion = uploadedAt ?? updatedAt
  return `${imageUrl}?v=${encodeURIComponent(imageVersion.toISOString())}`
}

export async function getBrandsData() {
  const userId = await getOsUserId()
  const [brandsResult, connectionOptionsResult] = await Promise.all([
    query<BrandListRow>(
      `
        SELECT
          b.id,
          b.title,
          b.brand_color,
          b.description,
          b.image_url,
          b.image_blob IS NOT NULL AS has_image,
          b.image_uploaded_at,
          b.website_url,
          b.status,
          b.direction,
          b.next_development,
          b.updated_at,
          COUNT(rel.id) AS connected_social_accounts
        FROM os_brands b
        LEFT JOIN os_brand_social_media_accounts rel ON rel.brand_id = b.id
        WHERE b.user_id = $1
        GROUP BY b.id
        ORDER BY
          CASE b.status
            WHEN 'ACTIVE' THEN 0
            WHEN 'PAUSED' THEN 1
            ELSE 2
          END,
          b.updated_at DESC,
          b.title ASC
      `,
      [userId]
    ),
    query<BrandConnectionRow>(
      `
        SELECT
          us.id,
          s.name AS platform,
          us.account,
          us.label,
          us.url,
          us.status
        FROM user_socmeds us
        INNER JOIN socmeds s ON s.id = us.socmed_id
        WHERE us.user_id = $1
        ORDER BY us.sort_order, s.sort_order, s.name, us.account
      `,
      [userId]
    ),
  ])

  return {
    brands: brandsResult.rows.map((row) => ({
      connectedSocialAccounts: toNumber(row.connected_social_accounts),
      brandColor: row.brand_color,
      description: row.description,
      direction: row.direction,
      hasImage: row.has_image,
      id: row.id,
      imageUrl: getVersionedImageUrl(row.image_url, row.image_uploaded_at, row.updated_at),
      nextDevelopment: row.next_development,
      status: row.status,
      title: row.title,
      updatedAt: row.updated_at.toISOString(),
      websiteUrl: row.website_url,
    })),
    connectionOptions: connectionOptionsResult.rows.map(mapConnectionRow),
  }
}

export async function getBrandDetail(brandId: string) {
  const userId = await getOsUserId()
  const brandResult = await query<BrandDetailRow>(
    `
      SELECT
        id,
        title,
        brand_color,
        description,
        image_url,
        image_blob IS NOT NULL AS has_image,
        image_uploaded_at,
        website_url,
        status,
        direction,
        next_development,
        created_at,
        updated_at
      FROM os_brands
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [brandId, userId]
  )

  const brand = brandResult.rows[0]

  if (!brand) {
    return null
  }

  const [connectionsResult, allAccountsResult] = await Promise.all([
    query<BrandConnectionRow>(
      `
        SELECT
          us.id,
          s.name AS platform,
          us.account,
          us.label,
          us.url,
          us.status
        FROM os_brand_social_media_accounts rel
        INNER JOIN user_socmeds us ON us.id = rel.user_socmed_id
        INNER JOIN socmeds s ON s.id = us.socmed_id
        WHERE rel.brand_id = $1
          AND us.user_id = $2
        ORDER BY us.sort_order, s.sort_order, s.name, us.account
      `,
      [brandId, userId]
    ),
    query<BrandConnectionRow>(
      `
        SELECT
          us.id,
          s.name AS platform,
          us.account,
          us.label,
          us.url,
          us.status
        FROM user_socmeds us
        INNER JOIN socmeds s ON s.id = us.socmed_id
        WHERE us.user_id = $1
        ORDER BY us.sort_order, s.sort_order, s.name, us.account
      `,
      [userId]
    ),
  ])

  let contentActivity: BrandDetail['contentActivity'] = null

  if (connectionsResult.rows.length > 0) {
    const contentActivityResult = await query<ContentActivityRow>(
      `
        SELECT
          COUNT(*) AS total_count,
          COUNT(*) FILTER (WHERE status = 'published') AS published_count,
          COUNT(*) FILTER (WHERE status IN ('draft', 'planned', 'ready')) AS planned_count
        FROM content_posts
        WHERE user_id = $1
          AND user_socmed_id = ANY($2::uuid[])
      `,
      [userId, connectionsResult.rows.map((row) => row.id)]
    )

    const counts = contentActivityResult.rows[0]
    contentActivity = {
      planned: toNumber(counts?.planned_count),
      published: toNumber(counts?.published_count),
      total: toNumber(counts?.total_count),
    }
  }

  return {
    allConnectionOptions: allAccountsResult.rows.map(mapConnectionRow),
    brand: {
      connections: connectionsResult.rows.map(mapConnectionRow),
      brandColor: brand.brand_color,
      contentActivity,
      createdAt: brand.created_at.toISOString(),
      description: brand.description,
      direction: brand.direction,
      hasImage: brand.has_image,
      id: brand.id,
      imageUrl: getVersionedImageUrl(brand.image_url, brand.image_uploaded_at, brand.updated_at),
      nextDevelopment: brand.next_development,
      status: brand.status,
      title: brand.title,
      updatedAt: brand.updated_at.toISOString(),
      websiteUrl: brand.website_url,
    } satisfies BrandDetail,
  }
}
