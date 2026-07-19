import 'server-only'

import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

export type ProductBranchStock = {
  branchName: string
  isAvailable: boolean
  stockText: string
  stockType: string
}

export type ProductMonitorItem = {
  branchStocks: ProductBranchStock[]
  category: string
  currency: string
  description: string
  discountAmount: number | null
  discountPercent: number | null
  id: string
  name: string
  originalPrice: number | null
  platform: string
  previousDiscountAmount: number | null
  previousDiscountPercent: number | null
  previousOriginalPrice: number | null
  previousSnapshotAt: string | null
  sku: string
  snapshotA: {
    date: string
    price: number
    stock: number
  }
  snapshotB: {
    date: string
    price: number
    stock: number
  }
  stockStatus: string
  url: string
  variant: string | null
}

type ProductRow = {
  id: string
  source: string
  source_url: string
  sku: string
  title: string
  category: string | null
  description: string | null
  variant: string | null
  currency: string
  latest_snapshot_id: string | null
  latest_scraped_at: Date | null
  latest_original_price: number | null
  latest_final_price: number | null
  latest_discount_amount: number | null
  latest_discount_percent: string | null
  latest_stock_status: string | null
  latest_stock_available_count: number | null
  previous_scraped_at: Date | null
  previous_original_price: number | null
  previous_final_price: number | null
  previous_discount_amount: number | null
  previous_discount_percent: string | null
  previous_stock_available_count: number | null
}

type BranchStockRow = {
  branch_name: string
  is_available: boolean
  snapshot_id: string
  stock_text: string
  stock_type: string
}

function toDateKey(value: Date | null) {
  if (!value) {
    return new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
    }).format(new Date())
  }

  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  }).format(value)
}

export async function getProductsData() {
  const userId = await getOsUserId()
  const productsResult = await query<ProductRow>(
    `
      WITH ranked_snapshots AS (
        SELECT
          ops.*,
          row_number() OVER (PARTITION BY ops.product_id ORDER BY ops.scraped_at DESC, ops.created_at DESC) AS row_number
        FROM os_product_snapshots ops
      )
      SELECT
        op.id,
        op.source,
        op.source_url,
        op.sku,
        op.title,
        op.category,
        op.description,
        op.variant,
        op.currency,
        latest.id AS latest_snapshot_id,
        latest.scraped_at AS latest_scraped_at,
        latest.original_price AS latest_original_price,
        latest.final_price AS latest_final_price,
        latest.discount_amount AS latest_discount_amount,
        latest.discount_percent::text AS latest_discount_percent,
        latest.stock_status AS latest_stock_status,
        latest.stock_available_count AS latest_stock_available_count,
        previous.scraped_at AS previous_scraped_at,
        previous.original_price AS previous_original_price,
        previous.final_price AS previous_final_price,
        previous.discount_amount AS previous_discount_amount,
        previous.discount_percent::text AS previous_discount_percent,
        previous.stock_available_count AS previous_stock_available_count
      FROM os_products op
      LEFT JOIN ranked_snapshots latest ON latest.product_id = op.id AND latest.row_number = 1
      LEFT JOIN ranked_snapshots previous ON previous.product_id = op.id AND previous.row_number = 2
      WHERE op.user_id = $1
        AND op.status = 'active'
      ORDER BY latest.scraped_at DESC NULLS LAST, op.updated_at DESC
    `,
    [userId]
  )
  const snapshotIds = productsResult.rows
    .map((row) => row.latest_snapshot_id)
    .filter((value): value is string => Boolean(value))
  const branchStocksResult =
    snapshotIds.length > 0
      ? await query<BranchStockRow>(
          `
            SELECT snapshot_id, branch_name, stock_text, stock_type, is_available
            FROM os_product_branch_stocks
            WHERE snapshot_id = ANY($1::uuid[])
            ORDER BY is_available DESC, branch_name
          `,
          [snapshotIds]
        )
      : { rows: [] }
  const branchStocksBySnapshotId = new Map<string, ProductBranchStock[]>()

  for (const row of branchStocksResult.rows) {
    const current = branchStocksBySnapshotId.get(row.snapshot_id) ?? []
    current.push({
      branchName: row.branch_name,
      isAvailable: row.is_available,
      stockText: row.stock_text,
      stockType: row.stock_type,
    })
    branchStocksBySnapshotId.set(row.snapshot_id, current)
  }

  return productsResult.rows.map((row) => {
    const latestPrice = row.latest_final_price ?? 0
    const previousPrice = row.previous_final_price ?? latestPrice
    const latestStock = row.latest_stock_available_count ?? 0
    const previousStock = row.previous_stock_available_count ?? latestStock

    return {
      branchStocks: row.latest_snapshot_id ? branchStocksBySnapshotId.get(row.latest_snapshot_id) ?? [] : [],
      category: row.category ?? 'Supplier',
      currency: row.currency,
      description: row.description ?? '',
      discountAmount: row.latest_discount_amount,
      discountPercent: row.latest_discount_percent ? Number(row.latest_discount_percent) : null,
      id: row.id,
      name: row.title,
      originalPrice: row.latest_original_price,
      platform: row.source,
      previousDiscountAmount: row.previous_discount_amount,
      previousDiscountPercent: row.previous_discount_percent ? Number(row.previous_discount_percent) : null,
      previousOriginalPrice: row.previous_original_price,
      previousSnapshotAt: row.previous_scraped_at ? row.previous_scraped_at.toISOString() : null,
      sku: row.sku,
      snapshotA: {
        date: toDateKey(row.previous_scraped_at ?? row.latest_scraped_at),
        price: previousPrice,
        stock: previousStock,
      },
      snapshotB: {
        date: toDateKey(row.latest_scraped_at),
        price: latestPrice,
        stock: latestStock,
      },
      stockStatus: row.latest_stock_status ?? 'unknown',
      url: row.source_url,
      variant: row.variant,
    }
  })
}
