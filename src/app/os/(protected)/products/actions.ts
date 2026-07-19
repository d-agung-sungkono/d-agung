'use server'

import { revalidatePath } from 'next/cache'

import { query } from '@/lib/db'
import { scrapeSupplierProduct, type ScrapedProductResult } from '@/lib/os-product-scraper'
import { getOsUserId } from '@/lib/os-settings'

export type { ScrapedProductResult } from '@/lib/os-product-scraper'

export async function scrapeProductLink(formData: FormData): Promise<ScrapedProductResult> {
  const sourceUrl = String(formData.get('url') ?? '').trim()
  return scrapeSupplierProduct(sourceUrl)
}

export async function saveScrapedProduct(formData: FormData) {
  const userId = await getOsUserId()
  const product = await scrapeSupplierProduct(String(formData.get('url') ?? '').trim())
  const productResult = await query<{ id: string }>(
    `
      INSERT INTO os_products (
        user_id,
        source,
        source_url,
        sku,
        title,
        category,
        description,
        variant,
        currency,
        images
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      ON CONFLICT (user_id, source_url)
      DO UPDATE SET
        source = EXCLUDED.source,
        sku = EXCLUDED.sku,
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        variant = EXCLUDED.variant,
        currency = EXCLUDED.currency,
        images = EXCLUDED.images,
        status = 'active',
        updated_at = now()
      RETURNING id
    `,
    [
      userId,
      product.source,
      product.url,
      product.sku,
      product.title,
      product.category,
      product.description,
      product.variant,
      product.currency,
      JSON.stringify(product.images),
    ]
  )

  const snapshotResult = await query<{ id: string }>(
    `
      INSERT INTO os_product_snapshots (
        product_id,
        original_price,
        final_price,
        discount_amount,
        discount_percent,
        stock_status,
        stock_available_count,
        raw_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING id
    `,
    [
      productResult.rows[0].id,
      product.originalPrice,
      product.finalPrice,
      product.discountAmount,
      product.discountPercent,
      product.stockStatus,
      product.stockAvailableCount,
      JSON.stringify(product),
    ]
  )

  for (const branch of product.branchStocks) {
    await query(
      `
        INSERT INTO os_product_branch_stocks (
          snapshot_id,
          branch_id,
          branch_name,
          stock_text,
          stock_type,
          is_available
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        snapshotResult.rows[0].id,
        branch.branchId,
        branch.branchName,
        branch.stockText,
        branch.stockType,
        branch.isAvailable,
      ]
    )
  }

  revalidatePath('/os')
  revalidatePath('/os/products')

  return product
}
