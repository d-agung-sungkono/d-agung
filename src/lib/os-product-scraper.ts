import 'server-only'

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

type ApolloProductSku = {
  price?: {
    bottom?: number
    top?: number
  }
}

type ApolloSkuStockGroup = {
  stockGroups?: Array<{
    branchNearbyGroupId?: string
    name?: string
    text?: string
    type?: string
  }>
}

export type ScrapedBranchStock = {
  branchId: string | null
  branchName: string
  isAvailable: boolean
  stockText: string
  stockType: string
}

export type ScrapedProductResult = {
  branchStocks: ScrapedBranchStock[]
  category: string | null
  currency: string
  description: string
  discountAmount: number | null
  discountPercent: number | null
  finalPrice: number | null
  images: string[]
  originalPrice: number | null
  shopeeCopy: string
  sku: string
  source: string
  stockAvailableCount: number
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

function getApolloState(html: string) {
  const match = html.match(/<script id=["']__NEXT_DATA__["'] type=["']application\/json["']>([\s\S]*?)<\/script>/)

  if (!match) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeHtml(match[1]))
    return parsed.props?.pageProps?.apolloState as Record<string, unknown> | undefined
  } catch {
    return null
  }
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

function getSourceName(url: URL) {
  const hostname = url.hostname.replace(/^www\./, '')

  if (hostname === 'jakartanotebook.com') {
    return 'JakartaNotebook'
  }

  if (hostname === 'jackmall.com') {
    return 'Jackmall'
  }

  return 'Jacknote'
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

function getDiscountPercent(originalPrice: number | null, finalPrice: number | null) {
  if (!originalPrice || !finalPrice || originalPrice <= finalPrice) {
    return null
  }

  return Number((((originalPrice - finalPrice) / originalPrice) * 100).toFixed(2))
}

function getStockStatus(branchStocks: ScrapedBranchStock[], fallback: string) {
  if (branchStocks.length === 0) {
    return fallback
  }

  return branchStocks.some((stock) => stock.isAvailable) ? 'available' : 'sold-out'
}

function buildShopeeCopy(product: Omit<ScrapedProductResult, 'shopeeCopy'>) {
  const availableBranches = product.branchStocks
    .filter((branch) => branch.isAvailable)
    .map((branch) => `${branch.branchName} (${branch.stockText})`)
    .join(', ')

  return [
    product.title,
    '',
    product.description,
    '',
    `SKU Supplier: ${product.sku || '-'}`,
    `Varian: ${product.variant || '-'}`,
    `Harga Awal Supplier: ${formatRupiah(product.originalPrice)}`,
    `Diskon Supplier: ${product.discountPercent ? `${product.discountPercent}%` : '-'}${
      product.discountAmount ? ` (${formatRupiah(product.discountAmount)})` : ''
    }`,
    `Harga Jadi Supplier: ${formatRupiah(product.finalPrice)}`,
    `Stok Supplier: ${product.stockStatus}`,
    `Cabang Tersedia: ${availableBranches || '-'}`,
    `Source: ${product.url}`,
  ].join('\n')
}

export async function scrapeSupplierProduct(sourceUrl: string): Promise<ScrapedProductResult> {
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

  const apolloState = getApolloState(html)
  const apolloSku = product.sku ? (apolloState?.[`ProductVariantSku:${product.sku}`] as ApolloProductSku | undefined) : undefined
  const apolloStock = product.sku ? (apolloState?.[`SkuStockGroup:${product.sku}`] as ApolloSkuStockGroup | undefined) : undefined
  const branchStocks =
    apolloStock?.stockGroups?.map((stock) => ({
      branchId: stock.branchNearbyGroupId ?? null,
      branchName: stock.name ?? '-',
      isAvailable: stock.type === 'AVAILABLE',
      stockText: stock.text ?? '-',
      stockType: stock.type ?? 'UNKNOWN',
    })) ?? []
  const metaImages = Array.from(
    new Set(Array.from(html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi)).map((item) => decodeHtml(item[1])))
  )
  const productImages = Array.isArray(product.image) ? product.image : product.image ? [product.image] : []
  const images = Array.from(new Set([...productImages, ...metaImages])).filter(Boolean)
  const finalPrice = product.offers?.price === undefined ? null : Number(product.offers.price)
  const originalPrice = apolloSku?.price?.top ?? finalPrice
  const discountAmount =
    originalPrice && finalPrice && originalPrice > finalPrice ? originalPrice - finalPrice : null
  const discountPercent = getDiscountPercent(originalPrice ?? null, finalPrice ?? null)
  const fallbackStockStatus = product.offers?.availability?.includes('InStock') ? 'available' : 'limited'
  const title = `${product.name ?? getMetaContent(html, 'og:title')}${product.size ? ` - ${product.size}` : ''}${
    product.color ? ` - ${product.color}` : ''
  }`
  const result = {
    branchStocks,
    category: null,
    currency: product.offers?.priceCurrency ?? 'IDR',
    description: product.description ?? getMetaContent(html, 'og:description'),
    discountAmount,
    discountPercent,
    finalPrice: Number.isFinite(finalPrice) ? finalPrice : null,
    images,
    originalPrice: Number.isFinite(originalPrice) ? originalPrice ?? null : null,
    sku: product.sku ?? '',
    source: getSourceName(url),
    stockAvailableCount: branchStocks.filter((branch) => branch.isAvailable).length,
    stockStatus: getStockStatus(branchStocks, fallbackStockStatus),
    title,
    url: url.toString(),
    variant: [product.size, product.color].filter(Boolean).join(' / ') || null,
  }

  return {
    ...result,
    shopeeCopy: buildShopeeCopy(result),
  }
}
