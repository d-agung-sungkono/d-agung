'use server'

import { revalidatePath } from 'next/cache'

import { query } from '@/lib/db'
import { scrapeSupplierProduct, type ScrapedProductResult } from '@/lib/os-product-scraper'
import { getOsUserId } from '@/lib/os-settings'

export type { ScrapedProductResult } from '@/lib/os-product-scraper'

export type BatchScrapeResult = {
  failed: Array<{
    error: string
    sku: string
    source: string
    url: string
  }>
  scraped: ScrapedProductResult[]
}

export async function scrapeProductLink(formData: FormData): Promise<ScrapedProductResult> {
  const sourceUrl = String(formData.get('url') ?? '').trim()
  const sku = String(formData.get('sku') ?? '').trim()
  return scrapeSupplierProduct(sourceUrl, sku)
}

export async function searchSupplierProduct(formData: FormData): Promise<Array<{ source: string; title: string; url: string }>> {
  const sku = String(formData.get('sku') ?? '').trim()

  if (!sku) {
    throw new Error('SKU is required.')
  }

  const searchTerms = Array.from(new Set([sku, sku.replace(/[^a-zA-Z0-9]/g, '')].filter(Boolean)))
  const searchUrls = [
    { source: 'Jakmall', url: 'https://www.jakmall.com/search?search=' },
    { source: 'Jacknote', url: 'https://www.jacknote.com/?s=' },
  ]
  const results: Array<{ source: string; title: string; url: string }> = []

  for (const searchUrl of searchUrls) {
    for (const term of searchTerms) {
      try {
        const response = await fetch(`${searchUrl.url}${encodeURIComponent(term)}`, {
          headers: {
            accept: 'text/html,application/xhtml+xml',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
          },
          next: { revalidate: 3600 },
        })

        if (!response.ok) {
          continue
        }

        const html = await response.text()
        const anchorMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi)

        for (const match of anchorMatches) {
          const href = match[1]
          const title = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          const normalizedUrl = href.startsWith('http') ? href : new URL(href, searchUrl.url).toString()
          const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, '')

          if (!['jakmall.com', 'jacknote.com'].includes(hostname)) {
            continue
          }

          if (!normalizedUrl.match(/\/p\//) && !normalizedUrl.match(/\/product\//)) {
            continue
          }

          const uniqueKey = `${searchUrl.source}:${normalizedUrl}`
          if (!results.some((item) => `${item.source}:${item.url}` === uniqueKey)) {
            results.push({
              source: searchUrl.source,
              title: title || sku,
              url: normalizedUrl,
            })
          }
        }
      } catch {
        continue
      }
    }
  }

  return results
}

function getSourceNameFromUrl(value: string) {
  const hostname = new URL(value).hostname.replace(/^www\./, '')

  if (hostname === 'jakmall.com') {
    return 'Jakmall'
  }

  if (hostname === 'jakartanotebook.com') {
    return 'JakartaNotebook'
  }

  if (hostname === 'jacknote.com') {
    return 'Jacknote'
  }

  throw new Error('Only JakartaNotebook, Jacknote, or Jakmall product links are supported.')
}

async function getPrimaryProductImage(product: ScrapedProductResult) {
  if (product.source !== 'Jakmall') {
    return null
  }

  const imageUrl = product.images[0]

  if (!imageUrl) {
    return null
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream'

    if (!contentType.startsWith('image/')) {
      return null
    }

    const arrayBuffer = await response.arrayBuffer()

    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > 5_000_000) {
      return null
    }

    return {
      data: Buffer.from(arrayBuffer),
      mimeType: contentType,
      sourceUrl: imageUrl,
    }
  } catch {
    return null
  }
}

async function upsertProduct(userId: string, product: ScrapedProductResult) {
  const primaryImage = await getPrimaryProductImage(product)
  const existing = await query<{ id: string }>(
    `
      SELECT id
      FROM os_products
      WHERE user_id = $1
        AND sku = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [userId, product.sku]
  )

  if (existing.rows[0]) {
    await query(
      `
        UPDATE os_products
        SET
          title = $3,
          category = $4,
          description = $5,
          variant = $6,
          currency = $7,
          images = $8::jsonb,
          primary_image = COALESCE($9::bytea, primary_image),
          primary_image_mime_type = CASE WHEN $9::bytea IS NULL THEN primary_image_mime_type ELSE $10 END,
          primary_image_source_url = CASE WHEN $9::bytea IS NULL THEN primary_image_source_url ELSE $11 END,
          primary_image_updated_at = CASE WHEN $9::bytea IS NULL THEN primary_image_updated_at ELSE now() END,
          status = 'active',
          updated_at = now()
        WHERE id = $1
          AND user_id = $2
      `,
      [
        existing.rows[0].id,
        userId,
        product.title,
        product.category,
        product.description,
        product.variant,
        product.currency,
        JSON.stringify(product.images),
        primaryImage?.data ?? null,
        primaryImage?.mimeType ?? null,
        primaryImage?.sourceUrl ?? null,
      ]
    )

    return existing.rows[0].id
  }

  const result = await query<{ id: string }>(
    `
      INSERT INTO os_products (
        user_id,
        sku,
        title,
        category,
        description,
        variant,
        currency,
        images,
        primary_image,
        primary_image_mime_type,
        primary_image_source_url,
        primary_image_updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::bytea, $10, $11, CASE WHEN $9::bytea IS NULL THEN NULL ELSE now() END)
      RETURNING id
    `,
    [
      userId,
      product.sku,
      product.title,
      product.category,
      product.description,
      product.variant,
      product.currency,
      JSON.stringify(product.images),
      primaryImage?.data ?? null,
      primaryImage?.mimeType ?? null,
      primaryImage?.sourceUrl ?? null,
    ]
  )

  return result.rows[0].id
}

async function upsertProductLink(productId: string, product: ScrapedProductResult) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO os_product_links (
        product_id,
        source,
        source_url
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id, source)
      DO UPDATE SET
        source_url = EXCLUDED.source_url,
        status = 'active',
        updated_at = now()
      RETURNING id
    `,
    [productId, product.source, product.url]
  )

  return result.rows[0].id
}

async function upsertRawProductLink(productId: string, sourceUrl: string) {
  const source = getSourceNameFromUrl(sourceUrl)

  await query(
    `
      INSERT INTO os_product_links (
        product_id,
        source,
        source_url
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id, source)
      DO UPDATE SET
        source_url = EXCLUDED.source_url,
        status = 'active',
        updated_at = now()
    `,
    [productId, source, sourceUrl]
  )
}

async function createProductScrapeRun(userId: string, source: 'batch' | 'manual') {
  const existing = await query<{ id: string }>(
    `
      SELECT id
      FROM os_product_scrape_runs
      WHERE user_id = $1
        AND (started_at AT TIME ZONE 'Asia/Jakarta')::date = (now() AT TIME ZONE 'Asia/Jakarta')::date
      ORDER BY started_at DESC, run_number DESC
      LIMIT 1
    `,
    [userId]
  )

  if (existing.rows[0]) {
    return existing.rows[0].id
  }

  const result = await query<{ id: string }>(
    `
      INSERT INTO os_product_scrape_runs (
        user_id,
        run_number,
        source
      )
      SELECT
        $1,
        COALESCE(MAX(run_number), 0) + 1,
        $2
      FROM os_product_scrape_runs
      WHERE user_id = $1
      RETURNING id
    `,
    [userId, source]
  )

  return result.rows[0].id
}

async function completeProductScrapeRun(scrapeRunId: string, status: 'completed' | 'failed') {
  await query(
    `
      UPDATE os_product_scrape_runs
      SET
        status = $2,
        completed_at = now()
      WHERE id = $1
    `,
    [scrapeRunId, status]
  )
}

async function insertProductSnapshot(productId: string, productLinkId: string, product: ScrapedProductResult, scrapeRunId: string | null) {
  const existing = scrapeRunId
    ? await query<{ id: string }>(
        `
          SELECT id
          FROM os_product_snapshots
          WHERE product_id = $1
            AND scrape_run_id = $2::uuid
          LIMIT 1
        `,
        [productId, scrapeRunId]
      )
    : await query<{ id: string }>(
        `
          SELECT id
          FROM os_product_snapshots
          WHERE product_id = $1
            AND scrape_run_id IS NULL
          LIMIT 1
        `,
        [productId]
      )

  if (existing.rows[0]) {
    const snapshotId = existing.rows[0].id

    await query(
      `
        UPDATE os_product_snapshots
        SET
          product_link_id = $2,
          original_price = $3,
          final_price = $4,
          discount_amount = $5,
          discount_percent = $6,
          stock_status = $7,
          stock_available_count = $8,
          raw_payload = $9::jsonb,
          scraped_at = now()
        WHERE id = $1
      `,
      [
        snapshotId,
        productLinkId,
        product.originalPrice,
        product.finalPrice,
        product.discountAmount,
        product.discountPercent,
        product.stockStatus,
        product.stockAvailableCount,
        JSON.stringify(product),
      ]
    )

    await query(
      `
        DELETE FROM os_product_branch_stocks
        WHERE snapshot_id = $1
      `,
      [snapshotId]
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
          snapshotId,
          branch.branchId,
          branch.branchName,
          branch.stockText,
          branch.stockType,
          branch.isAvailable,
        ]
      )
    }

    return
  }

  const snapshotResult = scrapeRunId
    ? await query<{ id: string }>(
        `
          INSERT INTO os_product_snapshots (
            product_id,
            product_link_id,
            scrape_run_id,
            original_price,
            final_price,
            discount_amount,
            discount_percent,
            stock_status,
            stock_available_count,
            raw_payload
          )
          VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10::jsonb)
          RETURNING id
        `,
        [
          productId,
          productLinkId,
          scrapeRunId,
          product.originalPrice,
          product.finalPrice,
          product.discountAmount,
          product.discountPercent,
          product.stockStatus,
          product.stockAvailableCount,
          JSON.stringify(product),
        ]
      )
    : await query<{ id: string }>(
        `
          INSERT INTO os_product_snapshots (
            product_id,
            product_link_id,
            scrape_run_id,
            original_price,
            final_price,
            discount_amount,
            discount_percent,
            stock_status,
            stock_available_count,
            raw_payload
          )
          VALUES ($1, $2, NULL::uuid, $3, $4, $5, $6, $7, $8, $9::jsonb)
          RETURNING id
        `,
        [
          productId,
          productLinkId,
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
}

async function saveScrapedProductResult(userId: string, product: ScrapedProductResult, scrapeRunId: string | null = null) {
  const productId = await upsertProduct(userId, product)
  const productLinkId = await upsertProductLink(productId, product)
  await insertProductSnapshot(productId, productLinkId, product, scrapeRunId)
  return product
}

export async function saveScrapedProduct(formData: FormData) {
  const userId = await getOsUserId()
  const scrapeRunId = await createProductScrapeRun(userId, 'manual')
  const product = await scrapeSupplierProduct(
    String(formData.get('url') ?? '').trim(),
    String(formData.get('sku') ?? '').trim()
  )

  try {
    await saveScrapedProductResult(userId, product, scrapeRunId)
    await completeProductScrapeRun(scrapeRunId, 'completed')
  } catch (error) {
    await completeProductScrapeRun(scrapeRunId, 'failed')
    throw error
  }

  revalidatePath('/os')
  revalidatePath('/os/products')

  return product
}

export async function saveProductSupplierLinks(formData: FormData) {
  const userId = await getOsUserId()
  const sku = String(formData.get('sku') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const urls = [
    String(formData.get('jakmallUrl') ?? '').trim(),
    String(formData.get('jacknoteUrl') ?? '').trim(),
  ].filter(Boolean)

  if (!sku) {
    throw new Error('SKU is required.')
  }

  if (!urls.length) {
    throw new Error('At least one supplier URL is required.')
  }

  const existing = await query<{ id: string }>(
    `
      SELECT id
      FROM os_products
      WHERE user_id = $1
        AND sku = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [userId, sku]
  )
  const productId =
    existing.rows[0]?.id ??
    (
      await query<{ id: string }>(
        `
          INSERT INTO os_products (
            user_id,
            sku,
            title,
            currency
          )
          VALUES ($1, $2, $3, 'IDR')
          RETURNING id
        `,
        [userId, sku, title || sku]
      )
    ).rows[0].id

  if (existing.rows[0]) {
    await query(
      `
        UPDATE os_products
        SET
          title = CASE WHEN $3 = '' THEN title ELSE $3 END,
          status = 'active',
          updated_at = now()
        WHERE id = $1
          AND user_id = $2
      `,
      [productId, userId, title]
    )
  }

  for (const url of urls) {
    await upsertRawProductLink(productId, url)
  }

  revalidatePath('/os')
  revalidatePath('/os/products')
}

export async function scrapeAllProductLinks(): Promise<BatchScrapeResult> {
  const userId = await getOsUserId()
  const linksResult = await query<{
    sku: string
    source: string
    source_url: string
  }>(
    `
      SELECT
        op.sku,
        opl.source,
        opl.source_url
      FROM os_product_links opl
      INNER JOIN os_products op ON op.id = opl.product_id
      WHERE op.user_id = $1
        AND op.status = 'active'
        AND opl.status = 'active'
      ORDER BY op.sku, opl.source
    `,
    [userId]
  )
  const scraped: ScrapedProductResult[] = []
  const failed: BatchScrapeResult['failed'] = []

  for (const link of linksResult.rows) {
    try {
      const product = await scrapeSupplierProduct(link.source_url, link.sku)
      scraped.push(product)
    } catch (error) {
      failed.push({
        error: error instanceof Error ? error.message : 'Scrape failed.',
        sku: link.sku,
        source: link.source,
        url: link.source_url,
      })
    }
  }

  return { failed, scraped }
}

export async function saveScrapedProductBatch(formData: FormData) {
  const userId = await getOsUserId()
  const rawProducts = String(formData.get('products') ?? '')
  const products = JSON.parse(rawProducts) as ScrapedProductResult[]

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('No scraped products to save.')
  }

  const scrapeRunId = await createProductScrapeRun(userId, 'batch')

  try {
    for (const product of products) {
      await saveScrapedProductResult(userId, product, scrapeRunId)
    }

    await completeProductScrapeRun(scrapeRunId, 'completed')
  } catch (error) {
    await completeProductScrapeRun(scrapeRunId, 'failed')
    throw error
  }

  revalidatePath('/os')
  revalidatePath('/os/products')

  return { saved: products.length }
}
