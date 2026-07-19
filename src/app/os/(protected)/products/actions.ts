'use server'

type JsonLdProduct = {
  '@type'?: string
  color?: string
  description?: string
  image?: string | string[]
  name?: string
  offers?: {
    availability?: string
    price?: number | string
    priceCurrency?: string
    url?: string
  }
  size?: string
  sku?: string
}

export type ScrapedProductResult = {
  category: string | null
  currency: string
  description: string
  images: string[]
  price: number | null
  shopeeCopy: string
  sku: string
  source: string
  stockStatus: string
  title: string
  url: string
  variant: string | null
}

function decodeHtml(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function getMetaContent(html: string, property: string) {
  const pattern = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  return decodeHtml(html.match(pattern)?.[1] ?? '')
}

function getJsonLdProducts(html: string) {
  const products: JsonLdProduct[] = []
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = scriptPattern.exec(html))) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]))
      const entries = Array.isArray(parsed) ? parsed : [parsed]

      for (const entry of entries) {
        if (entry?.['@type'] === 'Product') {
          products.push(entry)
        }
      }
    } catch {
      // Ignore non-product structured data blocks.
    }
  }

  return products
}

function normalizeAllowedSource(value: string) {
  const url = new URL(value)
  const hostname = url.hostname.replace(/^www\./, '')
  const isSupported =
    hostname === 'jakartanotebook.com' ||
    hostname === 'jackmall.com' ||
    hostname === 'jacknote.com'

  if (!isSupported) {
    throw new Error('Only JakartaNotebook, Jackmall, or Jacknote product links are supported for now.')
  }

  return url
}

function formatRupiah(value: number | null) {
  if (value === null) {
    return '-'
  }

  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function buildShopeeCopy(product: Omit<ScrapedProductResult, 'shopeeCopy'>) {
  return [
    product.title,
    '',
    product.description,
    '',
    `SKU Supplier: ${product.sku || '-'}`,
    `Varian: ${product.variant || '-'}`,
    `Harga Supplier: ${formatRupiah(product.price)}`,
    `Stok Supplier: ${product.stockStatus}`,
    `Source: ${product.url}`,
  ].join('\n')
}

export async function scrapeProductLink(formData: FormData): Promise<ScrapedProductResult> {
  const sourceUrl = String(formData.get('url') ?? '').trim()

  if (!sourceUrl) {
    throw new Error('Product URL is required.')
  }

  const url = normalizeAllowedSource(sourceUrl)
  const response = await fetch(url.toString(), {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    },
    next: { revalidate: 900 },
  })

  if (!response.ok) {
    throw new Error(`Scrape failed with HTTP ${response.status}.`)
  }

  const html = await response.text()
  const products = getJsonLdProducts(html)
  const product =
    products.find((item) => item.offers?.url === url.toString()) ??
    products.find((item) => item.offers?.url && url.toString().startsWith(item.offers.url)) ??
    products[0]

  if (!product) {
    throw new Error('Product structured data was not found.')
  }

  const metaImages = Array.from(
    new Set(Array.from(html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi)).map((item) => decodeHtml(item[1])))
  )
  const productImages = Array.isArray(product.image) ? product.image : product.image ? [product.image] : []
  const images = Array.from(new Set([...productImages, ...metaImages])).filter(Boolean)
  const price = product.offers?.price === undefined ? null : Number(product.offers.price)
  const stockStatus = product.offers?.availability?.includes('InStock') ? 'available' : 'limited'
  const title = `${product.name ?? getMetaContent(html, 'og:title')}${product.size ? ` - ${product.size}` : ''}${
    product.color ? ` - ${product.color}` : ''
  }`
  const result = {
    category: null,
    currency: product.offers?.priceCurrency ?? 'IDR',
    description: product.description ?? getMetaContent(html, 'og:description'),
    images,
    price: Number.isFinite(price) ? price : null,
    sku: product.sku ?? '',
    source: 'JakartaNotebook',
    stockStatus,
    title,
    url: url.toString(),
    variant: [product.size, product.color].filter(Boolean).join(' / ') || null,
  }

  return {
    ...result,
    shopeeCopy: buildShopeeCopy(result),
  }
}
