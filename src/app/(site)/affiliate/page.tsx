import type { Metadata } from 'next'
import { connection } from 'next/server'

import AffiliateStorefront from '@/components/affiliate/AffiliateStorefront'
import { fallbackAffiliateProducts, getPublicAffiliateProducts } from '@/lib/os-affiliate-products'

import styles from './affiliate.module.css'

const PAGE_SIZE = 12

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

export default async function AffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: SearchValue; page?: SearchValue }>
}) {
  await connection()

  const params = await searchParams
  let products = fallbackAffiliateProducts

  try {
    products = await getPublicAffiliateProducts()
  } catch (error) {
    console.error('Failed to load public affiliate products from CMS', error)
  }

  const query = normalizeQuery(params.q)
  const normalizedQuery = query.toLowerCase()
  const requestedPage = normalizePage(params.page)
  const filteredProducts = normalizedQuery
    ? products.filter((product) => {
        const code = product.code.toLowerCase()
        const name = product.name.toLowerCase()

        return code.includes(normalizedQuery) || name.includes(normalizedQuery)
      })
    : products
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const visibleProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Produk Pilihan</p>
          <h1 className={styles.title}>Produk Pilihan</h1>
          <p className={styles.intro}>Barang yang saya rekomendasikan untukmu!</p>
        </div>
        <div className={styles.summary} aria-label={`${products.length} produk aktif`}>
          <strong>{products.length}</strong>
          <span>Produk aktif</span>
        </div>
      </header>

      <AffiliateStorefront
        products={visibleProducts}
        query={query}
        page={page}
        totalPages={totalPages}
        totalProducts={filteredProducts.length}
        pageSize={PAGE_SIZE}
      />
    </main>
  )
}
