import 'server-only'

type JsonLdProduct = {
  '@type'?: string
  'http://schema.org/description'?: string
  'http://schema.org/image'?: string
  'http://schema.org/name'?: string
  'http://schema.org/offers'?: {
    'http://schema.org/highPrice'?: number
    'http://schema.org/lowPrice'?: number
    'http://schema.org/offers'?: Array<{
      'http://schema.org/availability'?: string
      'http://schema.org/price'?: number
      'http://schema.org/sku'?: string
    }>
    'http://schema.org/priceCurrency'?: string
  }
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

type JakmallSku = {
  id?: string
  images?: Array<{
    detail?: string
    thumbnail?: string
  }>
  in_stock?: boolean
  is_limited_stock?: boolean
  limited_stock?: number
  price?: {
    discount?: {
      percentage?: number
      value?: number
    } | null
    final?: number
    list?: number
    normal?: number
  }
  sku?: string
  sku_display?: string
  url?: string
}

type JakmallProductState = {
  sku?: Record<string, JakmallSku>
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
  sellerName: string | null
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

function getTextContent(html: string) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
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
        if (entry?.['@type'] === 'Product' || entry?.['@type'] === 'http://schema.org/Product') {
          products.push(entry)
        }
      }
    } catch {
      // Ignore non-product structured data blocks.
    }
  }

  return products
}

function getJakmallProductState(html: string) {
  const startMatch = html.match(/\bvar\s+spdt\s*=/)

  if (startMatch?.index == null) {
    return null
  }

  const objectStart = html.indexOf('{', startMatch.index)

  if (objectStart === -1) {
    return null
  }

  let depth = 0
  let inString: '"' | "'" | null = null
  let isEscaped = false

  for (let index = objectStart; index < html.length; index += 1) {
    const char = html[index]

    if (inString) {
      if (isEscaped) {
        isEscaped = false
      } else if (char === '\\') {
        isEscaped = true
      } else if (char === inString) {
        inString = null
      }

      continue
    }

    if (char === '"' || char === "'") {
      inString = char
      continue
    }

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1

      if (depth === 0) {
        try {
          return JSON.parse(html.slice(objectStart, index + 1)) as JakmallProductState
        } catch {
          return null
        }
      }
    }
  }

  return null
}

function getJakmallSkuStockCount(html: string, selectedSku: JakmallSku | undefined, isAvailable: boolean) {
  if (selectedSku) {
    if (selectedSku.in_stock === false) {
      return 0
    }

    if (selectedSku.is_limited_stock && typeof selectedSku.limited_stock === 'number') {
      return Math.max(0, selectedSku.limited_stock)
    }

    if (selectedSku.in_stock === true) {
      return 10
    }
  }

  const text = getTextContent(html)
  const limitedText = text.match(/\bStok\s+Tinggal\s+(\d+)\b/i)
  const explicitAvailableText = /\bStok\s+Tersedia\b/i.test(text)
  const soldOutText = /\bStok\s+(?:tidak\s+tersedia|Habis)\b/i.test(text)

  if (limitedText) {
    return Number(limitedText[1])
  }

  if (isAvailable && explicitAvailableText) {
    return 10
  }

  if (soldOutText) {
    return 0
  }

  return 0
}

function getJakmallSelectedSku(skuEntries: JakmallSku[], expectedSku: string, url: URL) {
  const normalizedExpectedSku = expectedSku.trim().toLowerCase()

  if (normalizedExpectedSku) {
    const exactMatch = skuEntries.find((item) => {
      const itemSku = (item.sku_display ?? item.sku ?? '').toLowerCase()
      return itemSku === normalizedExpectedSku
    })

    if (exactMatch) {
      return exactMatch
    }
  }

  const normalizedPath = url.pathname.replace(/\/+$/, '')
  const pathMatch = skuEntries.find((item) => {
    if (!item.url) {
      return false
    }

    try {
      return new URL(item.url).pathname.replace(/\/+$/, '') === normalizedPath
    } catch {
      return false
    }
  })

  if (pathMatch) {
    return pathMatch
  }

  const availableMatch = skuEntries.find((item) => item.in_stock === true)
  if (availableMatch) {
    return availableMatch
  }

  return skuEntries[0] ?? null
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
    hostname === 'jakmall.com' ||
    hostname === 'jacknote.com'

  if (!isSupported) {
    throw new Error('Only JakartaNotebook, Jakmall, or Jacknote product links are supported for now.')
  }

  return url
}

function getSourceName(url: URL) {
  const hostname = url.hostname.replace(/^www\./, '')

  if (hostname === 'jakartanotebook.com') {
    return 'JakartaNotebook'
  }

  if (hostname === 'jakmall.com') {
    return 'Jakmall'
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
    `Penjual Supplier: ${product.sellerName || '-'}`,
    `Stok Supplier: ${product.stockStatus}`,
    `Cabang Tersedia: ${availableBranches || '-'}`,
    `Source: ${product.url}`,
  ].join('\n')
}

function getJakmallSellerName(html: string) {
  const text = getTextContent(html)
  const sellerMatch = text.match(/Informasi Penjual\s+(.+?)\s+(?:Chat Penjual|[\d.]+\/5|Data penjualan|Dukungan Pengiriman)/i)

  return sellerMatch?.[1]?.trim() || null
}

function getJsonLdName(product: JsonLdProduct) {
  return product.name ?? product['http://schema.org/name']
}

function getJsonLdDescription(product: JsonLdProduct) {
  return product.description ?? product['http://schema.org/description']
}

function getJsonLdImage(product: JsonLdProduct) {
  return product.image ?? product['http://schema.org/image']
}

function getJsonLdOfferUrl(product: JsonLdProduct) {
  return product.offers?.url
}

function getJsonLdOfferForSku(product: JsonLdProduct, expectedSku: string) {
  const offers = product['http://schema.org/offers']?.['http://schema.org/offers'] ?? []
  return offers.find((offer) => offer['http://schema.org/sku'] === expectedSku) ?? null
}

function buildJakmallResult({
  expectedSku,
  html,
  product,
  source,
  url,
}: {
  expectedSku: string
  html: string
  product: JsonLdProduct
  source: string
  url: URL
}) {
  const state = getJakmallProductState(html)
  const skuEntries = Object.values(state?.sku ?? {})
  const selectedSku = getJakmallSelectedSku(skuEntries, expectedSku, url)
  const offer = selectedSku?.sku_display ? getJsonLdOfferForSku(product, selectedSku.sku_display) : getJsonLdOfferForSku(product, expectedSku)
  const sku = selectedSku?.sku_display ?? selectedSku?.sku ?? offer?.['http://schema.org/sku'] ?? expectedSku
  const finalPrice = selectedSku?.price?.final ?? offer?.['http://schema.org/price'] ?? product['http://schema.org/offers']?.['http://schema.org/lowPrice'] ?? null
  const originalPrice = selectedSku?.price?.list ?? selectedSku?.price?.normal ?? product['http://schema.org/offers']?.['http://schema.org/highPrice'] ?? finalPrice
  const discountAmount =
    selectedSku?.price?.discount?.value ??
    (originalPrice && finalPrice && originalPrice > finalPrice ? originalPrice - finalPrice : null)
  const discountPercent =
    selectedSku?.price?.discount?.percentage ?? getDiscountPercent(originalPrice ?? null, finalPrice ?? null)
  const productImages = selectedSku?.images?.map((image) => image.detail ?? image.thumbnail).filter((image): image is string => Boolean(image)) ?? []
  const metaImages = Array.from(
    new Set(Array.from(html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi)).map((item) => decodeHtml(item[1])))
  )
  const isAvailable = Boolean(selectedSku?.in_stock || offer?.['http://schema.org/availability']?.includes('InStock'))
  const stockAvailableCount = getJakmallSkuStockCount(html, selectedSku ?? undefined, isAvailable)
  const sellerName = getJakmallSellerName(html)
  const result = {
    branchStocks: sellerName
      ? [
          {
            branchId: null,
            branchName: sellerName,
            isAvailable: stockAvailableCount > 0,
            stockText: stockAvailableCount > 0 ? String(stockAvailableCount) : 'Habis',
            stockType: stockAvailableCount > 0 ? 'AVAILABLE' : 'SOLD_OUT',
          },
        ]
      : [],
    category: sellerName,
    currency: product['http://schema.org/offers']?.['http://schema.org/priceCurrency'] ?? 'IDR',
    description: getJsonLdDescription(product) ?? getMetaContent(html, 'og:description'),
    discountAmount,
    discountPercent,
    finalPrice: Number.isFinite(finalPrice) ? finalPrice : null,
    images: Array.from(new Set([...productImages, ...metaImages])).filter(Boolean),
    originalPrice: Number.isFinite(originalPrice) ? originalPrice ?? null : null,
    sellerName,
    sku,
    source,
    stockAvailableCount,
    stockStatus: stockAvailableCount > 0 ? 'available' : 'sold-out',
    title: getJsonLdName(product) ?? getMetaContent(html, 'og:title'),
    url: selectedSku?.url ?? url.toString(),
    variant: null,
  }

  return {
    ...result,
    shopeeCopy: buildShopeeCopy(result),
  }
}

export async function scrapeSupplierProduct(sourceUrl: string, expectedSku = ''): Promise<ScrapedProductResult> {
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
  const source = getSourceName(url)
  const product =
    products.find((item) => getJsonLdOfferUrl(item) === url.toString()) ??
    products.find((item) => {
      const offerUrl = getJsonLdOfferUrl(item)
      return offerUrl && url.toString().startsWith(offerUrl)
    }) ??
    products[0]

  if (!product) {
    throw new Error('Product structured data was not found.')
  }

  if (source === 'Jakmall') {
    return buildJakmallResult({ expectedSku, html, product, source, url })
  }

  const sku = expectedSku || product.sku || ''
  const apolloState = getApolloState(html)
  const apolloSku = sku ? (apolloState?.[`ProductVariantSku:${sku}`] as ApolloProductSku | undefined) : undefined
  const apolloStock = sku ? (apolloState?.[`SkuStockGroup:${sku}`] as ApolloSkuStockGroup | undefined) : undefined
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
  const productImage = getJsonLdImage(product)
  const productImages = Array.isArray(productImage) ? productImage : productImage ? [productImage] : []
  const images = Array.from(new Set([...productImages, ...metaImages])).filter(Boolean)
  const offers = product.offers
  const finalPrice = offers?.price === undefined ? null : Number(offers.price)
  const originalPrice = apolloSku?.price?.top ?? finalPrice
  const discountAmount =
    originalPrice && finalPrice && originalPrice > finalPrice ? originalPrice - finalPrice : null
  const discountPercent = getDiscountPercent(originalPrice ?? null, finalPrice ?? null)
  const fallbackStockStatus = offers?.availability?.includes('InStock') ? 'available' : 'limited'
  const title = `${getJsonLdName(product) ?? getMetaContent(html, 'og:title')}${product.size ? ` - ${product.size}` : ''}${
    product.color ? ` - ${product.color}` : ''
  }`
  const result = {
    branchStocks,
    category: null,
    currency: offers?.priceCurrency ?? 'IDR',
    description: getJsonLdDescription(product) ?? getMetaContent(html, 'og:description'),
    discountAmount,
    discountPercent,
    finalPrice: Number.isFinite(finalPrice) ? finalPrice : null,
    images,
    originalPrice: Number.isFinite(originalPrice) ? originalPrice ?? null : null,
    sellerName: null,
    sku,
    source,
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
