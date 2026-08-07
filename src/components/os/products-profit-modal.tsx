'use client'

import { Box, Button, Group, Modal, Table, Text, TextInput } from '@mantine/core'
import { IconCalculator } from '@tabler/icons-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import styles from './os-shell.module.css'

type ProductProfitItem = {
  id: string
  modal: number
  name: string
  primaryImageUrl: string | null
  sku: string
}

type ProfitResponse = {
  rows: ProductProfitItem[]
  snapshotLabel: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function parseNumber(value: string) {
  const normalized = value.replace(/[^\d,-.]/g, '').replace(',', '.')
  return normalized ? Number(normalized) : 0
}

function getPriceAfterFee(bruto: number, adminPercent: number) {
  if (adminPercent >= 100) {
    return 0
  }

  return bruto / (1 - adminPercent / 100)
}

function getPriceBeforeDiscount(priceAfterDiscount: number, discountPercent: number) {
  if (discountPercent >= 100) {
    return 0
  }

  return priceAfterDiscount / (1 - discountPercent / 100)
}

export default function ProductsProfitModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [profits, setProfits] = useState<Record<string, string>>({})
  const [admins, setAdmins] = useState<Record<string, string>>({})
  const [discounts, setDiscounts] = useState<Record<string, string>>({})
  const [defaultProfit, setDefaultProfit] = useState('')
  const [defaultAdmin, setDefaultAdmin] = useState('16')
  const [defaultDiscount, setDefaultDiscount] = useState('')
  const [query, setQuery] = useState('')
  const [data, setData] = useState<ProfitResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const controller = new AbortController()

    async function loadProfitRows() {
      setIsLoading(true)
      setError(null)
      setData(null)

      try {
        const response = await fetch('/os/products/profit', {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Gagal mengambil data profit.')
        }

        const result = (await response.json()) as ProfitResponse
        setData(result)
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Gagal mengambil data profit.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProfitRows()

    return () => controller.abort()
  }, [isOpen])

  const rows = data?.rows ?? []
  const filteredRows = rows.filter((product) => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return true
    }

    return product.name.toLowerCase().includes(normalizedQuery) || product.sku.toLowerCase().includes(normalizedQuery)
  })

  return (
    <>
      <Button leftSection={<IconCalculator size={18} stroke={1.8} />} onClick={() => setIsOpen(true)} variant="default">
        Kalkulasi Profit
      </Button>

      <Modal opened={isOpen} onClose={() => setIsOpen(false)} title="Kalkulasi Profit Produk" size="90rem" centered>
        <Box>
          <Text className={styles.productInsightMeta} mb="sm">
            {data ? `Modal Jakmall berdasarkan ${data.snapshotLabel}` : 'Data akan diambil saat modal dibuka.'}
          </Text>
          <Group className={styles.productProfitControls} gap="xs" mb="sm">
            <TextInput
              className={styles.productProfitSearchInput}
              label="Search"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Cari title atau SKU"
              type="search"
              value={query}
            />
            <TextInput
              className={styles.productProfitPercentInput}
              inputMode="numeric"
              label="Profit default"
              onChange={(event) => setDefaultProfit(event.currentTarget.value)}
              value={defaultProfit}
            />
            <TextInput
              className={styles.productProfitPercentInput}
              inputMode="decimal"
              label="Admin default"
              onChange={(event) => setDefaultAdmin(event.currentTarget.value)}
              rightSection="%"
              value={defaultAdmin}
            />
            <TextInput
              className={styles.productProfitPercentInput}
              inputMode="decimal"
              label="Diskon default"
              onChange={(event) => setDefaultDiscount(event.currentTarget.value)}
              rightSection="%"
              value={defaultDiscount}
            />
          </Group>
          {error ? <Text className={styles.testResult} mb="sm">{error}</Text> : null}
          <Box className={styles.productProfitTableWrap}>
            <Table className={styles.productProfitTable}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Produk</Table.Th>
                  <Table.Th>SKU</Table.Th>
                  <Table.Th>Modal</Table.Th>
                  <Table.Th>Profit</Table.Th>
                  <Table.Th>Bruto</Table.Th>
                  <Table.Th>Admin</Table.Th>
                  <Table.Th>Harga Coret</Table.Th>
                  <Table.Th>Diskon</Table.Th>
                  <Table.Th>Harga Awal</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={9}>
                      <Text className={styles.productInsightEmpty}>Mengambil data profit...</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : filteredRows.length > 0 ? (
                  filteredRows.map((product) => {
                    const profit = parseNumber(profits[product.id] ?? defaultProfit)
                    const adminPercent = parseNumber(admins[product.id] ?? defaultAdmin)
                    const discountPercent = parseNumber(discounts[product.id] ?? defaultDiscount)
                    const bruto = product.modal + profit
                    const hargaCoret = getPriceAfterFee(bruto, adminPercent)
                    const hargaAwal = getPriceBeforeDiscount(hargaCoret, discountPercent)

                    return (
                      <Table.Tr key={product.id}>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap" className={styles.productProfitMain}>
                            {product.primaryImageUrl ? (
                              <Box className={styles.productProfitThumbWrap}>
                                <Image alt={product.name} className={styles.productProfitThumb} height={38} unoptimized src={product.primaryImageUrl} width={38} />
                              </Box>
                            ) : (
                              <Box className={styles.productProfitThumbFallback}>-</Box>
                            )}
                            <Text className={styles.productProfitTitle}>{product.name}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text className={styles.productProfitSku}>{product.sku}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text className={styles.productProfitMoney}>{formatCurrency(product.modal)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            aria-label={`Profit ${product.sku}`}
                            className={styles.productProfitInput}
                            inputMode="numeric"
                            onChange={(event) => {
                              const { value } = event.currentTarget
                              setProfits((current) => ({ ...current, [product.id]: value }))
                            }}
                            placeholder={defaultProfit || '0'}
                            value={profits[product.id] ?? ''}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text className={styles.productProfitMoney}>{formatCurrency(bruto)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            aria-label={`Admin ${product.sku}`}
                            className={styles.productProfitInput}
                            inputMode="decimal"
                            onChange={(event) => {
                              const { value } = event.currentTarget
                              setAdmins((current) => ({ ...current, [product.id]: value }))
                            }}
                            placeholder={defaultAdmin || '0'}
                            rightSection="%"
                            value={admins[product.id] ?? ''}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text className={styles.productProfitTotal}>{formatCurrency(hargaCoret)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            aria-label={`Diskon ${product.sku}`}
                            className={styles.productProfitInput}
                            inputMode="decimal"
                            onChange={(event) => {
                              const { value } = event.currentTarget
                              setDiscounts((current) => ({ ...current, [product.id]: value }))
                            }}
                            placeholder={defaultDiscount || '0'}
                            rightSection="%"
                            value={discounts[product.id] ?? ''}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text className={styles.productProfitTotal}>{formatCurrency(hargaAwal)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={9}>
                      <Text className={styles.productInsightEmpty}>
                        {rows.length > 0 ? 'Tidak ada produk yang cocok dengan search.' : 'Belum ada harga Jakmall di snapshot terakhir.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
        </Box>
      </Modal>
    </>
  )
}
