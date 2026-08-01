'use client'

import { ActionIcon, Box, Button, Card, Group, Modal, Select, SimpleGrid, Table, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { IconCopy, IconEye, IconPlus, IconRefresh, IconTestPipe, IconX } from '@tabler/icons-react'
import { Fragment, useMemo, useState, useTransition } from 'react'

import {
    saveScrapedProduct,
    scrapeAllProductLinks,
    scrapeProductLink,
    searchSupplierProduct,
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
  sku: string
  platform: string
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
    price: number
    stock: number
  }
  snapshotB: {
    date: string
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
  }>
  description: string
  url: string
}

type ProductsTableProps = {
  products: Product[]
  shopeeExample: {
    similarProducts?: Array<{
      image?: string
      price?: string
      title: string
      url: string
    }>
  }
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
    return currentValue === 0 ? 0 : 100
  }

  return ((currentValue - previousValue) / previousValue) * 100
}

function formatDiscount(percent: number | null, amount: number | null) {
  if (!percent && !amount) {
    return '-'
  }

  return `${percent ? `${percent}%` : '-'}${amount ? ` (${formatCurrency(amount)})` : ''}`
}

export default function ProductsTable({ products, shopeeExample }: ProductsTableProps) {
  const [isPending, startTransition] = useTransition()
  const defaultSnapshotDate = products[0]?.snapshotB.date ?? ''
  const [query, setQuery] = useState('')
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState(defaultSnapshotDate)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('5')
  const [openProductId, setOpenProductId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [productSku, setProductSku] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProductResult | null>(null)
  const [copyState, setCopyState] = useState<string | null>(null)
  const pageSizeNumber = Number(pageSize)

  const snapshotOptions = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.snapshotB.date))).sort((left, right) => right.localeCompare(left)),
    [products]
  )

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = query.toLowerCase()
    const matchesQuery =
      product.sku.toLowerCase().includes(normalizedQuery) ||
      product.name.toLowerCase().includes(normalizedQuery)
    const matchesSnapshotDate = selectedSnapshotDate === '' || product.snapshotB.date === selectedSnapshotDate

    return matchesQuery && matchesSnapshotDate
  })

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSizeNumber))
  const safePage = Math.min(page, pageCount)
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSizeNumber, safePage * pageSizeNumber)

  function updateFilter(update: () => void) {
    update()
    setPage(1)
  }

  function searchProduct() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('sku', productSku)
      setScrapedProduct(null)
      setTestResult(null)
      setProductUrl('')

      try {
        const searchResults = await searchSupplierProduct(formData)

        if (searchResults.length === 0) {
          throw new Error('Produk tidak ditemukan di Jakmall / Jacknote.')
        }

        const firstMatch = searchResults[0]
        const previewFormData = new FormData()
        previewFormData.set('url', firstMatch.url)
        previewFormData.set('sku', productSku)
        const result = await scrapeProductLink(previewFormData)

        setProductUrl(firstMatch.url)
        setScrapedProduct(result)
        setTestResult(
          `Ditemukan ${searchResults.length} halaman supplier. Preview produk sudah muncul. Klik Simpan jika cocok.`
        )
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Search failed.')
      }
    })
  }

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopyState(key)
    window.setTimeout(() => setCopyState(null), 1300)
  }

  function saveSnapshot() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('url', productUrl)
      formData.set('sku', productSku)

      try {
        const result = await saveScrapedProduct(formData)
        setScrapedProduct(result)
        setTestResult('Snapshot tersimpan. Scrape berikutnya akan jadi pembanding trend.')
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Save failed.')
      }
    })
  }

  function scrapeAllLinks() {
    startTransition(async () => {
      try {
        const result = await scrapeAllProductLinks()
        setTestResult(
          `Batch scrape selesai: ${result.saved.length} berhasil${
            result.failed.length ? `, ${result.failed.length} gagal.` : '.'
          }`
        )
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Batch scrape failed.')
      }
    })
  }

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 6 }} spacing="xs" className={styles.productToolbar}>
        <TextInput
          onChange={(event) => {
            const { value } = event.currentTarget
            updateFilter(() => setQuery(value))
          }}
          placeholder="Cari SKU atau nama produk"
          type="search"
          value={query}
        />
        <Select
          data={snapshotOptions.map((item) => ({ label: formatDate(item), value: item }))}
          onChange={(value) => updateFilter(() => setSelectedSnapshotDate(value ?? defaultSnapshotDate))}
          placeholder="Pilih snapshot"
          value={selectedSnapshotDate}
        />
        <Button
          leftSection={<IconRefresh size={18} stroke={1.8} />}
          onClick={() => {
            setQuery('')
            setSelectedSnapshotDate(defaultSnapshotDate)
            setPage(1)
          }}
          variant="default"
        >
          Atur ulang
        </Button>
        <Button leftSection={<IconTestPipe size={18} stroke={1.8} />} loading={isPending} onClick={scrapeAllLinks} variant="default">
          Scrape Semua Link
        </Button>
        <Button leftSection={<IconPlus size={18} stroke={1.8} />} onClick={() => setIsAddOpen(true)}>
          Tambah Produk
        </Button>
      </SimpleGrid>

      <Box component="section" className={styles.productTableWrap}>
        <Group justify="space-between" className={styles.productCount}>
          <Text>{filteredProducts.length} Products</Text>
          <Text>
            Snapshot dipilih {selectedSnapshotDate ? formatDate(selectedSnapshotDate) : '-'} vs sebelumnya
          </Text>
        </Group>
        <Table className={styles.productTable} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Snapshot sebelumnya</Table.Th>
              <Table.Th>Snapshot terbaru</Table.Th>
              <Table.Th>Detail</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedProducts.map((product) => {
              const percentage = getPercentageDifference(product.snapshotA.price, product.snapshotB.price)
              const isOpen = openProductId === product.id

              return (
                <Fragment key={product.id}>
                  <Table.Tr>
                    <Table.Td>
                      <Box className={styles.productTitleCell}>
                        <Text className={styles.productTitle}>{product.name}</Text>
                        <Text className={styles.productSku}>SKU: {product.sku}</Text>
                        <Text className={styles.productMeta}>
                          {product.supplierLinks.map((link) => link.source).join(' + ') || product.platform} · {product.category}
                          {product.variant ? ` · ${product.variant}` : ''}
                        </Text>
                      </Box>
                    </Table.Td>
                    <Table.Td>
                      {product.supplierLinks.length > 0 ? (
                        product.supplierLinks.map((link) => {
                          const previousSnapshot = link.previous

                          return (
                            <Box key={`${product.id}-${link.source}-previous`} mt={0} mb="sm">
                              <Text className={styles.productMeta}>{link.source}</Text>
                              <Text className={styles.productPrice}>{previousSnapshot?.finalPrice ? formatCurrency(previousSnapshot.finalPrice) : '-'}</Text>
                              <Text className={styles.productDate}>{previousSnapshot?.scrapedAt ? formatDate(previousSnapshot.scrapedAt) : '-'}</Text>
                            </Box>
                          )
                        })
                      ) : (
                        <>
                          <Text className={styles.productPrice}>{product.snapshotA.price ? formatCurrency(product.snapshotA.price) : '-'}</Text>
                          <Text className={styles.productDate}>{formatDate(product.snapshotA.date)}</Text>
                        </>
                      )}
                    </Table.Td>
                                    <Table.Td>
                      {product.supplierLinks.length > 0 ? (
                        product.supplierLinks.map((link) => {
                          const currentSnapshot = link.current
                          const previousPrice = link.previous?.finalPrice ?? 0
                          const currentPrice = link.current?.finalPrice ?? 0
                          const perSupplierPercentage = getPercentageDifference(previousPrice, currentPrice)

                          return (
                            <Box key={`${product.id}-${link.source}-latest`} mt={0} mb="sm">
                              <Text className={styles.productMeta}>{link.source}</Text>
                              <Text className={styles.productPrice}>{currentSnapshot?.finalPrice ? formatCurrency(currentSnapshot.finalPrice) : '-'}</Text>
                              <Text className={styles.productDate}>{currentSnapshot?.scrapedAt ? formatDate(currentSnapshot.scrapedAt) : '-'}</Text>
                              <Text mt="xs" component="span" className={perSupplierPercentage <= 0 ? styles.diffDown : styles.diffUp}>
                                {perSupplierPercentage > 0 ? '+' : ''}
                                {perSupplierPercentage.toFixed(1)}%
                              </Text>
                            </Box>
                          )
                        })
                      ) : (
                        <>
                          <Text className={styles.productPrice}>{product.snapshotB.price ? formatCurrency(product.snapshotB.price) : '-'}</Text>
                          <Text className={styles.productDate}>{formatDate(product.snapshotB.date)}</Text>
                          <Text mt="xs" component="span" className={percentage <= 0 ? styles.diffDown : styles.diffUp}>
                            {percentage > 0 ? '+' : ''}
                            {percentage.toFixed(1)}%
                          </Text>
                        </>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label={isOpen ? 'Tutup' : 'Detail'}>
                        <ActionIcon aria-label={isOpen ? 'Tutup detail' : 'Buka detail'} onClick={() => setOpenProductId(isOpen ? null : product.id)} variant="default">
                          {isOpen ? <IconX size={18} stroke={1.8} /> : <IconEye size={18} stroke={1.8} />}
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                  {/* {isOpen ? (
                    <Table.Tr>
                      <Table.Td className={styles.productDetail} colSpan={5}>
                        <Text>{product.description}</Text>
                        {product.branchStocks.length > 0 ? (
                          <Box mt="sm">
                            <Text className={styles.compactTitle}>Stok cabang</Text>
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs" mt="xs">
                              {product.branchStocks.map((branch) => (
                                <Card key={branch.branchName} padding="xs" radius="sm" withBorder>
                                  <Text className={styles.compactTitle}>{branch.branchName}</Text>
                                  <Text className={branch.isAvailable ? styles.diffDown : styles.productSku}>
                                    {branch.stockText}
                                  </Text>
                                </Card>
                              ))}
                            </SimpleGrid>
                          </Box>
                        ) : null}
                        <Group gap="xs" mt="sm">
                          {(product.supplierLinks.length ? product.supplierLinks : [{ source: product.platform, url: product.url }]).map((link) => (
                            <Button
                              component="a"
                              href={link.url}
                              key={`${product.id}-${link.source}`}
                              leftSection={<IconExternalLink size={18} stroke={1.8} />}
                              rel="noreferrer"
                              target="_blank"
                              variant="default"
                            >
                              {link.source}
                            </Button>
                          ))}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ) : null} */}
                  {isOpen ? (
  <Table.Tr>
    <Table.Td className={styles.productDetail} colSpan={5}>
      <Text>{product.description}</Text>
      <Table mt="sm" withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Source</Table.Th>
            <Table.Th>Harga sebelumnya</Table.Th>
            <Table.Th>Harga sekarang</Table.Th>
            <Table.Th>Persentase</Table.Th>
            <Table.Th>Stok</Table.Th>
            <Table.Th>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {product.supplierLinks.map((link) => {
            const prevPrice = link.previous?.finalPrice ?? link.current?.finalPrice ?? 0
            const currPrice = link.current?.finalPrice ?? 0
            const pct = getPercentageDifference(prevPrice, currPrice)

            return (
              <Table.Tr key={link.source}>
                <Table.Td>
                  <Text component="a" href={link.url} target="_blank" rel="noreferrer">
                    {link.source}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {link.previous ? (
                    <>
                      <Text className={styles.productPrice}>{formatCurrency(link.previous.finalPrice ?? 0)}</Text>
                      <Text className={styles.productDate}>{formatDate(link.previous.scrapedAt ?? '')}</Text>
                    </>
                  ) : (
                    <Text className={styles.productSku}>Belum ada</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {link.current ? (
                    <>
                      <Text className={styles.productPrice}>{formatCurrency(link.current.finalPrice ?? 0)}</Text>
                      <Text className={styles.productDate}>{formatDate(link.current.scrapedAt ?? '')}</Text>
                    </>
                  ) : (
                    <Text className={styles.productSku}>Belum di-scrape</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {link.previous && link.current ? (
                    <Text component="span" className={pct <= 0 ? styles.diffDown : styles.diffUp}>
                      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                    </Text>
                  ) : '-'}
                </Table.Td>
                <Table.Td>
                  <Text className={styles.productSku}>
                    {link.current?.stockStatus ?? 'not-scraped'} · {link.current?.stockAvailableCount ?? 0} cabang
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="default"
                    loading={isPending}
                    onClick={() => scrapeSingleLink(product.sku, link.url)}
                  >
                    Scrape
                  </Button>
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

      <Modal opened={isAddOpen} onClose={() => setIsAddOpen(false)} title="Tambah Produk" centered>
        <StackLikeProductModal
          productUrl={productUrl}
          scrapedProduct={scrapedProduct}
          setProductUrl={setProductUrl}
          setScrapedProduct={setScrapedProduct}
          setTestResult={setTestResult}
          shopeeExample={shopeeExample}
          searchProduct={searchProduct}
          testResult={testResult}
          isPending={isPending}
          copyState={copyState}
          copyText={copyText}
          saveSnapshot={saveSnapshot}
          close={() => setIsAddOpen(false)}
          productSku={productSku}
          setProductSku={setProductSku}
        />
      </Modal>
    </>
  )
}

function StackLikeProductModal({
  close,
  copyState,
  copyText,
  isPending,
  productUrl,
  saveSnapshot,
  scrapedProduct,
  setProductUrl,
  setScrapedProduct,
  setTestResult,
  shopeeExample,
  searchProduct,
  testResult,
  productSku,
  setProductSku,
}: {
  close: () => void
  copyState: string | null
  copyText: (key: string, value: string) => void
  isPending: boolean
  productUrl: string
  saveSnapshot: () => void
  scrapedProduct: ScrapedProductResult | null
  setProductUrl: (value: string) => void
  setScrapedProduct: (value: ScrapedProductResult | null) => void
  setTestResult: (value: string | null) => void
  shopeeExample: ProductsTableProps['shopeeExample']
  searchProduct: () => void
  testResult: string | null
  productSku: string
  setProductSku: (value: string) => void
}) {
  const matchingShopeeProduct = scrapedProduct
    ? shopeeExample.similarProducts?.find((item) =>
        item.title.toLowerCase().includes(scrapedProduct.sku.toLowerCase())
      ) ??
      shopeeExample.similarProducts?.find((item) =>
        item.title.toLowerCase().includes('toples kaca penyimpanan biji kopi vacuum sealed lid')
      )
    : null

  return (
    <Box>
      <SimpleGrid cols={{ base: 1 }} spacing="sm">
        <TextInput
          label="SKU"
          onChange={(event) => {
            const { value } = event.currentTarget
            setProductSku(value)
            setScrapedProduct(null)
            setTestResult(null)
            setProductUrl('')
          }}
          placeholder="7RHZ31SV"
          value={productSku}
        />
      </SimpleGrid>

      {productUrl ? (
        <Text mt="sm" className={styles.productSku}>Preview link: {productUrl}</Text>
      ) : null}

      {testResult ? <Text className={styles.testResult} mt="sm">{testResult}</Text> : null}
      {scrapedProduct ? (
        <Card mt="sm" padding="sm" radius="sm" withBorder>
          <Group justify="space-between" align="flex-start" gap="sm">
            <Box>
              <Text className={styles.compactTitle}>{scrapedProduct.title}</Text>
              <Text className={styles.muted}>
                {scrapedProduct.source} · SKU {scrapedProduct.sku || '-'} · {scrapedProduct.stockStatus}
              </Text>
              <Text className={styles.productSku}>
                Awal {formatCurrency(scrapedProduct.originalPrice ?? 0)} · Diskon{' '}
                {formatDiscount(scrapedProduct.discountPercent, scrapedProduct.discountAmount)} · Jadi{' '}
                {formatCurrency(scrapedProduct.finalPrice ?? 0)}
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
          {matchingShopeeProduct ? (
            <Box mt="xs">
              <Text className={styles.profileMeta}>Shopee reference</Text>
              <Text className={styles.muted}>
                {matchingShopeeProduct.title} · {matchingShopeeProduct.price ?? '-'}
              </Text>
            </Box>
          ) : null}
          {scrapedProduct.branchStocks.length > 0 ? (
            <Box mt="xs">
              <Text className={styles.profileMeta}>Supplier branch stock</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="xs">
                {scrapedProduct.branchStocks.map((branch) => (
                  <Card key={branch.branchName} padding="xs" radius="sm" withBorder>
                    <Text className={styles.compactTitle}>{branch.branchName}</Text>
                    <Text className={branch.isAvailable ? styles.diffDown : styles.productSku}>{branch.stockText}</Text>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          ) : null}
          <Textarea
            autosize
            label="Shopee copy draft"
            maxRows={8}
            minRows={5}
            mt="sm"
            readOnly
            value={scrapedProduct.shopeeCopy}
          />
          {scrapedProduct.images.length > 0 ? (
            <Textarea
              autosize
              label="Image URLs"
              maxRows={4}
              minRows={2}
              mt="sm"
              readOnly
              value={scrapedProduct.images.join('\n')}
            />
          ) : null}
        </Card>
      ) : null}

      <Group justify="flex-end" mt="md">
        <Button disabled={!productSku} loading={isPending} onClick={searchProduct} variant="default">
          Search
        </Button>
        <Button disabled={!scrapedProduct} loading={isPending} onClick={saveSnapshot}>
          Simpan
        </Button>
        <Button onClick={close} variant="default">Tutup</Button>
      </Group>
    </Box>
  )
}
