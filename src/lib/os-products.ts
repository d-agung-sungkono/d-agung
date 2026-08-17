import 'server-only'

import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

export type ProductBranchStock = {
  branchName: string
  isAvailable: boolean
  source: string
  stockText: string
  stockType: string
}

export type ProductSupplierSnapshot = {
  discountAmount: number | null
  discountPercent: number | null
  finalPrice: number | null
  isAvailable: boolean
  originalPrice: number | null
  scrapedAt: string | null
  snapshotId: string | null
  source: string
  stockAvailableCount: number
  stockStatus: string
  url: string
}

export type ProductSupplierSnapshotDetail = {
  discountAmount: number | null
  discountPercent: number | null
  finalPrice: number | null
  originalPrice: number | null
  runId: string | null
  runNumber: number | null
  scrapedAt: string | null
  snapshotId: string | null
  stockAvailableCount: number
  stockStatus: string
  branchStocks: ProductBranchStock[]
}

export type ProductSupplierLink = {
  source: string
  url: string
  current: ProductSupplierSnapshotDetail | null
  previous: ProductSupplierSnapshotDetail | null
  snapshots: ProductSupplierSnapshotDetail[]
}

export type ProductSnapshotOption = {
  date: string
  id: string
  number: number | null
  type: 'date' | 'run'
}

export type ProductMonitorItem = {
  branchStocks: ProductBranchStock[]
  category: string
  currency: string
  description: string
  discountAmount: number | null
  discountPercent: number | null
  id: string
  primaryImageUrl: string | null
  name: string
  originalPrice: number | null
  previousDiscountAmount: number | null
  previousDiscountPercent: number | null
  previousOriginalPrice: number | null
  previousSnapshotAt: string | null
  sku: string
  snapshotA: {
    date: string
    number: number | null
    price: number
    stock: number
  }
  snapshotB: {
    date: string
    number: number | null
    price: number
    stock: number
  }
  stockStatus: string
  supplierSnapshots: ProductSupplierSnapshot[]
  supplierLinks: ProductSupplierLink[]
  status: string
  variant: string | null
}

type ProductRow = {
  id: string
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
  latest_run_number: number | null
  previous_scraped_at: Date | null
  previous_original_price: number | null
  previous_final_price: number | null
  previous_discount_amount: number | null
  previous_discount_percent: string | null
  previous_stock_available_count: number | null
  previous_run_number: number | null
  has_primary_image: boolean
  status: string
  supplier_links: ProductRowSupplierLink[] | null
}

type ProductRowSupplierSnapshot = {
  discountAmount: number | null
  discountPercent: string | null
  finalPrice: number | null
  originalPrice: number | null
  runId: string | null
  runNumber: number | null
  scrapedAt: string | null
  snapshotId: string | null
  stockAvailableCount: number | null
  stockStatus: string | null
}

type ProductRowSupplierLink = {
  current: ProductRowSupplierSnapshot | null
  previous: ProductRowSupplierSnapshot | null
  snapshots: ProductRowSupplierSnapshot[] | null
  source: string
  url: string
}

type BranchStockRow = {
  branch_name: string
  is_available: boolean
  snapshot_id: string
  source: string
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
  const snapshotsResult = await query<{ id: string; run_number: number | null; started_at: Date }>(
    `
      SELECT
        id,
        run_number,
        started_at
      FROM os_product_scrape_runs
      WHERE user_id = $1
        AND status = 'completed'
      ORDER BY started_at DESC, run_number DESC
    `,
    [userId]
  )
  const snapshots: ProductSnapshotOption[] = snapshotsResult.rows.map((row) => ({
    date: toDateKey(row.started_at),
    id: row.id,
    number: row.run_number,
    type: 'run',
  }))
  const fallbackSnapshotsResult =
    snapshots.length === 0
      ? await query<{ date_key: string }>(
          `
            SELECT DISTINCT to_char(scraped_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS date_key
            FROM os_product_snapshots
            WHERE product_id IN (
              SELECT id
              FROM os_products
              WHERE user_id = $1
            )
            ORDER BY date_key DESC
          `,
          [userId]
        )
      : { rows: [] }
  snapshots.push(
    ...fallbackSnapshotsResult.rows.map((row) => ({
      date: row.date_key,
      id: `date:${row.date_key}`,
      number: null,
      type: 'date' as const,
    }))
  )
  const productsResult = await query<ProductRow>(
    `
      WITH run_windows AS (
        SELECT
          ospsr.*,
          row_number() OVER (ORDER BY ospsr.started_at DESC, ospsr.run_number DESC) AS run_row_number
        FROM os_product_scrape_runs ospsr
        WHERE ospsr.user_id = $1
          AND ospsr.status = 'completed'
      ),
      current_run AS (
        SELECT *
        FROM run_windows
        WHERE run_row_number = 1
      ),
      previous_run AS (
        SELECT *
        FROM run_windows
        WHERE run_row_number = 2
      ),
      ranked_snapshots AS (
        SELECT
          ops.*,
          row_number() OVER (PARTITION BY ops.product_id ORDER BY ops.scraped_at DESC, ops.created_at DESC) AS product_row_number,
          row_number() OVER (PARTITION BY ops.product_link_id ORDER BY ops.scraped_at DESC, ops.created_at DESC) AS link_row_number
        FROM os_product_snapshots ops
      )
      SELECT
        op.id,
        op.sku,
        op.title,
        op.category,
        op.description,
        op.variant,
        op.currency,
        (op.primary_image IS NOT NULL) AS has_primary_image,
        op.status,
        CASE WHEN current_run.id IS NOT NULL THEN latest.id ELSE fallback_latest.id END AS latest_snapshot_id,
        CASE WHEN current_run.id IS NOT NULL THEN current_run.started_at ELSE fallback_latest.scraped_at END AS latest_scraped_at,
        CASE WHEN current_run.id IS NOT NULL THEN latest.original_price ELSE fallback_latest.original_price END AS latest_original_price,
        CASE WHEN current_run.id IS NOT NULL THEN latest.final_price ELSE fallback_latest.final_price END AS latest_final_price,
        CASE WHEN current_run.id IS NOT NULL THEN latest.discount_amount ELSE fallback_latest.discount_amount END AS latest_discount_amount,
        CASE WHEN current_run.id IS NOT NULL THEN latest.discount_percent::text ELSE fallback_latest.discount_percent::text END AS latest_discount_percent,
        CASE WHEN current_run.id IS NOT NULL THEN latest.stock_status ELSE fallback_latest.stock_status END AS latest_stock_status,
        CASE WHEN current_run.id IS NOT NULL THEN latest.stock_available_count ELSE fallback_latest.stock_available_count END AS latest_stock_available_count,
        current_run.run_number AS latest_run_number,
        CASE WHEN previous_run.id IS NOT NULL THEN previous_run.started_at ELSE fallback_previous.scraped_at END AS previous_scraped_at,
        CASE WHEN previous_run.id IS NOT NULL THEN previous.original_price ELSE fallback_previous.original_price END AS previous_original_price,
        CASE WHEN previous_run.id IS NOT NULL THEN previous.final_price ELSE fallback_previous.final_price END AS previous_final_price,
        CASE WHEN previous_run.id IS NOT NULL THEN previous.discount_amount ELSE fallback_previous.discount_amount END AS previous_discount_amount,
        CASE WHEN previous_run.id IS NOT NULL THEN previous.discount_percent::text ELSE fallback_previous.discount_percent::text END AS previous_discount_percent,
        CASE WHEN previous_run.id IS NOT NULL THEN previous.stock_available_count ELSE fallback_previous.stock_available_count END AS previous_stock_available_count,
        previous_run.run_number AS previous_run_number,
        COALESCE(links.supplier_links, '[]'::json) AS supplier_links
      FROM os_products op
      LEFT JOIN current_run ON true
      LEFT JOIN previous_run ON true
      LEFT JOIN LATERAL (
        SELECT ops.*
        FROM os_product_snapshots ops
        WHERE ops.product_id = op.id
          AND ops.scrape_run_id = current_run.id
        ORDER BY ops.scraped_at DESC, ops.created_at DESC
        LIMIT 1
      ) latest ON true
      LEFT JOIN LATERAL (
        SELECT ops.*
        FROM os_product_snapshots ops
        WHERE ops.product_id = op.id
          AND ops.scrape_run_id = previous_run.id
        ORDER BY ops.scraped_at DESC, ops.created_at DESC
        LIMIT 1
      ) previous ON true
      LEFT JOIN ranked_snapshots fallback_latest ON fallback_latest.product_id = op.id AND fallback_latest.product_row_number = 1
      LEFT JOIN ranked_snapshots fallback_previous ON fallback_previous.product_id = op.id AND fallback_previous.product_row_number = 2
LEFT JOIN LATERAL (
  SELECT json_agg(
    json_build_object(
      'source', opl.source,
      'url', opl.source_url,
      'current', CASE
        WHEN (CASE WHEN current_run.id IS NOT NULL THEN link_current.id ELSE link_latest.id END) IS NULL THEN NULL
        ELSE json_build_object(
        'snapshotId', CASE WHEN current_run.id IS NOT NULL THEN link_current.id ELSE link_latest.id END,
        'runId', CASE WHEN current_run.id IS NOT NULL THEN current_run.id ELSE NULL END,
        'runNumber', CASE WHEN current_run.id IS NOT NULL THEN current_run.run_number ELSE NULL END,
        'scrapedAt', CASE WHEN current_run.id IS NOT NULL THEN link_current.scraped_at ELSE link_latest.scraped_at END,
        'originalPrice', CASE WHEN current_run.id IS NOT NULL THEN link_current.original_price ELSE link_latest.original_price END,
        'finalPrice', CASE WHEN current_run.id IS NOT NULL THEN link_current.final_price ELSE link_latest.final_price END,
        'discountAmount', CASE WHEN current_run.id IS NOT NULL THEN link_current.discount_amount ELSE link_latest.discount_amount END,
        'discountPercent', CASE WHEN current_run.id IS NOT NULL THEN link_current.discount_percent::text ELSE link_latest.discount_percent::text END,
        'stockStatus', CASE WHEN current_run.id IS NOT NULL THEN link_current.stock_status ELSE link_latest.stock_status END,
        'stockAvailableCount', CASE WHEN current_run.id IS NOT NULL THEN link_current.stock_available_count ELSE link_latest.stock_available_count END
      ) END,
      'previous', CASE
        WHEN (CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.id ELSE link_previous.id END) IS NULL THEN NULL
        ELSE json_build_object(
        'snapshotId', CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.id ELSE link_previous.id END,
        'runId', CASE WHEN previous_run.id IS NOT NULL THEN previous_run.id ELSE NULL END,
        'runNumber', CASE WHEN previous_run.id IS NOT NULL THEN previous_run.run_number ELSE NULL END,
        'scrapedAt', CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.scraped_at ELSE link_previous.scraped_at END,
        'originalPrice', CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.original_price ELSE link_previous.original_price END,
        'finalPrice', CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.final_price ELSE link_previous.final_price END,
        'discountAmount', CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.discount_amount ELSE link_previous.discount_amount END,
        'discountPercent', CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.discount_percent::text ELSE link_previous.discount_percent::text END,
        'stockStatus', CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.stock_status ELSE link_previous.stock_status END,
        'stockAvailableCount', CASE WHEN previous_run.id IS NOT NULL THEN link_previous_run.stock_available_count ELSE link_previous.stock_available_count END
      ) END,
      'snapshots', COALESCE(link_snapshots.snapshots, '[]'::json)
    )
    ORDER BY opl.source
  ) AS supplier_links
  FROM os_product_links opl
  LEFT JOIN LATERAL (
    SELECT ops.*
    FROM os_product_snapshots ops
    WHERE ops.product_link_id = opl.id
      AND ops.scrape_run_id = current_run.id
    ORDER BY ops.scraped_at DESC, ops.created_at DESC
    LIMIT 1
  ) link_current ON true
  LEFT JOIN LATERAL (
    SELECT ops.*
    FROM os_product_snapshots ops
    WHERE ops.product_link_id = opl.id
      AND ops.scrape_run_id = previous_run.id
    ORDER BY ops.scraped_at DESC, ops.created_at DESC
    LIMIT 1
  ) link_previous_run ON true
  LEFT JOIN ranked_snapshots link_latest ON link_latest.product_link_id = opl.id AND link_latest.link_row_number = 1
  LEFT JOIN ranked_snapshots link_previous ON link_previous.product_link_id = opl.id AND link_previous.link_row_number = 2
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'snapshotId', ops.id,
        'runId', COALESCE(ops.scrape_run_id::text, concat('date:', to_char(ops.scraped_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD'))),
        'runNumber', ospsr.run_number,
        'scrapedAt', ops.scraped_at,
        'originalPrice', ops.original_price,
        'finalPrice', ops.final_price,
        'discountAmount', ops.discount_amount,
        'discountPercent', ops.discount_percent::text,
        'stockStatus', ops.stock_status,
        'stockAvailableCount', ops.stock_available_count
      )
      ORDER BY COALESCE(ospsr.started_at, ops.scraped_at) DESC, ospsr.run_number DESC NULLS LAST, ops.scraped_at DESC
    ) AS snapshots
    FROM os_product_snapshots ops
    LEFT JOIN os_product_scrape_runs ospsr ON ospsr.id = ops.scrape_run_id
    WHERE ops.product_link_id = opl.id
      AND (ospsr.id IS NULL OR (ospsr.user_id = $1 AND ospsr.status = 'completed'))
  ) link_snapshots ON true
  WHERE opl.product_id = op.id
    AND opl.status = 'active'
) links ON true
      WHERE op.user_id = $1
      ORDER BY
        CASE WHEN current_run.id IS NOT NULL THEN latest.scraped_at ELSE fallback_latest.scraped_at END DESC NULLS LAST,
        op.updated_at DESC
    `,
    [userId]
  )
  // const snapshotIds = productsResult.rows
  //   .flatMap((row) => row.supplier_links?.map((link) => link.snapshotId) ?? [])
  //   .filter((value): value is string => Boolean(value))
  const snapshotIds = productsResult.rows
    .flatMap((row) =>
      (row.supplier_links ?? []).flatMap((link) => [
        link.current?.snapshotId,
        link.previous?.snapshotId,
        ...(link.snapshots ?? []).map((snapshot) => snapshot.snapshotId),
      ])
    )
    .filter((value): value is string => Boolean(value))
  const branchStocksResult =
    snapshotIds.length > 0
      ? await query<BranchStockRow>(
          `
            SELECT
              opbs.snapshot_id,
              opl.source,
              opbs.branch_name,
              opbs.stock_text,
              opbs.stock_type,
              opbs.is_available
            FROM os_product_branch_stocks opbs
            INNER JOIN os_product_snapshots ops ON ops.id = opbs.snapshot_id
            LEFT JOIN os_product_links opl ON opl.id = ops.product_link_id
            WHERE opbs.snapshot_id = ANY($1::uuid[])
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
      source: row.source,
      stockText: row.stock_text,
      stockType: row.stock_type,
    })
    branchStocksBySnapshotId.set(row.snapshot_id, current)
  }

  const products = productsResult.rows.map((row) => {
    const supplierLinks = (row.supplier_links ?? []).map((link) => ({
      current: link.current
        ? {
            discountAmount: link.current.discountAmount,
            discountPercent: link.current.discountPercent,
            finalPrice: link.current.finalPrice,
            originalPrice: link.current.originalPrice,
            runId: link.current.runId,
            runNumber: link.current.runNumber,
            scrapedAt: link.current.scrapedAt,
            snapshotId: link.current.snapshotId,
            stockAvailableCount: link.current.stockAvailableCount ?? 0,
            stockStatus: link.current.stockStatus ?? 'not-scraped',
            branchStocks: link.current.snapshotId ? branchStocksBySnapshotId.get(link.current.snapshotId) ?? [] : [],
          }
        : null,
      previous: link.previous
        ? {
            discountAmount: link.previous.discountAmount,
            discountPercent: link.previous.discountPercent,
            finalPrice: link.previous.finalPrice,
            originalPrice: link.previous.originalPrice,
            runId: link.previous.runId,
            runNumber: link.previous.runNumber,
            scrapedAt: link.previous.scrapedAt,
            snapshotId: link.previous.snapshotId,
            stockAvailableCount: link.previous.stockAvailableCount ?? 0,
            stockStatus: link.previous.stockStatus ?? 'not-scraped',
            branchStocks: link.previous.snapshotId ? branchStocksBySnapshotId.get(link.previous.snapshotId) ?? [] : [],
          }
        : null,
      snapshots: (link.snapshots ?? []).map((snapshot) => ({
        discountAmount: snapshot.discountAmount,
        discountPercent: snapshot.discountPercent,
        finalPrice: snapshot.finalPrice,
        originalPrice: snapshot.originalPrice,
        runId: snapshot.runId,
        runNumber: snapshot.runNumber,
        scrapedAt: snapshot.scrapedAt,
        snapshotId: snapshot.snapshotId,
        stockAvailableCount: snapshot.stockAvailableCount ?? 0,
        stockStatus: snapshot.stockStatus ?? 'not-scraped',
        branchStocks: snapshot.snapshotId ? branchStocksBySnapshotId.get(snapshot.snapshotId) ?? [] : [],
      })),
      source: link.source,
      url: link.url,
    }))
    const supplierSnapshots = supplierLinks
      .filter((link) => link.current)
      .map((link) => ({
        discountAmount: link.current?.discountAmount ?? null,
        discountPercent: link.current?.discountPercent ? Number(link.current.discountPercent) : null,
        finalPrice: link.current?.finalPrice ?? null,
        isAvailable: (link.current?.stockAvailableCount ?? 0) > 0 || link.current?.stockStatus === 'available',
        originalPrice: link.current?.originalPrice ?? null,
        scrapedAt: link.current?.scrapedAt ?? null,
        snapshotId: link.current?.snapshotId ?? null,
        source: link.source,
        stockAvailableCount: link.current?.stockAvailableCount ?? 0,
        stockStatus: link.current?.stockStatus ?? 'not-scraped',
        url: link.url,
      }))
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
        primaryImageUrl: row.has_primary_image ? `/os/products/image/${row.id}` : null,
        originalPrice: row.latest_original_price,
      previousDiscountAmount: row.previous_discount_amount,
      previousDiscountPercent: row.previous_discount_percent ? Number(row.previous_discount_percent) : null,
      previousOriginalPrice: row.previous_original_price,
      previousSnapshotAt: row.previous_scraped_at ? row.previous_scraped_at.toISOString() : null,
      sku: row.sku,
      snapshotA: {
        date: toDateKey(row.previous_scraped_at ?? row.latest_scraped_at),
        number: row.previous_run_number,
        price: previousPrice,
        stock: previousStock,
      },
      snapshotB: {
        date: toDateKey(row.latest_scraped_at),
        number: row.latest_run_number,
        price: latestPrice,
        stock: latestStock,
      },
      stockStatus: supplierSnapshots.length === 0 ? 'not-scraped' : latestStock > 0 ? 'available' : 'sold-out',
      status: row.status,
      supplierSnapshots,
        supplierLinks,
        variant: row.variant,
      }
  })

  return { products, snapshots }
}
