'use client'

import { Fragment, useMemo, useState, useTransition } from 'react'
import { ActionIcon, Box, Button, Card, Group, Modal, Select, SimpleGrid, Table, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { IconCopy, IconExternalLink, IconEye, IconPlus, IconRefresh, IconTestPipe, IconX } from '@tabler/icons-react'

import { saveScrapedProduct, scrapeProductLink, type ScrapedProductResult } from '@/app/os/(protected)/products/actions'

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
    return 0
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
  const defaultWeekStart = products[0]?.snapshotA.date ?? ''
  const defaultWeekEnd = products[0]?.snapshotA.date ?? ''
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const [category, setCategory] = useState('all')
  const [stockStatus, setStockStatus] = useState('all')
  const [weekStart, setWeekStart] = useState(defaultWeekStart)
  const [weekEnd, setWeekEnd] = useState(defaultWeekEnd)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('5')
  const [openProductId, setOpenProductId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [productUrl, setProductUrl] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProductResult | null>(null)
  const [copyState, setCopyState] = useState<string | null>(null)
  const pageSizeNumber = Number(pageSize)

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

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSizeNumber))
  const safePage = Math.min(page, pageCount)
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSizeNumber, safePage * pageSizeNumber)

  function updateFilter(update: () => void) {
    update()
    setPage(1)
  }

  function testProductUrl() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('url', productUrl)
      setScrapedProduct(null)
      setTestResult(null)

      try {
        const result = await scrapeProductLink(formData)
        setScrapedProduct(result)
        setTestResult('Scrape berhasil. Data siap dicopy ke Shopee.')
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Scrape failed.')
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

      try {
        const result = await saveScrapedProduct(formData)
        setScrapedProduct(result)
        setTestResult('Snapshot tersimpan. Scrape berikutnya akan jadi pembanding trend.')
      } catch (error) {
        setTestResult(error instanceof Error ? error.message : 'Save failed.')
      }
    })
  }

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 8 }} spacing="xs" className={styles.productToolbar}>
        <TextInput
          onChange={(event) => updateFilter(() => setQuery(event.currentTarget.value))}
          placeholder="Cari SKU atau nama produk"
          type="search"
          value={query}
        />
        <Select
          data={sources.map((item) => ({ label: item === 'all' ? 'Source' : item, value: item }))}
          onChange={(value) => updateFilter(() => setSource(value ?? 'all'))}
          value={source}
        />
        <Select
          data={categories.map((item) => ({ label: item === 'all' ? 'Kategori' : item, value: item }))}
          onChange={(value) => updateFilter(() => setCategory(value ?? 'all'))}
          value={category}
        />
        <Select
          data={stockStatuses.map((item) => ({ label: item === 'all' ? 'Stok' : item, value: item }))}
          onChange={(value) => updateFilter(() => setStockStatus(value ?? 'all'))}
          value={stockStatus}
        />
        <TextInput onChange={(event) => updateFilter(() => setWeekStart(event.currentTarget.value))} type="date" value={weekStart} />
        <TextInput onChange={(event) => updateFilter(() => setWeekEnd(event.currentTarget.value))} type="date" value={weekEnd} />
        <Button
          leftSection={<IconRefresh size={18} stroke={1.8} />}
          onClick={() => {
            setQuery('')
            setSource('all')
            setCategory('all')
            setStockStatus('all')
            setWeekStart(defaultWeekStart)
            setWeekEnd(defaultWeekEnd)
            setPage(1)
          }}
          variant="default"
        >
          Atur ulang
        </Button>
        <Button leftSection={<IconPlus size={18} stroke={1.8} />} onClick={() => setIsAddOpen(true)}>
          Tambah Produk
        </Button>
      </SimpleGrid>

      <Box component="section" className={styles.productTableWrap}>
        <Group justify="space-between" className={styles.productCount}>
          <Text>{filteredProducts.length} Products</Text>
          <Text>
            Minggu pembanding {weekStart ? formatDate(weekStart) : '-'} sampai {weekEnd ? formatDate(weekEnd) : '-'} vs hari ini
          </Text>
        </Group>
        <Table className={styles.productTable} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Snapshot sebelumnya</Table.Th>
              <Table.Th>Snapshot terbaru</Table.Th>
              <Table.Th>Persentase</Table.Th>
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
                          {product.platform} · {product.category}
                          {product.variant ? ` · ${product.variant}` : ''}
                        </Text>
                      </Box>
                    </Table.Td>
                    <Table.Td>
                      <Text className={styles.productSku}>Awal {formatCurrency(product.previousOriginalPrice ?? product.snapshotA.price)}</Text>
                      <Text className={styles.productSku}>
                        Diskon {formatDiscount(product.previousDiscountPercent, product.previousDiscountAmount)}
                      </Text>
                      <Text className={styles.productPrice}>{formatCurrency(product.snapshotA.price)}</Text>
                      <Text className={styles.productDate}>{formatDate(product.snapshotA.date)}</Text>
                      <Text className={styles.productSku}>Stok {product.snapshotA.stock} cabang</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text className={styles.productSku}>Awal {formatCurrency(product.originalPrice ?? product.snapshotB.price)}</Text>
                      <Text className={styles.productSku}>
                        Diskon {formatDiscount(product.discountPercent, product.discountAmount)}
                      </Text>
                      <Text className={styles.productPrice}>{formatCurrency(product.snapshotB.price)}</Text>
                      <Text className={styles.productDate}>{formatDate(product.snapshotB.date)}</Text>
                      <Text className={styles.productSku}>Stok {product.snapshotB.stock} cabang</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text component="span" className={percentage <= 0 ? styles.diffDown : styles.diffUp}>
                        {percentage > 0 ? '+' : ''}
                        {percentage.toFixed(1)}%
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label={isOpen ? 'Tutup' : 'Detail'}>
                        <ActionIcon aria-label={isOpen ? 'Tutup detail' : 'Buka detail'} onClick={() => setOpenProductId(isOpen ? null : product.id)} variant="default">
                          {isOpen ? <IconX size={18} stroke={1.8} /> : <IconEye size={18} stroke={1.8} />}
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                  {isOpen ? (
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
                        <Button
                          component="a"
                          href={product.url}
                          leftSection={<IconExternalLink size={18} stroke={1.8} />}
                          mt="sm"
                          rel="noreferrer"
                          target="_blank"
                          variant="default"
                        >
                          Buka sumber produk
                        </Button>
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
          testProductUrl={testProductUrl}
          testResult={testResult}
          isPending={isPending}
          copyState={copyState}
          copyText={copyText}
          saveSnapshot={saveSnapshot}
          close={() => setIsAddOpen(false)}
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
  testProductUrl,
  testResult,
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
  testProductUrl: () => void
  testResult: string | null
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
      <TextInput
        label="Link JakartaNotebook, Jacknote, atau Jackmall"
        onChange={(event) => {
          setProductUrl(event.currentTarget.value)
          setScrapedProduct(null)
          setTestResult(null)
        }}
        placeholder="https://www.jakartanotebook.com/p/..."
        type="url"
        value={productUrl}
      />

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
        <Button leftSection={<IconTestPipe size={18} stroke={1.8} />} loading={isPending} onClick={testProductUrl} variant="default">
          Test Scrape
        </Button>
        <Button disabled={!scrapedProduct} loading={isPending} onClick={saveSnapshot}>
          Simpan Snapshot
        </Button>
        <Button onClick={close} variant="default">Tutup</Button>
      </Group>
    </Box>
  )
}
