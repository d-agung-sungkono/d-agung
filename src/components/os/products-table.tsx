'use client'

import { ActionIcon, Box, Button, Card, Group, Modal, Select, SimpleGrid, Table, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { IconCopy, IconDeviceFloppy, IconEdit, IconEye, IconPlus, IconRefresh, IconTestPipe, IconX } from '@tabler/icons-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Fragment, useMemo, useState, useTransition } from 'react'

import {
    saveScrapedProductBatch,
    saveProductSupplierLinks,
    scrapeAllProductLinks,
    scrapeProductLink,
    type ScrapedProductResult,
} from '@/app/os/(protected)/products/actions'

import styles from './os-shell.module.css'

type Product = {
  branchStocks: Array<{
    branchName: string
    isAvailable: boolean
    stockText: string
    stockType: string
  }>
  id: string
  name: string
  primaryImageUrl: string | null
  sku: string
  category: string
  originalPrice: number | null
  discountAmount: number | null
  discountPercent: number | null
  previousOriginalPrice: number | null
  previousDiscountAmount: number | null
  previousDiscountPercent: number | null
  previousSnapshotAt: string | null
  variant: string | null
  snapshotA: {
    date: string
    number: number | null
    price: number
    stock: number
  }
  snapshotB: {
    date: string
    number: number | null
    price: number
    stock: number
  }
  stockStatus: string
  supplierLinks: Array<{
    source: string
    url: string
    current?: {
      discountAmount: number | null
      discountPercent: string | null
      finalPrice: number | null
      originalPrice: number | null
      runId: string | null
      runNumber: number | null
      scrapedAt: string | null
      snapshotId: string | null
      stockAvailableCount: number
      stockStatus: string
      branchStocks: Array<{
        branchName: string
        isAvailable: boolean
        stockText: string
        stockType: string
      }>
    } | null
    previous?: {
      discountAmount: number | null
      discountPercent: string | null
      finalPrice: number | null
      originalPrice: number | null
      runId: string | null
      runNumber: number | null
      scrapedAt: string | null
      snapshotId: string | null
      stockAvailableCount: number
      stockStatus: string
      branchStocks: Array<{
        branchName: string
        isAvailable: boolean
        stockText: string
        stockType: string
      }>
    } | null
    snapshots: Array<{
      discountAmount: number | null
      discountPercent: string | null
      finalPrice: number | null
      originalPrice: number | null
      runId: string | null
      runNumber: number | null
      scrapedAt: string | null
      snapshotId: string | null
      stockAvailableCount: number
      stockStatus: string
      branchStocks: Array<{
        branchName: string
        isAvailable: boolean
        stockText: string
        stockType: string
      }>
    }>
  }>
  description: string
  status: string
}

type ProductsTableProps = {
  products: Product[]
  snapshots: Array<{
    date: string
    id: string
    number: number | null
    type: 'date' | 'run'
  }>
}

const supplierOrder = ['jaknote', 'jakmall']
const supplierColumns = [
  { key: 'jakmall', label: 'Jakmall' },
  { key: 'jaknote', label: 'Jaknote' },
]

function getOrderedSupplierLinks(links: Product['supplierLinks']) {
  return [...links].sort((left, right) => {
    const leftIndex = supplierOrder.indexOf(left.source.toLowerCase())
    const rightIndex = supplierOrder.indexOf(right.source.toLowerCase())

    if (leftIndex === -1 && rightIndex === -1) {
      return left.source.localeCompare(right.source)
    }

    if (leftIndex === -1) {
      return 1
    }

    if (rightIndex === -1) {
      return -1
    }

    return leftIndex - rightIndex
  })
}

function getSourceKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isSupplierColumnSource(source: string, columnKey: string) {
  const sourceKey = getSourceKey(source)
  const normalizedColumnKey = getSourceKey(columnKey)

  if (normalizedColumnKey === 'jaknote' || normalizedColumnKey === 'jacknote' || normalizedColumnKey === 'jakartanotebook') {
    return sourceKey === 'jaknote' || sourceKey === 'jacknote' || sourceKey === 'jakartanotebook'
  }

  return sourceKey === normalizedColumnKey
}

function getSupplierLink(product: Product, columnKey: string) {
  return product.supplierLinks.find((link) => isSupplierColumnSource(link.source, columnKey))
}

function getSupplierSnapshotForRun(link: Product['supplierLinks'][number], runId: string) {
  return link.snapshots.find((snapshot) => snapshot.runId === runId) ?? null
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

function formatSnapshotDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

function formatSnapshotLabel(value: { date: string; number: number | null } | null | undefined, fallback: string) {
  if (!value?.date) {
    return fallback
  }

  const label = value.number ? `Snapshot ${value.number}` : 'Snapshot'
  return `${label} (${formatSnapshotDate(value.date)})`
}

function getPercentageDifference(previousValue: number, currentValue: number) {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 100
  }

  return ((currentValue - previousValue) / previousValue) * 100
}

function getSnapshotDifference(previousValue: number | null | undefined, currentValue: number | null | undefined) {
  if (previousValue == null || currentValue == null) {
    return 0
  }

  return getPercentageDifference(previousValue, currentValue)
}

function formatDiscount(percent: number | null, amount: number | null) {
  if (!percent && !amount) {
    return '-'
  }

  return `${percent ? `${percent}%` : '-'}${amount ? ` (${formatCurrency(amount)})` : ''}`
}

function formatPrice(value: number | null | undefined) {
  return value ? formatCurrency(value) : '-'
}

function formatStock(value: { stockAvailableCount: number; stockStatus: string } | null | undefined) {
  if (!value) {
    return '-'
  }

  if (value.stockAvailableCount > 0) {
    return String(value.stockAvailableCount)
  }

  if (value.stockStatus === 'available') {
    return 'Tersedia'
  }

  if (value.stockStatus === 'sold-out') {
    return 'Habis'
  }

  return value.stockStatus || '-'
}

function isOutOfStock(value: { stockAvailableCount: number; stockStatus: string } | null | undefined) {
  return Boolean(value && value.stockAvailableCount <= 0 && value.stockStatus === 'sold-out')
}

function getSnapshotViewForLink(
  product: Product,
  source: string,
  selectedSnapshotId: string,
  draftScrape: { products: ScrapedProductResult[] } | null
) {
  const link = getSupplierLink(product, source)
  const draftSnapshot = draftScrape?.products.find(
    (item) => item.sku === product.sku && isSupplierColumnSource(item.source, source)
  )

  if (draftSnapshot) {
    return {
      finalPrice: draftSnapshot.finalPrice,
      stockAvailableCount: draftSnapshot.stockAvailableCount,
      stockStatus: draftSnapshot.stockStatus,
    }
  }

  if (!link) {
    return null
  }

  return getSupplierSnapshotForRun(link, selectedSnapshotId)
}

export default function ProductsTable({ products, snapshots }: ProductsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const defaultComparisonSnapshotId = snapshots[0]?.id ?? ''
  const defaultBaselineSnapshotId = snapshots[1]?.id ?? snapshots[0]?.id ?? ''
  const [query, setQuery] = useState('')
  const [selectedBaselineSnapshotId, setSelectedBaselineSnapshotId] = useState(defaultBaselineSnapshotId)
  const [selectedComparisonSnapshotId, setSelectedComparisonSnapshotId] = useState(defaultComparisonSnapshotId)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('5')
  const [openProductId, setOpenProductId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isScrapeOpen, setIsScrapeOpen] = useState(false)
  const [isJakmallSoldOutOpen, setIsJakmallSoldOutOpen] = useState(false)
  const [updateProduct, setUpdateProduct] = useState<Product | null>(null)
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateJakmallUrl, setUpdateJakmallUrl] = useState('')
  const [updateJaknoteUrl, setUpdateJaknoteUrl] = useState('')
  const [linkTestResult, setLinkTestResult] = useState<string | null>(null)
  const [jakmallUrl, setJakmallUrl] = useState('')
  const [jaknoteUrl, setJaknoteUrl] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProductResult | null>(null)
  const [copyState, setCopyState] = useState<string | null>(null)
  const [draftScrape, setDraftScrape] = useState<{
    failed: Array<{ error: string; sku: string; source: string; url: string }>
    products: ScrapedProductResult[]
    scrapedAt: string
  } | null>(null)
  const pageSizeNumber = Number(pageSize)
  const hasDraftScrape = Boolean(draftScrape?.products.length)

  const snapshotOptions = useMemo(
    () =>
      snapshots.map((snapshot) => ({
        label: formatSnapshotLabel(snapshot, `Snapshot (${formatSnapshotDate(snapshot.date)})`),
        value: snapshot.id,
      })),
    [snapshots]
  )

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = query.toLowerCase()
    const matchesQuery =
      product.sku.toLowerCase().includes(normalizedQuery) ||
      product.name.toLowerCase().includes(normalizedQuery)

    const matchesStatus = statusFilter === 'all' || product.status === statusFilter

    return matchesQuery && matchesStatus
  })

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSizeNumber))
  const safePage = Math.min(page, pageCount)
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSizeNumber, safePage * pageSizeNumber)
  const jakmallSoldOutProducts = filteredProducts
    .map((product) => ({
      product,
      snapshot: getSnapshotViewForLink(product, 'jakmall', selectedComparisonSnapshotId, draftScrape),
    }))
    .filter((item) => isOutOfStock(item.snapshot))

  function updateFilter(update: () => void) {
    update()
    setPage(1)
  }

  function resetProductsView() {
    setQuery('')
    setStatusFilter('all')
    setSelectedBaselineSnapshotId(defaultBaselineSnapshotId)
    setSelectedComparisonSnapshotId(defaultComparisonSnapshotId)
    setOpenProductId(null)
    setIsAddOpen(false)
    setUpdateProduct(null)
    setIsJakmallSoldOutOpen(false)
    setLinkTestResult(null)
    setScrapedProduct(null)
    setCopyState(null)
    setPageSize('5')
    setDraftScrape(null)
    setIsScrapeOpen(false)
    setTestResult(null)
    setPage(1)
  }

  function searchProduct() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('url', jakmallUrl)
      setScrapedProduct(null)
      setTestResult(null)

      try {
        const result = await scrapeProductLink(formData)
        setScrapedProduct(result)
        setTestResult('Scrape Jakmall berhasil. Cek data, isi link Jaknote kalau ada, lalu simpan.')
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Scrape Jakmall failed.')
      }
    })
  }

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopyState(key)
    window.setTimeout(() => setCopyState(null), 1300)
  }

  function saveSnapshot() {
    if (!scrapedProduct) {
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('products', JSON.stringify([scrapedProduct]))

      try {
        await saveScrapedProductBatch(formData)
        if (jaknoteUrl.trim()) {
          const linksFormData = new FormData()
          linksFormData.set('sku', scrapedProduct.sku)
          linksFormData.set('title', scrapedProduct.title)
          linksFormData.set('jakmallUrl', scrapedProduct.url || jakmallUrl)
          linksFormData.set('jacknoteUrl', jaknoteUrl)
          await saveProductSupplierLinks(linksFormData)
        }
        setIsAddOpen(false)
        setJakmallUrl('')
        setJaknoteUrl('')
        setScrapedProduct(null)
        setTestResult('Snapshot tersimpan. Scrape berikutnya akan jadi pembanding trend.')
        router.refresh()
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Save failed.')
      }
    })
  }

  function refreshDraftScrape() {
    startTransition(async () => {
      try {
        const result = await scrapeAllProductLinks()
        setDraftScrape({
          failed: result.failed,
          products: result.scraped,
          scrapedAt: new Date().toISOString(),
        })
        setTestResult(
          `Draft scrape siap: ${result.scraped.length} berhasil${
            result.failed.length ? `, ${result.failed.length} gagal.` : '.'
          } Review dulu di modal scrape sebelum disimpan.`
        )
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Batch scrape failed.')
      }
    })
  }

  function scrapeAllLinks() {
    setIsScrapeOpen(true)
    refreshDraftScrape()
  }

  function openUpdateProductModal(product: Product) {
    setUpdateProduct(product)
    setUpdateTitle(product.name)
    setUpdateJakmallUrl(getSupplierLink(product, 'jakmall')?.url ?? '')
    setUpdateJaknoteUrl(getSupplierLink(product, 'jaknote')?.url ?? '')
    setLinkTestResult(null)
  }

  function testUpdatedLink(source: string, url: string) {
    if (!updateProduct) {
      return
    }

    if (!url.trim()) {
      setLinkTestResult(`${source}: link masih kosong.`)
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('sku', updateProduct.sku)
      formData.set('url', url)

      try {
        const result = await scrapeProductLink(formData)
        setLinkTestResult(
          `${source}: scrape berhasil. ${formatPrice(result.finalPrice)} · Stock: ${formatStock({
            stockAvailableCount: result.stockAvailableCount,
            stockStatus: result.stockStatus,
          })}`
        )
      } catch (error) {
        setLinkTestResult(`${source}: ${error instanceof Error ? error.message : 'Test scrape gagal.'}`)
      }
    })
  }

  function saveUpdatedLinks() {
    if (!updateProduct) {
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('sku', updateProduct.sku)
      formData.set('title', updateTitle)
      formData.set('jakmallUrl', updateJakmallUrl)
      formData.set('jacknoteUrl', updateJaknoteUrl)

      try {
        await saveProductSupplierLinks(formData)
        setUpdateProduct(null)
        setLinkTestResult(null)
        setTestResult(`Link ${updateProduct.sku} berhasil diupdate.`)
        router.refresh()
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Update link failed.')
      }
    })
  }

  function saveDraftSnapshot() {
    if (!draftScrape?.products.length) {
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('products', JSON.stringify(draftScrape.products))

      try {
        const result = await saveScrapedProductBatch(formData)
        setDraftScrape(null)
        setIsScrapeOpen(false)
        setTestResult(`${result.saved} hasil scrape tersimpan sebagai snapshot baru.`)
        router.refresh()
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Save draft snapshot failed.')
      }
    })
  }

  function getDraftProductSnapshot(sku: string, source: string) {
    return draftScrape?.products.find(
      (product) => product.sku === sku && isSupplierColumnSource(product.source, source)
    )
  }

  const selectedBaselineSnapshot = snapshots.find((snapshot) => snapshot.id === selectedBaselineSnapshotId) ?? null
  const selectedComparisonSnapshot = snapshots.find((snapshot) => snapshot.id === selectedComparisonSnapshotId) ?? null

  return (
    <>
      <Box className={styles.productToolbar}>
        <Text className={styles.productFilterLabel}>Cari:</Text>
        <Text className={styles.productFilterLabel}>Periode Sebelum</Text>
        <Text className={styles.productFilterLabel}>Periode Sekarang</Text>
        <Group className={styles.productToolbarActions} gap="xs" justify="flex-end">
          <Button
            leftSection={<IconRefresh size={18} stroke={1.8} />}
            onClick={resetProductsView}
            variant="default"
          >
            Atur ulang
          </Button>
          <Button leftSection={<IconTestPipe size={18} stroke={1.8} />} loading={isPending} onClick={scrapeAllLinks} variant="default">
            Scrape Produk
          </Button>
          <Select
            aria-label="Filter status produk"
            className={styles.productStatusFilter}
            data={[
              { label: 'Semua Status', value: 'all' },
              { label: 'Aktif', value: 'active' },
              { label: 'Arsip', value: 'archived' },
            ]}
            onChange={(value) => updateFilter(() => setStatusFilter(value ?? 'all'))}
            value={statusFilter}
          />
          <Button leftSection={<IconPlus size={18} stroke={1.8} />} onClick={() => setIsAddOpen(true)}>
            Tambah Produk
          </Button>
        </Group>
        <TextInput
          className={styles.productSearchControl}
          onChange={(event) => {
            const { value } = event.currentTarget
            updateFilter(() => setQuery(value))
          }}
          placeholder="Cari SKU atau nama produk"
          type="search"
          value={query}
        />
        <Select
          className={styles.productSnapshotSelect}
          data={snapshotOptions}
          onChange={(value) => updateFilter(() => setSelectedBaselineSnapshotId(value ?? defaultBaselineSnapshotId))}
          placeholder="Pilih periode awal"
          disabled={hasDraftScrape}
          value={selectedBaselineSnapshotId}
        />
        <Select
          className={styles.productSnapshotSelect}
          data={snapshotOptions}
          onChange={(value) => updateFilter(() => setSelectedComparisonSnapshotId(value ?? defaultComparisonSnapshotId))}
          placeholder="Pilih periode pembanding"
          disabled={hasDraftScrape}
          value={selectedComparisonSnapshotId}
        />
      </Box>

      {testResult ? <Text className={styles.testResult}>{testResult}</Text> : null}
      {draftScrape?.failed.length ? (
        <Text className={styles.testResult}>
          Gagal scrape {draftScrape.failed.length} link:{' '}
          {draftScrape.failed.map((item) => `${item.sku} ${item.source}`).join(', ')}
        </Text>
      ) : null}

      <button className={styles.productInsightCard} onClick={() => setIsJakmallSoldOutOpen(true)} type="button">
        <Group justify="space-between" align="flex-start" gap="md">
          <Box>
            <Text className={styles.productInsightEyebrow}>Insight Snapshot Sekarang</Text>
            <Text className={styles.productInsightTitle}>Jakmall stock habis</Text>
            <Text className={styles.productInsightMeta}>
              {hasDraftScrape
                ? `Berdasarkan draft scrape ${formatDate(draftScrape?.scrapedAt ?? '')}`
                : `Berdasarkan ${formatSnapshotLabel(selectedComparisonSnapshot, 'periode pembanding')}`}
            </Text>
          </Box>
          <Box className={styles.productInsightMetric}>
            <Text>{jakmallSoldOutProducts.length}</Text>
            <span>produk</span>
          </Box>
        </Group>
        <Text className={styles.productInsightMeta}>
          Klik untuk lihat daftar produk yang habis.
        </Text>
      </button>

      <Box component="section" className={styles.productTableWrap}>
        <Group justify="space-between" className={styles.productCount}>
          <Text>{filteredProducts.length} Products</Text>
          <Text>
            {hasDraftScrape
              ? `Draft scrape ${formatDate(draftScrape?.scrapedAt ?? '')} vs ${formatSnapshotLabel(selectedComparisonSnapshot, 'snapshot terakhir')}`
              : `${formatSnapshotLabel(selectedBaselineSnapshot, 'Periode awal')} vs ${formatSnapshotLabel(selectedComparisonSnapshot, 'periode pembanding')}`}
          </Text>
        </Group>
        <Table className={styles.productTable} verticalSpacing="sm">
          <colgroup>
            <col className={styles.productTitleColumn} />
            <col className={styles.productSnapshotColumn} />
            <col className={styles.productSnapshotColumn} />
            <col className={styles.productActionColumn} />
          </colgroup>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Snapshot Sebelum</Table.Th>
              <Table.Th>{hasDraftScrape ? 'Draft Sekarang' : 'Snapshot Sekarang'}</Table.Th>
              <Table.Th>Aksi</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedProducts.map((product) => {
              const isOpen = openProductId === product.id
              const supplierLinks = getOrderedSupplierLinks(product.supplierLinks)

              return (
                <Fragment key={product.id}>
                  <Table.Tr>
                    <Table.Td>
                      <Box className={styles.productTitleCell}>
                        <Group align="flex-start" gap="sm" wrap="nowrap">
                          {product.primaryImageUrl ? (
                            <Box className={styles.productThumbWrap}>
                              <Image alt={product.name} className={styles.productThumb} height={64} unoptimized src={product.primaryImageUrl} width={64} />
                            </Box>
                          ) : null}
                          <Box className={styles.productTitleContent}>
                            <Text className={styles.productTitle}>{product.name}</Text>
                            <Group className={styles.productSkuRow} gap={6}>
                              <Text className={styles.productSku}>SKU: {product.sku}</Text>
                              <Tooltip label={copyState === `sku-${product.id}` ? 'Tersalin' : 'Copy SKU'}>
                                <ActionIcon
                                  aria-label={`Copy SKU ${product.sku}`}
                                  color="gray"
                                  onClick={() => copyText(`sku-${product.id}`, product.sku)}
                                  size="xs"
                                  variant="subtle"
                                >
                                  <IconCopy size={13} stroke={1.9} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                            <Text className={product.status === 'active' ? styles.productStatusActive : styles.productStatusMuted}>
                              {product.status === 'active' ? 'Aktif' : 'Arsip'}
                            </Text>
                          </Box>
                        </Group>
                      </Box>
                    </Table.Td>
                    <Table.Td>
                      {supplierLinks.length > 0 ? (
                        supplierLinks.map((link) => {
                          const previousSnapshot = hasDraftScrape
                            ? getSupplierSnapshotForRun(link, selectedComparisonSnapshotId) ?? link.current
                            : getSupplierSnapshotForRun(link, selectedBaselineSnapshotId)

                          return (
                            <Box className={styles.productSupplierBlock} key={`${product.id}-${link.source}-previous`}>
                              <Text className={styles.productSupplierName}>{link.source}</Text>
                              <Text className={styles.productPrice}>{formatPrice(previousSnapshot?.finalPrice)}</Text>
                              <Text className={isOutOfStock(previousSnapshot) ? styles.productStockOut : styles.productStock}>
                                Stock: {formatStock(previousSnapshot)}
                              </Text>
                            </Box>
                          )
                        })
                      ) : (
                        <Box className={styles.productSupplierBlock}>
                          <Text className={styles.productSupplierName}>Belum ada link supplier</Text>
                          <Text className={styles.productStock}>Update link Jakmall/Jaknote untuk mulai scrape.</Text>
                        </Box>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {supplierLinks.length > 0 ? (
                        supplierLinks.map((link) => {
                          const draftSnapshot = getDraftProductSnapshot(product.sku, link.source)
                          const currentSnapshot = hasDraftScrape
                            ? draftSnapshot
                              ? {
                                  finalPrice: draftSnapshot.finalPrice,
                                  stockAvailableCount: draftSnapshot.stockAvailableCount,
                                  stockStatus: draftSnapshot.stockStatus,
                                }
                              : null
                            : getSupplierSnapshotForRun(link, selectedComparisonSnapshotId)
                          const previousSnapshot = hasDraftScrape
                            ? getSupplierSnapshotForRun(link, selectedComparisonSnapshotId) ?? link.current
                            : getSupplierSnapshotForRun(link, selectedBaselineSnapshotId)
                          const pricePercentage = getSnapshotDifference(previousSnapshot?.finalPrice, currentSnapshot?.finalPrice)
                          const stockPercentage = getSnapshotDifference(
                            previousSnapshot?.stockAvailableCount,
                            currentSnapshot?.stockAvailableCount
                          )

                          return (
                            <Box className={styles.productSupplierBlock} key={`${product.id}-${link.source}-latest`}>
                              <Text className={styles.productSupplierName}>{link.source}</Text>
                              <Text className={pricePercentage > 0 ? styles.productPriceUp : styles.productPrice}>
                                {formatPrice(currentSnapshot?.finalPrice)} ({pricePercentage > 0 ? '+' : ''}
                                {pricePercentage.toFixed(0)}%)
                              </Text>
                              <Text className={isOutOfStock(currentSnapshot) ? styles.productStockOut : styles.productStock}>
                                Stock: {formatStock(currentSnapshot)} ({stockPercentage > 0 ? '+' : ''}
                                {stockPercentage.toFixed(0)}%)
                              </Text>
                            </Box>
                          )
                        })
                      ) : (
                        <Box className={styles.productSupplierBlock}>
                          <Text className={styles.productSupplierName}>Belum ada link supplier</Text>
                          <Text className={styles.productStock}>Tidak ada data pembanding.</Text>
                        </Box>
                      )}
                    </Table.Td>
                    <Table.Td className={styles.productActionCell}>
                      <Group gap="xs" justify="center">
                        <Tooltip label={isOpen ? 'Tutup' : 'Detail'}>
                          <Button
                            aria-label={isOpen ? 'Tutup detail' : 'Buka detail'}
                            leftSection={isOpen ? <IconX size={18} stroke={1.8} /> : <IconEye size={18} stroke={1.8} />}
                            onClick={() => setOpenProductId(isOpen ? null : product.id)}
                            variant="default"
                          >
                            {isOpen ? 'Tutup' : 'Detail'}
                          </Button>
                        </Tooltip>
                        <Button
                          leftSection={<IconEdit size={18} stroke={1.8} />}
                          onClick={() => openUpdateProductModal(product)}
                          variant="default"
                        >
                          Update
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                  {isOpen ? (
  <Table.Tr>
    <Table.Td className={styles.productDetail} colSpan={4}>
      <Text>{product.description}</Text>
      <Table mt="sm" withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Source</Table.Th>
            <Table.Th>Harga sebelumnya</Table.Th>
            <Table.Th>Harga sekarang</Table.Th>
            <Table.Th>Persentase</Table.Th>
            <Table.Th>Stok</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {supplierLinks.map((link) => {
            const draftSnapshot = getDraftProductSnapshot(product.sku, link.source)
            const currentDetailSnapshot = hasDraftScrape
              ? draftSnapshot
                ? {
                    finalPrice: draftSnapshot.finalPrice,
                    scrapedAt: draftScrape?.scrapedAt ?? null,
                    stockAvailableCount: draftSnapshot.stockAvailableCount,
                    stockStatus: draftSnapshot.stockStatus,
                  }
                : null
              : getSupplierSnapshotForRun(link, selectedComparisonSnapshotId)
            const previousDetailSnapshot = hasDraftScrape
              ? getSupplierSnapshotForRun(link, selectedComparisonSnapshotId) ?? link.current
              : getSupplierSnapshotForRun(link, selectedBaselineSnapshotId)
            const prevPrice = previousDetailSnapshot?.finalPrice ?? currentDetailSnapshot?.finalPrice ?? 0
            const currPrice = currentDetailSnapshot?.finalPrice ?? 0
            const pct = getPercentageDifference(prevPrice, currPrice)

            return (
              <Table.Tr key={link.source}>
                <Table.Td>
                  <Text component="a" href={link.url} target="_blank" rel="noreferrer">
                    {link.source}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {previousDetailSnapshot ? (
                    <>
                      <Text className={styles.productPrice}>{formatCurrency(previousDetailSnapshot.finalPrice ?? 0)}</Text>
                      <Text className={styles.productDate}>{formatDate(previousDetailSnapshot.scrapedAt ?? '')}</Text>
                    </>
                  ) : (
                    <Text className={styles.productSku}>Belum ada</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {currentDetailSnapshot ? (
                    <>
                      <Text className={pct > 0 ? styles.productPriceUp : styles.productPrice}>{formatCurrency(currentDetailSnapshot.finalPrice ?? 0)}</Text>
                      <Text className={styles.productDate}>{formatDate(currentDetailSnapshot.scrapedAt ?? '')}</Text>
                    </>
                  ) : (
                    <Text className={styles.productSku}>Belum di-scrape</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {previousDetailSnapshot && currentDetailSnapshot ? (
                    <Text component="span" className={pct <= 0 ? styles.diffDown : styles.diffUp}>
                      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                    </Text>
                  ) : '-'}
                </Table.Td>
                <Table.Td>
                  <Text className={isOutOfStock(currentDetailSnapshot) ? styles.productStockOut : styles.productSku}>
                    {currentDetailSnapshot?.stockStatus ?? 'not-scraped'} · {currentDetailSnapshot?.stockAvailableCount ?? 0} cabang
                  </Text>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Table.Td>
  </Table.Tr>
) : null}
                </Fragment>
              )
            })}
          </Table.Tbody>
        </Table>
        <Group justify="flex-end" className={styles.pagination}>
          <Text>Page {safePage} of {pageCount}</Text>
          <Select
            data={[
              { label: '5 / page', value: '5' },
              { label: '10 / page', value: '10' },
              { label: '20 / page', value: '20' },
            ]}
            onChange={(value) => {
              setPageSize(value ?? '5')
              setPage(1)
            }}
            value={pageSize}
            w={110}
          />
          <Button disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} variant="default">
            Prev
          </Button>
          <Button disabled={safePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} variant="default">
            Next
          </Button>
        </Group>
      </Box>

      <Modal
        opened={isJakmallSoldOutOpen}
        onClose={() => setIsJakmallSoldOutOpen(false)}
        title="Produk Jakmall Habis"
        size="64rem"
        centered
      >
        <Box>
          <Text className={styles.productInsightMeta} mb="sm">
            {hasDraftScrape
              ? `Berdasarkan draft scrape ${formatDate(draftScrape?.scrapedAt ?? '')}`
              : `Berdasarkan ${formatSnapshotLabel(selectedComparisonSnapshot, 'periode pembanding')}`}
          </Text>
          {jakmallSoldOutProducts.length > 0 ? (
            <Box className={styles.productInsightList}>
              {jakmallSoldOutProducts.map(({ product }) => (
                <Group key={product.id} className={styles.productInsightItem} justify="space-between" gap="sm" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" className={styles.productInsightMain}>
                    {product.primaryImageUrl ? (
                      <Box className={styles.productInsightThumbWrap}>
                        <Image alt={product.name} className={styles.productInsightThumb} height={44} unoptimized src={product.primaryImageUrl} width={44} />
                      </Box>
                    ) : (
                      <Box className={styles.productInsightThumbFallback}>-</Box>
                    )}
                    <Box className={styles.productInsightProduct}>
                      <Text>{product.name}</Text>
                      <span>SKU: {product.sku}</span>
                    </Box>
                  </Group>
                  <Text className={styles.productStockOut}>Habis</Text>
                </Group>
              ))}
            </Box>
          ) : (
            <Text className={styles.productInsightEmpty}>Tidak ada produk Jakmall yang habis di snapshot sekarang.</Text>
          )}
        </Box>
      </Modal>

      <Modal opened={isAddOpen} onClose={() => setIsAddOpen(false)} title="Tambah Produk" centered size="72rem">
        <StackLikeProductModal
          jakmallUrl={jakmallUrl}
          jaknoteUrl={jaknoteUrl}
          scrapedProduct={scrapedProduct}
          setJakmallUrl={setJakmallUrl}
          setJaknoteUrl={setJaknoteUrl}
          setScrapedProduct={setScrapedProduct}
          setTestResult={setTestResult}
          searchProduct={searchProduct}
          testResult={testResult}
          isPending={isPending}
          copyState={copyState}
          copyText={copyText}
          saveSnapshot={saveSnapshot}
          close={() => setIsAddOpen(false)}
        />
      </Modal>

      <Modal opened={isScrapeOpen} onClose={() => setIsScrapeOpen(false)} title="Scrape Produk" size="80rem" centered>
        <Box>
          {testResult ? <Text className={styles.testResult}>{testResult}</Text> : null}
          <Group justify="space-between" mb="sm">
            <Text className={styles.productSku}>
              {draftScrape?.products.length ?? 0} hasil siap disimpan
              {draftScrape?.failed.length ? ` · ${draftScrape.failed.length} gagal` : ''}
            </Text>
            <Button leftSection={<IconRefresh size={14} stroke={1.8} />} loading={isPending} onClick={refreshDraftScrape} variant="default">
              Re-scrape
            </Button>
          </Group>
          <Box className={styles.productScrapeReview}>
            <Table className={styles.productScrapeTable}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Judul Produk</Table.Th>
                  {supplierColumns.map((supplier) => (
                    <Table.Th key={supplier.key}>{supplier.label}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {products.map((product) => (
                  <Table.Tr key={product.id}>
                    <Table.Td>
                      <Group align="flex-start" gap="sm" wrap="nowrap">
                        {product.primaryImageUrl ? (
                          <Box className={styles.productScrapeThumbWrap}>
                            <Image alt={product.name} className={styles.productScrapeThumb} height={48} unoptimized src={product.primaryImageUrl} width={48} />
                          </Box>
                        ) : null}
                        <Box className={styles.productTitleContent}>
                          <Text className={styles.productTitle}>{product.name}</Text>
                          <Text className={styles.productSku}>SKU: {product.sku}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    {supplierColumns.map((supplier) => {
                      const link = getSupplierLink(product, supplier.key)
                      const draftSnapshot = getDraftProductSnapshot(product.sku, supplier.key)

                      return (
                        <Table.Td key={`${product.id}-${supplier.key}`}>
                          {draftSnapshot ? (
                            <Box className={styles.productSupplierBlock}>
                              <Text className={styles.productSupplierName}>{draftSnapshot.source}</Text>
                              <Text className={styles.productPrice}>{formatPrice(draftSnapshot.finalPrice)}</Text>
                              <Text className={styles.productStock}>Stock: {formatStock(draftSnapshot)}</Text>
                            </Box>
                          ) : link ? (
                            <Box>
                              <Text className={styles.productSku}>
                                {draftScrape?.failed.find(
                                  (item) => item.sku === product.sku && isSupplierColumnSource(item.source, supplier.key)
                                )?.error ?? 'Belum ada hasil draft.'}
                              </Text>
                            </Box>
                          ) : (
                            <Box>
                              <Text className={styles.productSku}>Link belum ada.</Text>
                              <Button
                                leftSection={<IconEdit size={16} stroke={1.8} />}
                                mt="xs"
                                onClick={() => openUpdateProductModal(product)}
                                size="xs"
                                variant="default"
                              >
                                Update Link
                              </Button>
                            </Box>
                          )}
                        </Table.Td>
                      )
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
          <Group justify="space-between" mt="md">
            <Text className={styles.productSku}>{draftScrape?.scrapedAt ? formatDate(draftScrape.scrapedAt) : ''}</Text>
            <Group gap="xs">
              <Button onClick={() => setIsScrapeOpen(false)} variant="default">
                Tutup
              </Button>
              <Button disabled={!hasDraftScrape} leftSection={<IconDeviceFloppy size={18} stroke={1.8} />} loading={isPending} onClick={saveDraftSnapshot}>
                Save Snapshot
              </Button>
            </Group>
          </Group>
        </Box>
      </Modal>

      <Modal
        opened={Boolean(updateProduct)}
        onClose={() => {
          setUpdateProduct(null)
          setLinkTestResult(null)
        }}
        title="Update Link Produk"
        centered
      >
        <Box>
          <TextInput label="SKU" readOnly value={updateProduct?.sku ?? ''} />
          <TextInput label="Judul produk" mt="sm" onChange={(event) => setUpdateTitle(event.currentTarget.value)} value={updateTitle} />
          <Group align="end" gap="xs" mt="sm" wrap="nowrap">
            <TextInput
              label="Jakmall URL"
              onChange={(event) => setUpdateJakmallUrl(event.currentTarget.value)}
              placeholder="https://..."
              style={{ flex: 1 }}
              value={updateJakmallUrl}
            />
            <Button leftSection={<IconTestPipe size={16} stroke={1.8} />} loading={isPending} onClick={() => testUpdatedLink('Jakmall', updateJakmallUrl)} variant="default">
              Test Scrape
            </Button>
          </Group>
          <Group align="end" gap="xs" mt="sm" wrap="nowrap">
            <TextInput
              label="Jaknote URL"
              onChange={(event) => setUpdateJaknoteUrl(event.currentTarget.value)}
              placeholder="https://..."
              style={{ flex: 1 }}
              value={updateJaknoteUrl}
            />
            <Button leftSection={<IconTestPipe size={16} stroke={1.8} />} loading={isPending} onClick={() => testUpdatedLink('Jaknote', updateJaknoteUrl)} variant="default">
              Test Scrape
            </Button>
          </Group>
          {linkTestResult ? (
            <Text className={styles.productMeta} mt="sm">
              {linkTestResult}
            </Text>
          ) : null}
          <Group justify="flex-end" mt="md">
            <Button
              onClick={() => {
                setUpdateProduct(null)
                setLinkTestResult(null)
              }}
              variant="default"
            >
              Batal
            </Button>
            <Button loading={isPending} onClick={saveUpdatedLinks}>
              Simpan
            </Button>
          </Group>
        </Box>
      </Modal>
    </>
  )
}

function StackLikeProductModal({
  close,
  copyState,
  copyText,
  isPending,
  jakmallUrl,
  jaknoteUrl,
  saveSnapshot,
  scrapedProduct,
  setJakmallUrl,
  setJaknoteUrl,
  setScrapedProduct,
  setTestResult,
  searchProduct,
  testResult,
}: {
  close: () => void
  copyState: string | null
  copyText: (key: string, value: string) => void
  isPending: boolean
  jakmallUrl: string
  jaknoteUrl: string
  saveSnapshot: () => void
  scrapedProduct: ScrapedProductResult | null
  setJakmallUrl: (value: string) => void
  setJaknoteUrl: (value: string) => void
  setScrapedProduct: (value: ScrapedProductResult | null) => void
  setTestResult: (value: string | null) => void
  searchProduct: () => void
  testResult: string | null
}) {
  return (
    <Box className={styles.productAddModal}>
      <TextInput
        className={styles.productAddInput}
        label="Jakmall URL"
        onChange={(event) => {
          const { value } = event.currentTarget
          setJakmallUrl(value)
          setScrapedProduct(null)
          setTestResult(null)
        }}
        placeholder="https://www.jakmall.com/..."
        value={jakmallUrl}
      />

      <Group justify="space-between" align="flex-start" className={styles.productAddTopRow} gap="md">
        <Box className={styles.productAddHints}>
          <Text className={styles.productMeta}>Masukkan link Jakmall dulu. Hasil scrape akan tampil di bawah sebelum disimpan.</Text>
          {testResult ? <Text className={styles.testResult}>{testResult}</Text> : null}
        </Box>
        <Group justify="flex-end" className={styles.productAddActions} gap="xs">
          <Button disabled={!jakmallUrl} loading={isPending} onClick={searchProduct} variant="default">
            Test Scrape
          </Button>
          <Button disabled={!scrapedProduct} loading={isPending} onClick={saveSnapshot}>
            Simpan
          </Button>
          <Button onClick={close} variant="default">
            Tutup
          </Button>
        </Group>
      </Group>

      {scrapedProduct ? (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mt="md">
          <Card className={styles.productAddPreview} padding="md" radius="md" withBorder>
            <Group justify="space-between" align="flex-start" gap="sm">
              <Box style={{ minWidth: 0 }}>
                <Text className={styles.compactTitle}>{scrapedProduct.title}</Text>
                <Text className={styles.muted}>
                  {scrapedProduct.source} · SKU {scrapedProduct.sku || '-'} · Penjual {scrapedProduct.sellerName || '-'}
                </Text>
                <Text className={styles.productSku}>
                  Awal {formatCurrency(scrapedProduct.originalPrice ?? 0)} · Diskon{' '}
                  {formatDiscount(scrapedProduct.discountPercent, scrapedProduct.discountAmount)} · Jadi{' '}
                  {formatCurrency(scrapedProduct.finalPrice ?? 0)} · Stock {scrapedProduct.stockAvailableCount}
                </Text>
              </Box>
              <Button
                leftSection={<IconCopy size={17} stroke={1.8} />}
                onClick={() => copyText('shopee-copy', scrapedProduct.shopeeCopy)}
                size="xs"
                variant="default"
              >
                {copyState === 'shopee-copy' ? 'Copied' : 'Copy Shopee'}
              </Button>
            </Group>
            {scrapedProduct.branchStocks.length > 0 ? (
              <Box mt="md">
                <Text className={styles.profileMeta}>Supplier branch stock</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="xs">
                  {scrapedProduct.branchStocks.map((branch) => (
                    <Card key={branch.branchName} padding="sm" radius="sm" withBorder>
                      <Text className={styles.compactTitle}>{branch.branchName}</Text>
                      <Text className={branch.isAvailable ? styles.diffDown : styles.productSku}>{branch.stockText}</Text>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            ) : null}
          </Card>

          <Card className={styles.productAddDraftPanel} padding="md" radius="md" withBorder>
            <Textarea
              autosize
              label="Shopee copy draft"
              maxRows={10}
              minRows={7}
              readOnly
              value={scrapedProduct.shopeeCopy}
            />
            {scrapedProduct.images.length > 0 ? (
              <Textarea
                autosize
                label="Image URLs"
                maxRows={6}
                minRows={3}
                mt="sm"
                readOnly
                value={scrapedProduct.images.join('\n')}
              />
            ) : null}
            <TextInput
              label="Jaknote URL"
              mt="sm"
              onChange={(event) => setJaknoteUrl(event.currentTarget.value)}
              placeholder="https://www.jacknote.com/... atau https://www.jakartanotebook.com/..."
              value={jaknoteUrl}
            />
          </Card>
        </SimpleGrid>
      ) : null}
    </Box>
  )
}
