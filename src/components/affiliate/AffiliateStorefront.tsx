import { IconArticle, IconExternalLink, IconLayoutGrid, IconList, IconSearch } from '@tabler/icons-react'
import Image from 'next/image'

import type { AffiliateMarketplace, AffiliateProduct } from '@/data/affiliate-products'

import styles from './AffiliateStorefront.module.css'

type AffiliateStorefrontProps = {
  products: AffiliateProduct[]
  query: string
  page: number
  totalPages: number
  totalProducts: number
  pageSize: number
  viewMode: ViewMode
}

type ViewMode = 'grid' | 'list'

const marketplaceLabels: Record<AffiliateMarketplace, string> = {
  shopee: 'Shopee',
  tokopedia: 'Tokopedia',
  other: 'Marketplace',
}

function getContentLinkLabel(product: AffiliateProduct, index: number) {
  const contentLink = product.contentLinks?.[index]

  if (!contentLink) {
    return ''
  }

  if (contentLink.title) {
    return contentLink.title
  }

  if (contentLink.platform && contentLink.account) {
    return `${contentLink.platform} @${contentLink.account}`
  }

  if (contentLink.platform) {
    return contentLink.platform
  }

  return `Konten ${index + 1}`
}

function getAffiliateHref(query: string, page: number, viewMode: ViewMode) {
  const params = new URLSearchParams()

  if (query) {
    params.set('q', query)
  }

  if (page > 1) {
    params.set('page', String(page))
  }

  if (viewMode === 'list') {
    params.set('view', viewMode)
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
  viewMode,
}: AffiliateStorefrontProps) {
  const countLabel =
    totalProducts === 0
      ? 'Tidak ada produk'
      : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalProducts)} dari ${totalProducts} produk`

  return (
    <section className={styles.storefront} aria-label="Daftar produk pilihan">
      <div className={styles.toolbar}>
        <form className={styles.searchForm} action="/affiliate">
          <label className={styles.searchLabel} htmlFor="affiliate-search">
            Cari Produk
          </label>
          {viewMode === 'list' ? <input name="view" type="hidden" value="list" /> : null}
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
          <a
            className={viewMode === 'grid' ? styles.activeView : undefined}
            aria-pressed={viewMode === 'grid'}
            href={getAffiliateHref(query, page, 'grid')}
            role="button"
            title="Grid"
          >
            <IconLayoutGrid size={18} stroke={1.8} aria-hidden="true" />
            <span>Grid</span>
          </a>
          <a
            className={viewMode === 'list' ? styles.activeView : undefined}
            aria-pressed={viewMode === 'list'}
            href={getAffiliateHref(query, page, 'list')}
            role="button"
            title="List"
          >
            <IconList size={18} stroke={1.8} aria-hidden="true" />
            <span>List</span>
          </a>
        </div>
      </div>

      <div className={styles.resultBar}>
        <p>{countLabel}</p>
        {query ? <a href={getAffiliateHref('', 1, viewMode)}>Reset pencarian</a> : null}
      </div>

      {products.length > 0 ? (
        <div className={viewMode === 'grid' ? styles.productGrid : styles.productList}>
          {products.map((product) => {
            const visibleContentLinks = product.contentLinks?.slice(0, 2) ?? []
            const hiddenContentLinkCount = Math.max((product.contentLinks?.length ?? 0) - visibleContentLinks.length, 0)

            return (
              <article className={styles.productCard} key={product.id}>
                <div className={styles.imageWrap}>
                  <Image src={product.image} alt="" width={600} height={600} unoptimized />
                </div>
                <div className={styles.productInfo}>
                  <p className={styles.productCode}>{product.code}</p>
                  <h2 className={styles.productName}>{product.name}</h2>
                  <p className={styles.marketplace}>{marketplaceLabels[product.marketplace]}</p>
                  {visibleContentLinks.length > 0 ? (
                    <div className={styles.contentLinks} aria-label={`Konten terkait ${product.name}`}>
                      <p className={styles.contentLinksLabel}>Konten terkait</p>
                      <div className={styles.contentLinkList}>
                        {visibleContentLinks.map((contentLink, index) => (
                          <a href={contentLink.url} key={contentLink.id} target="_blank" rel="noopener noreferrer">
                            <IconArticle size={15} stroke={1.9} aria-hidden="true" />
                            <span>{getContentLinkLabel(product, index)}</span>
                          </a>
                        ))}
                        {hiddenContentLinkCount > 0 ? <span className={styles.contentLinkMore}>+{hiddenContentLinkCount}</span> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className={styles.productActions}>
                  <a href={product.destinationUrl} target="_blank" rel="noopener noreferrer">
                    <IconExternalLink size={17} stroke={1.9} aria-hidden="true" />
                    <span>Buka Produk</span>
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Produk tidak ditemukan.</p>
          <a href="/affiliate">Lihat semua produk</a>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination produk">
          <a
            className={page <= 1 ? styles.disabledPage : undefined}
            href={getAffiliateHref(query, page - 1, viewMode)}
            aria-disabled={page <= 1}
          >
            Prev
          </a>
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1

              return (
                <a
                  className={pageNumber === page ? styles.currentPage : undefined}
                  href={getAffiliateHref(query, pageNumber, viewMode)}
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
            href={getAffiliateHref(query, page + 1, viewMode)}
            aria-disabled={page >= totalPages}
          >
            Next
          </a>
        </nav>
      ) : null}
    </section>
  )
}
