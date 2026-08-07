import process from 'node:process'
import pg from 'pg'

import { getPgSslConfig, loadEnvFile } from './env.mjs'

const { Client } = pg

loadEnvFile()

const PRODUCTS = [
  {
    title: 'Rhodey Sleeve Case Laptop Tablet Macbook Pro Ultra Thin 2mm - Black',
    sku: '7CIP05BK',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/rhodey-sleeve-case-laptop-tablet-macbook-pro-ultra-thin-2mm-14-inch-re214-black',
      Jakmall: 'https://www.jakmall.com/travel-gear-shop/rhodey-sleeve-case-laptop-tablet-macbook-pro-ultra-thin-2mm-re214',
    },
  },
  {
    title: 'Rhodey Sleeve Case Laptop Tablet Macbook Pro Ultra Thin 2mm - Light Gray',
    sku: '7CIP05LR',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/rhodey-sleeve-case-laptop-tablet-macbook-pro-ultra-thin-2mm-14-inch-re214-light-gray',
      Jakmall: 'https://www.jakmall.com/travel-gear-shop/rhodey-sleeve-case-laptop-tablet-macbook-pro-ultra-thin-2mm-re214',
    },
  },
  {
    title: 'One Two Cups Vietnam Drip Coffee Filter Pot Saringan Kopi 124ml',
    sku: '7RHZ31SV',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-vietnam-drip-coffee-filter-pot-saringan-kopi-124ml-7q-lc1-silver',
      Jakmall: 'https://www.jakmall.com/kitchen-depot/one-two-cups-vietnam-drip-coffee-filter-pot-saringan-kopi-lc1',
    },
  },
  {
    title: 'One Two Cups Vietnam Drip Coffee Filter Pot Saringan Kopi 114ml',
    sku: '7RHZ32SV',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-vietnam-drip-coffee-filter-pot-saringan-kopi-114ml-6q-lc1-silver',
      Jakmall: 'https://www.jakmall.com/kitchen-depot/one-two-cups-vietnam-drip-coffee-filter-pot-saringan-kopi-lc1',
    },
  },
  {
    title: 'Beideli Alas Kaki Matras Kamar Mandi Anti-Slip Mats PVC 55cm - Blue',
    sku: '7RTHBEBL',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/beideli-alas-kaki-matras-kamar-mandi-anti-slip-mats-pvc-55cm-pj407-blue',
      Jakmall: 'https://www.jakmall.com/toko-serba-diskon/beideli-alas-kaki-matras-kamar-mandi-anti-slip-mats-pvc-55cm-pj407',
    },
  },
  {
    title: 'One Two Cups Tamper Kopi Espresso Flat Base Stainless Steel 51mm',
    sku: 'Z2HX01SV',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-tamper-kopi-espresso-flat-base-stainless-steel-51mm-ss51-silver',
      Jakmall: 'https://www.jakmall.com/kitchen-depot/one-two-cups-tamper-kopi-espresso-flat-base-stainless-steel-51mm-ss51',
    },
  },
  {
    title: 'ACEITE Botol Wadah Penyaring Minyak Goreng Kaca Tahan Panas 1000ml',
    sku: '7CHT14TP',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/aceite-botol-wadah-penyaring-minyak-goreng-kaca-tahan-panas-1000ml-fl26-transparent',
    },
  },
  {
    title: 'One Two Cups Teko Kopi Leher Angsa Pot V60 Drip Kettle 960ml',
    sku: '7RHX5XSV',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-teko-kopi-leher-angsa-pot-v60-drip-kettle-960ml-rf-15-silver',
      Jakmall: 'https://www.jakmall.com/home-solution/one-two-cups-teko-kopi-leher-angsa-pot-v60-drip-kettle-960ml-rf-15',
    },
  },
  {
    title: 'One Two Cups Gelas Keramik Kopi Teh Vintage Japanese Ceramic - White Pink',
    sku: '7CHKVSWK',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-gelas-keramik-kopi-teh-vintage-japanese-ceramic-cup-200ml-fb014-white-or-pink',
    },
  },
  {
    title: 'One Two Cups Gelas Keramik Kopi Teh Vintage Japanese Ceramic - White Black',
    sku: '7CHKVSBV',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-gelas-keramik-kopi-teh-vintage-japanese-ceramic-cup-200ml-fb014-black-white',
    },
  },
  {
    title: 'One Two Cups Gelas Keramik Kopi Teh Vintage Japanese Ceramic - White Green',
    sku: '7CHKVSWG',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-gelas-keramik-kopi-teh-vintage-japanese-ceramic-cup-200ml-fb014-white-or-green',
    },
  },
  {
    title: 'MACROUPTA Baskom Saringan Cuci Buah Sayuran Double Layer 3pcs',
    sku: '7CHZ8HEW',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/macroupta-baskom-saringan-cuci-buah-sayuran-double-layer-3-pcs-dp151-blue-or-yellow',
      Jakmall: 'https://www.jakmall.com/kitchen-center/macroupta-baskom-saringan-cuci-buah-sayuran-double-layer-3-pcs-dp151',
    },
  },
  {
    title: 'One Two Cups Sedotan Kertas Bungkus Eco Paper Straw 6x197mm 100 PCS',
    sku: '7CTP2GWH',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-sedotan-kertas-bungkus-eco-paper-straw-6x197mm-100-pcs-qw95-white',
      Jakmall: 'https://www.jakmall.com/kitchen-depot/one-two-cups-sedotan-kertas-bungkus-eco-paper-straw-6x197mm-100-pcs-qw95',
    },
  },
  {
    title: 'One Two Cups Botol Minyak Spray Olive Oil BBQ Food 100ml',
    sku: '7RHX9NSV',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-botol-minyak-spray-olive-oil-bbq-food-100ml-hea-1075-silver',
      Jakmall: 'https://www.jakmall.com/kitchen-depot/one-two-cups-botol-minyak-spray-olive-oil-bbq-food-100ml-hea-1075',
    },
  },
  {
    title: 'Winten Rak Penyimpanan Telur Gulir Otomatis 30 Butir',
    sku: '7RHKKHLR',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/winten-rak-penyimpanan-telur-gulir-otomatis-30-butir-wt-30-light-gray',
      Jakmall: 'https://www.jakmall.com/kitchen-center/winten-rak-penyimpanan-telur-gulir-otomatis-30-butir-wt-30',
    },
  },
  {
    title: 'One Two Cups Botol Minyak Borosilicate Glass Oil Pot 900ml',
    sku: '7RHAOOTP',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-botol-minyak-borosilicate-glass-oil-pot-900ml-s2079-transparent',
      Jakmall: 'https://www.jakmall.com/home-solution/one-two-cups-botol-minyak-borosilicate-glass-oil-pot-900ml-s2079',
    },
  },
  {
    title: 'One Two Cups Toples Kaca Penyimpanan Biji Kopi Vacuum Sealed Lid 900ml',
    sku: '7CHKBYBG',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-toples-kaca-penyimpanan-biji-kopi-vacuum-sealed-lid-900ml-se41-black-gold',
    },
  },
  {
    title: 'One Two Cups Milk Jug Pitcher Susu Latte Art Stainless Steel 350ml - Silver',
    sku: '7RHXFHSV',
    links: {
      JakartaNotebook: 'https://www.jakartanotebook.com/p/one-two-cups-milk-jug-pitcher-susu-latte-art-espresso-stainless-steel-350ml-zm078-silver',
    },
  },
]

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function getMetaContent(html, property) {
  const pattern = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  return decodeHtml(html.match(pattern)?.[1] ?? '')
}

function getJsonLdProducts(html) {
  const products = []
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match

  while ((match = scriptPattern.exec(html))) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]))
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      for (const entry of entries) {
        if (entry?.['@type'] === 'Product' || entry?.['@type'] === 'http://schema.org/Product') {
          products.push(entry)
        }
      }
    } catch {
      // Ignore invalid structured data.
    }
  }

  return products
}

function getJakmallState(html) {
  const match = html.match(/\bvar\s+spdt\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function sourceFromUrl(url) {
  const hostname = new URL(url).hostname.replace(/^www\./, '')
  if (hostname === 'jakmall.com') return 'Jakmall'
  if (hostname === 'jakartanotebook.com') return 'JakartaNotebook'
  return 'Jacknote'
}

function normalizeProduct(product, html, url, expectedSku) {
  const source = sourceFromUrl(url)
  const isJakmall = source === 'Jakmall'

  if (isJakmall) {
    const state = getJakmallState(html)
    const selectedSku = Object.values(state?.sku ?? {}).find((sku) => sku.sku_display === expectedSku || sku.sku === expectedSku)
    const offers = product['http://schema.org/offers']
    const offer = offers?.['http://schema.org/offers']?.find((item) => item['http://schema.org/sku'] === expectedSku)
    const finalPrice = selectedSku?.price?.final ?? offer?.['http://schema.org/price'] ?? offers?.['http://schema.org/lowPrice'] ?? null
    const originalPrice = selectedSku?.price?.list ?? selectedSku?.price?.normal ?? offers?.['http://schema.org/highPrice'] ?? finalPrice
    const images = selectedSku?.images?.map((image) => image.detail ?? image.thumbnail).filter(Boolean) ?? []
    const productUrl = selectedSku?.url ?? url

    return {
      branchStocks: [],
      category: null,
      currency: offers?.['http://schema.org/priceCurrency'] ?? 'IDR',
      description: product['http://schema.org/description'] ?? getMetaContent(html, 'og:description'),
      discountAmount: selectedSku?.price?.discount?.value ?? (originalPrice && finalPrice && originalPrice > finalPrice ? originalPrice - finalPrice : null),
      discountPercent: selectedSku?.price?.discount?.percentage ?? (originalPrice && finalPrice && originalPrice > finalPrice ? Number((((originalPrice - finalPrice) / originalPrice) * 100).toFixed(2)) : null),
      finalPrice,
      images,
      originalPrice,
      sku: selectedSku?.sku_display ?? expectedSku,
      source,
      stockAvailableCount: selectedSku?.in_stock ? 1 : 0,
      stockStatus: selectedSku?.in_stock ? 'available' : 'sold-out',
      title: product['http://schema.org/name'] ?? getMetaContent(html, 'og:title'),
      url: productUrl,
      variant: null,
    }
  }

  const sku = expectedSku || product.sku || ''
  const offers = product.offers ?? {}
  const finalPrice = offers.price === undefined ? null : Number(offers.price)

  return {
    branchStocks: [],
    category: null,
    currency: offers.priceCurrency ?? 'IDR',
    description: product.description ?? getMetaContent(html, 'og:description'),
    discountAmount: null,
    discountPercent: null,
    finalPrice,
    images: Array.isArray(product.image) ? product.image : product.image ? [product.image] : [],
    originalPrice: finalPrice,
    sku,
    source,
    stockAvailableCount: offers.availability?.includes('InStock') ? 1 : 0,
    stockStatus: offers.availability?.includes('InStock') ? 'available' : 'limited',
    title: `${product.name ?? getMetaContent(html, 'og:title')}${product.size ? ` - ${product.size}` : ''}${product.color ? ` - ${product.color}` : ''}`,
    url,
    variant: [product.size, product.color].filter(Boolean).join(' / ') || null,
  }
}

async function scrape(url, expectedSku) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const html = await response.text()
  if (html.includes('Human Verification')) {
    throw new Error('Human verification blocked the scrape')
  }

  const product = getJsonLdProducts(html)[0]
  if (!product) {
    throw new Error('Product structured data was not found')
  }

  return normalizeProduct(product, html, url, expectedSku)
}

async function getOsUserId(client) {
  const result = await client.query('SELECT id FROM os_users ORDER BY created_at LIMIT 1')
  if (!result.rows[0]) {
    throw new Error('No os_users row found.')
  }
  return result.rows[0].id
}

async function upsertProduct(client, userId, product) {
  const existing = await client.query(
    'SELECT id FROM os_products WHERE user_id = $1 AND sku = $2 ORDER BY updated_at DESC LIMIT 1',
    [userId, product.sku]
  )

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE os_products
        SET title = $3, category = $4, description = $5, variant = $6,
            currency = $7, images = $8::jsonb, status = 'active', updated_at = now()
        WHERE id = $1 AND user_id = $2
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
      ]
    )
    return existing.rows[0].id
  }

	  const result = await client.query(
    `
      INSERT INTO os_products (user_id, sku, title, category, description, variant, currency, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
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
    ]
  )
  return result.rows[0].id
}

async function upsertMasterProduct(client, userId, item) {
  const existing = await client.query(
    'SELECT id FROM os_products WHERE user_id = $1 AND sku = $2 ORDER BY updated_at DESC LIMIT 1',
    [userId, item.sku]
  )

  if (existing.rows[0]) {
    await client.query(
      'UPDATE os_products SET title = $3, status = $4, updated_at = now() WHERE id = $1 AND user_id = $2',
      [existing.rows[0].id, userId, item.title, 'active']
    )
    return existing.rows[0].id
  }

  const result = await client.query(
    `
      INSERT INTO os_products (user_id, sku, title, currency)
      VALUES ($1, $2, $3, 'IDR')
      RETURNING id
    `,
    [userId, item.sku, item.title]
  )
  return result.rows[0].id
}

async function upsertLink(client, productId, source, sourceUrl) {
  const result = await client.query(
    `
      INSERT INTO os_product_links (product_id, source, source_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id, source)
      DO UPDATE SET source_url = EXCLUDED.source_url, status = 'active', updated_at = now()
      RETURNING id
    `,
    [productId, source, sourceUrl]
  )
  return result.rows[0].id
}

async function insertSnapshot(client, productId, productLinkId, product) {
  const result = await client.query(
    `
      INSERT INTO os_product_snapshots (
        product_id, product_link_id, original_price, final_price, discount_amount, discount_percent,
        stock_status, stock_available_count, raw_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
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
  return result.rows[0].id
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: getPgSslConfig(),
})
const failed = []
let saved = 0

await client.connect()

try {
  const userId = await getOsUserId(client)

  for (const item of PRODUCTS) {
    const productId = await upsertMasterProduct(client, userId, item)

    for (const [source, sourceUrl] of Object.entries(item.links)) {
      let productLinkId = await upsertLink(client, productId, source, sourceUrl)

      try {
        const product = await scrape(sourceUrl, item.sku)
        const scrapedProductId = await upsertProduct(client, userId, product)
        productLinkId = await upsertLink(client, scrapedProductId, product.source, product.url)
        await insertSnapshot(client, scrapedProductId, productLinkId, product)
        saved += 1
        console.log(`saved ${product.sku} ${product.source}`)
      } catch (error) {
        failed.push({
          error: error instanceof Error ? error.message : 'Scrape failed',
          sku: item.sku,
          source,
          url: sourceUrl,
        })
        console.log(`failed ${item.sku} ${source}: ${failed.at(-1).error}`)
      }
    }
  }
} finally {
  await client.end()
}

console.log(JSON.stringify({ failed, saved }, null, 2))
