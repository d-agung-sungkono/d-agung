'use client'

import { IconExternalLink, IconLayoutGrid, IconList, IconSearch } from '@tabler/icons-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'

import type { AffiliateMarketplace, AffiliateProduct } from '@/data/affiliate-products'

import styles from './AffiliateStorefront.module.css'

type AffiliateStorefrontProps = {
  products: AffiliateProduct[]
  query: string
  page: number
  totalPages: number
  totalProducts: number
  pageSize: number
}

type ViewMode = 'grid' | 'list'

const marketplaceLabels: Record<AffiliateMarketplace, string> = {
  shopee: 'Shopee',
  tokopedia: 'Tokopedia',
  other: 'Marketplace',
}

function getAffiliateHref(query: string, page: number) {
  const params = new URLSearchParams()

  if (query) {
    params.set('q', query)
  }

  if (page > 1) {
    params.set('page', String(page))
  }

  const search = params.toString()

  return search ? `/affiliate?${search}` : '/affiliate'
}

export default function AffiliateStorefront({
  products,
  query,
  page,
  totalPages,
  totalProducts,
  pageSize,
}: AffiliateStorefrontProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const countLabel = useMemo(() => {
    if (totalProducts === 0) {
      return 'Tidak ada produk'
    }

    const first = (page - 1) * pageSize + 1
    const last = Math.min(page * pageSize, totalProducts)

    return `${first}-${last} dari ${totalProducts} produk`
  }, [page, pageSize, totalProducts])

  return (
    <section className={styles.storefront} aria-label="Daftar produk pilihan">
      <div className={styles.toolbar}>
        <form className={styles.searchForm} action="/affiliate">
          <label className={styles.searchLabel} htmlFor="affiliate-search">
            Cari Produk
          </label>
          <div className={styles.searchControl}>
            <IconSearch size={18} stroke={1.8} aria-hidden="true" />
            <input
              id="affiliate-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Cari nama atau kode produk..."
            />
          </div>
        </form>

        <div className={styles.viewSwitcher} aria-label="Ubah tampilan produk">
          <button
            className={viewMode === 'grid' ? styles.activeView : undefined}
            type="button"
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            title="Grid"
          >
            <IconLayoutGrid size={18} stroke={1.8} aria-hidden="true" />
            <span>Grid</span>
          </button>
          <button
            className={viewMode === 'list' ? styles.activeView : undefined}
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            title="List"
          >
            <IconList size={18} stroke={1.8} aria-hidden="true" />
            <span>List</span>
          </button>
        </div>
      </div>

      <div className={styles.resultBar}>
        <p>{countLabel}</p>
        {query ? <a href="/affiliate">Reset pencarian</a> : null}
      </div>

      {products.length > 0 ? (
        <div className={viewMode === 'grid' ? styles.productGrid : styles.productList}>
          {products.map((product) => (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.imageWrap}>
                <Image src={product.image} alt="" width={600} height={600} />
              </div>
              <div className={styles.productInfo}>
                <p className={styles.productCode}>{product.code}</p>
                <h2 className={styles.productName}>{product.name}</h2>
                <p className={styles.marketplace}>{marketplaceLabels[product.marketplace]}</p>
              </div>
              <div className={styles.productActions}>
                <a href={product.destinationUrl} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink size={17} stroke={1.9} aria-hidden="true" />
                  <span>Buka Produk</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Produk tidak ditemukan.</p>
          <a href="/affiliate">Lihat semua produk</a>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination produk">
          <a className={page <= 1 ? styles.disabledPage : undefined} href={getAffiliateHref(query, page - 1)} aria-disabled={page <= 1}>
            Prev
          </a>
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1

              return (
                <a
                  className={pageNumber === page ? styles.currentPage : undefined}
                  href={getAffiliateHref(query, pageNumber)}
                  key={pageNumber}
                  aria-current={pageNumber === page ? 'page' : undefined}
                >
                  {pageNumber}
                </a>
              )
            })}
          </div>
          <a
            className={page >= totalPages ? styles.disabledPage : undefined}
            href={getAffiliateHref(query, page + 1)}
            aria-disabled={page >= totalPages}
          >
            Next
          </a>
        </nav>
      ) : null}
    </section>
  )
}
