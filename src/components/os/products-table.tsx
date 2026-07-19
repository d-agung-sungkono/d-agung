'use client'

import { Fragment, useMemo, useState } from 'react'
import { ActionIcon, Box, Button, Group, Modal, Select, SimpleGrid, Table, Text, TextInput, Tooltip } from '@mantine/core'
import { IconExternalLink, IconEye, IconPlus, IconRefresh, IconTestPipe, IconX } from '@tabler/icons-react'

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
  const [pageSize, setPageSize] = useState('5')
  const [openProductId, setOpenProductId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [productUrl, setProductUrl] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
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
              <Table.Th>Minggu lalu dan stok</Table.Th>
              <Table.Th>Hari ini dan stok</Table.Th>
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
                        </Text>
                      </Box>
                    </Table.Td>
                    <Table.Td>
                      <Text className={styles.productPrice}>{formatCurrency(product.snapshotA.price)}</Text>
                      <Text className={styles.productDate}>{formatDate(product.snapshotA.date)}</Text>
                      <Text className={styles.productSku}>Stok {product.snapshotA.stock}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text className={styles.productPrice}>{formatCurrency(product.snapshotB.price)}</Text>
                      <Text className={styles.productDate}>{formatDate(product.snapshotB.date)}</Text>
                      <Text className={styles.productSku}>Stok {product.snapshotB.stock}</Text>
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
          setProductUrl={setProductUrl}
          setTestResult={setTestResult}
          testProductUrl={testProductUrl}
          testResult={testResult}
          close={() => setIsAddOpen(false)}
        />
      </Modal>
    </>
  )
}

function StackLikeProductModal({
  close,
  productUrl,
  setProductUrl,
  setTestResult,
  testProductUrl,
  testResult,
}: {
  close: () => void
  productUrl: string
  setProductUrl: (value: string) => void
  setTestResult: (value: string | null) => void
  testProductUrl: () => void
  testResult: string | null
}) {
  return (
    <Box>
      <TextInput
        label="Link Jacknote atau Jackmall"
        onChange={(event) => {
          setProductUrl(event.currentTarget.value)
          setTestResult(null)
        }}
        placeholder="https://www.jackmall.com/..."
        type="url"
        value={productUrl}
      />

      {testResult ? <Text className={styles.testResult} mt="sm">{testResult}</Text> : null}

      <Group justify="flex-end" mt="md">
        <Button leftSection={<IconTestPipe size={18} stroke={1.8} />} onClick={testProductUrl} variant="default">
          Test
        </Button>
        <Button onClick={close}>Simpan Link</Button>
      </Group>
    </Box>
  )
}
