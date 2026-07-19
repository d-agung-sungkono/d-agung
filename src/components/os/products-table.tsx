'use client'

import { Fragment, useMemo, useState } from 'react'

import styles from './os-shell.module.css'

type Product = {
  id: string
  name: string
  sku: string
  platform: string
  category: string
  snapshotA: {
    date: string
    price: number
    stock: number
  }
  snapshotB: {
    date: string
    price: number
    stock: number
  }
  stockStatus: string
  description: string
  url: string
}

type ProductsTableProps = {
  products: Product[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

function getPercentageDifference(previousValue: number, currentValue: number) {
  if (previousValue === 0) {
    return 0
  }

  return ((currentValue - previousValue) / previousValue) * 100
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const defaultWeekStart = products[0]?.snapshotA.date ?? ''
  const defaultWeekEnd = products[0]?.snapshotA.date ?? ''
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const [category, setCategory] = useState('all')
  const [stockStatus, setStockStatus] = useState('all')
  const [weekStart, setWeekStart] = useState(defaultWeekStart)
  const [weekEnd, setWeekEnd] = useState(defaultWeekEnd)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [openProductId, setOpenProductId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [productUrl, setProductUrl] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map((product) => product.category)))], [products])
  const sources = useMemo(() => ['all', ...Array.from(new Set(products.map((product) => product.platform)))], [products])
  const stockStatuses = useMemo(
    () => ['all', ...Array.from(new Set(products.map((product) => product.stockStatus)))],
    [products]
  )

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = query.toLowerCase()
    const matchesQuery =
      product.sku.toLowerCase().includes(normalizedQuery) ||
      product.name.toLowerCase().includes(normalizedQuery)
    const matchesSource = source === 'all' || product.platform === source
    const matchesCategory = category === 'all' || product.category === category
    const matchesStock = stockStatus === 'all' || product.stockStatus === stockStatus
    const matchesWeekStart = weekStart === '' || product.snapshotA.date >= weekStart
    const matchesWeekEnd = weekEnd === '' || product.snapshotA.date <= weekEnd

    return matchesQuery && matchesSource && matchesCategory && matchesStock && matchesWeekStart && matchesWeekEnd
  })

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize)

  function updateFilter(update: () => void) {
    update()
    setPage(1)
  }

  function testProductUrl() {
    try {
      const url = new URL(productUrl)
      const hostname = url.hostname.replace('www.', '')
      const isSupported = hostname.includes('jacknote.com') || hostname.includes('jackmall.com')

      setTestResult(
        isSupported
          ? 'Link looks supported for scraping test.'
          : 'Only Jacknote or Jackmall links are supported for now.'
      )
    } catch {
      setTestResult('Enter a valid product URL first.')
    }
  }

  return (
    <>
      <div className={styles.productToolbar}>
        <input
          className={styles.productSearch}
          onChange={(event) => updateFilter(() => setQuery(event.target.value))}
          placeholder="Cari SKU atau nama produk"
          type="search"
          value={query}
        />
        <select className={styles.productFilter} onChange={(event) => updateFilter(() => setSource(event.target.value))} value={source}>
          {sources.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Source' : item}
            </option>
          ))}
        </select>
        <select className={styles.productFilter} onChange={(event) => updateFilter(() => setCategory(event.target.value))} value={category}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Kategori' : item}
            </option>
          ))}
        </select>
        <select
          className={styles.productFilter}
          onChange={(event) => updateFilter(() => setStockStatus(event.target.value))}
          value={stockStatus}
        >
          {stockStatuses.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Stok' : item}
            </option>
          ))}
        </select>
        <input
          className={styles.productFilter}
          onChange={(event) => updateFilter(() => setWeekStart(event.target.value))}
          type="date"
          value={weekStart}
        />
        <input
          className={styles.productFilter}
          onChange={(event) => updateFilter(() => setWeekEnd(event.target.value))}
          type="date"
          value={weekEnd}
        />
        <button
          className={styles.secondaryButton}
          onClick={() => {
            setQuery('')
            setSource('all')
            setCategory('all')
            setStockStatus('all')
            setWeekStart(defaultWeekStart)
            setWeekEnd(defaultWeekEnd)
            setPage(1)
          }}
          type="button"
        >
          Atur ulang
        </button>
        <button className={styles.primaryButton} onClick={() => setIsAddOpen(true)} type="button">
          Tambah Produk
        </button>
      </div>

      <section className={styles.productTableWrap}>
        <div className={styles.productCount}>
          <span>{filteredProducts.length} Products</span>
          <span>
            Minggu pembanding {weekStart ? formatDate(weekStart) : '-'} sampai {weekEnd ? formatDate(weekEnd) : '-'} vs hari ini
          </span>
        </div>
        <table className={styles.productTable}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Minggu lalu dan stok</th>
              <th>Hari ini dan stok</th>
              <th>Persentase</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => {
              const percentage = getPercentageDifference(product.snapshotA.price, product.snapshotB.price)
              const isOpen = openProductId === product.id

              return (
                <Fragment key={product.id}>
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productTitleCell}>
                        <p className={styles.productTitle}>{product.name}</p>
                        <p className={styles.productSku}>SKU: {product.sku}</p>
                        <p className={styles.productMeta}>
                          {product.platform} · {product.category}
                        </p>
                      </div>
                    </td>
                    <td>
                      <p className={styles.productPrice}>{formatCurrency(product.snapshotA.price)}</p>
                      <p className={styles.productDate}>{formatDate(product.snapshotA.date)}</p>
                      <p className={styles.productSku}>Stok {product.snapshotA.stock}</p>
                    </td>
                    <td>
                      <p className={styles.productPrice}>{formatCurrency(product.snapshotB.price)}</p>
                      <p className={styles.productDate}>{formatDate(product.snapshotB.date)}</p>
                      <p className={styles.productSku}>Stok {product.snapshotB.stock}</p>
                    </td>
                    <td>
                      <span className={percentage <= 0 ? styles.diffDown : styles.diffUp}>
                        {percentage > 0 ? '+' : ''}
                        {percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => setOpenProductId(isOpen ? null : product.id)}
                        type="button"
                      >
                        {isOpen ? 'Tutup' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr>
                      <td className={styles.productDetail} colSpan={5}>
                        <p>{product.description}</p>
                        <a href={product.url} rel="noreferrer" target="_blank">
                          Buka sumber produk
                        </a>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        <div className={styles.pagination}>
          <span>
            Page {safePage} of {pageCount}
          </span>
          <select
            className={styles.pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPage(1)
            }}
            value={pageSize}
          >
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <button className={styles.secondaryButton} disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
            Prev
          </button>
          <button className={styles.secondaryButton} disabled={safePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} type="button">
            Next
          </button>
        </div>
      </section>

      {isAddOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section aria-labelledby="add-product-title" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Products</p>
                <h3 className={styles.modalTitle} id="add-product-title">
                  Tambah Produk
                </h3>
              </div>
              <button
                aria-label="Close add product dialog"
                className={styles.iconCloseButton}
                onClick={() => setIsAddOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form className={styles.modalForm}>
              <label className={styles.field} htmlFor="product-url">
                <span className={styles.label}>Link Jacknote atau Jackmall</span>
                <input
                  className={styles.input}
                  id="product-url"
                  onChange={(event) => {
                    setProductUrl(event.target.value)
                    setTestResult(null)
                  }}
                  placeholder="https://www.jackmall.com/..."
                  type="url"
                  value={productUrl}
                />
              </label>

              {testResult ? <p className={styles.testResult}>{testResult}</p> : null}

              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={testProductUrl} type="button">
                  Test
                </button>
                <button className={styles.primaryButton} onClick={() => setIsAddOpen(false)} type="button">
                  Simpan Link
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
