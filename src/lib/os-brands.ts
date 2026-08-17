import 'server-only'

import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'
import type { BrandDetail, BrandSocialAccount, BrandStatus } from '@/lib/os-brands-schema'

type BrandListRow = {
  connected_social_accounts: string | number
  description: string | null
  id: string
  image_url: string | null
  status: BrandStatus
  title: string
  updated_at: Date
  website_url: string | null
}

type BrandDetailRow = {
  created_at: Date
  description: string | null
  direction: string | null
  id: string
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

export async function getBrandsData() {
  const userId = await getOsUserId()
  const [brandsResult, connectionOptionsResult] = await Promise.all([
    query<BrandListRow>(
      `
        SELECT
          b.id,
          b.title,
          b.description,
          b.image_url,
          b.website_url,
          b.status,
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
      description: row.description,
      id: row.id,
      imageUrl: row.image_url,
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
        description,
        image_url,
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
      contentActivity,
      createdAt: brand.created_at.toISOString(),
      description: brand.description,
      direction: brand.direction,
      id: brand.id,
      imageUrl: brand.image_url,
      nextDevelopment: brand.next_development,
      status: brand.status,
      title: brand.title,
      updatedAt: brand.updated_at.toISOString(),
      websiteUrl: brand.website_url,
    } satisfies BrandDetail,
  }
}
