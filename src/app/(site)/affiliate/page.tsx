import type { Metadata } from 'next'
import { connection } from 'next/server'

import AffiliateStorefront from '@/components/affiliate/AffiliateStorefront'
import { fallbackAffiliateProducts, getPublicAffiliateProductsPage } from '@/lib/os-affiliate-products'

import styles from './affiliate.module.css'

const PAGE_SIZE = 10

type SearchValue = string | string[] | undefined

export const metadata: Metadata = {
  title: 'Produk Pilihan | D. Agung',
  description: 'Kumpulan produk pilihan yang bisa dibuka langsung ke marketplace tujuan.',
}

function getSingleValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function normalizeQuery(value: SearchValue) {
  return getSingleValue(value).trim()
}

function normalizePage(value: SearchValue) {
  const parsedPage = Number.parseInt(getSingleValue(value), 10)

  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

function normalizeViewMode(value: SearchValue) {
  return getSingleValue(value) === 'list' ? 'list' : 'grid'
}

export default async function AffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: SearchValue; page?: SearchValue; view?: SearchValue }>
}) {
  await connection()

  const params = await searchParams
  const query = normalizeQuery(params.q)
  const requestedPage = normalizePage(params.page)
  const viewMode = normalizeViewMode(params.view)
  let activeProductCount = fallbackAffiliateProducts.length
  let page = requestedPage
  let products = fallbackAffiliateProducts
  let totalProducts = fallbackAffiliateProducts.length

  try {
    const productsPage = await getPublicAffiliateProductsPage({
      limit: PAGE_SIZE,
      page: requestedPage,
      query,
    })

    activeProductCount = productsPage.activeProductCount
    page = productsPage.page
    products = productsPage.products
    totalProducts = productsPage.totalProducts
  } catch (error) {
    console.error('Failed to load public affiliate products from CMS', error)
    const filteredProducts = filterFallbackAffiliateProducts(query)
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))

    page = Math.min(requestedPage, totalPages)
    products = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    totalProducts = filteredProducts.length
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Produk Pilihan</p>
          <h1 className={styles.title}>Produk Pilihan</h1>
          <p className={styles.intro}>Barang yang saya rekomendasikan untukmu!</p>
        </div>
        <div className={styles.summary} aria-label={`${activeProductCount} produk aktif`}>
          <strong>{activeProductCount}</strong>
          <span>Produk aktif</span>
        </div>
      </header>

      <AffiliateStorefront
        products={products}
        query={query}
        page={page}
        totalPages={totalPages}
        totalProducts={totalProducts}
        pageSize={PAGE_SIZE}
        viewMode={viewMode}
      />
    </main>
  )
}

function filterFallbackAffiliateProducts(searchQuery: string) {
  const normalizedQuery = searchQuery.toLowerCase()

  if (!normalizedQuery) {
    return fallbackAffiliateProducts
  }

  return fallbackAffiliateProducts.filter((product) => {
    const code = product.code.toLowerCase()
    const name = product.name.toLowerCase()

    return code.includes(normalizedQuery) || name.includes(normalizedQuery)
  })
}
