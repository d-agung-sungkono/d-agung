'use client'

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconArchive, IconEdit, IconExternalLink, IconPlus, IconRefresh, IconSearch, IconTrash } from '@tabler/icons-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { type FormEvent, useMemo, useState, useTransition } from 'react'

import {
  createAffiliateProduct,
  deleteAffiliateProduct,
  setAffiliateProductActive,
  updateAffiliateProduct,
} from '@/app/os/(protected)/affiliate/actions'
import type { AffiliateMarketplace, AffiliateProductType } from '@/data/affiliate-products'
import type { OsAffiliateProduct } from '@/lib/os-affiliate-products'

import styles from './os-shell.module.css'

type AffiliateProductsManagerProps = {
  products: OsAffiliateProduct[]
}

type ProductFormMode = 'create' | 'edit'

const typeOptions: Array<{ label: string; value: AffiliateProductType }> = [
  { label: 'Affiliate', value: 'affiliate' },
  { label: 'Dropship', value: 'dropship' },
  { label: 'Owned product', value: 'owned' },
]

const marketplaceOptions: Array<{ label: string; value: AffiliateMarketplace }> = [
  { label: 'Shopee', value: 'shopee' },
  { label: 'Tokopedia', value: 'tokopedia' },
  { label: 'Other', value: 'other' },
]

const emptyProduct = {
  code: '',
  contentLinks: [] as OsAffiliateProduct['contentLinks'],
  destinationUrl: '',
  hasImage: false,
  id: '',
  image: '/images/products/placeholder.svg',
  isActive: true,
  marketplace: 'shopee' as AffiliateMarketplace,
  name: '',
  sortOrder: 1,
  type: 'affiliate' as AffiliateProductType,
  updatedAt: '',
}

function getMarketplaceLabel(value: AffiliateMarketplace) {
  return marketplaceOptions.find((option) => option.value === value)?.label ?? value
}

function getTypeLabel(value: AffiliateProductType) {
  return typeOptions.find((option) => option.value === value)?.label ?? value
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AffiliateProductsManager({ products }: AffiliateProductsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [modalMode, setModalMode] = useState<ProductFormMode>('create')
  const [selectedProduct, setSelectedProduct] = useState(emptyProduct)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageFileName, setSelectedImageFileName] = useState('')
  const [removeImage, setRemoveImage] = useState(false)
  const [contentLinkDrafts, setContentLinkDrafts] = useState<string[]>([])

  const activeCount = products.filter((product) => product.isActive).length
  const archivedCount = products.length - activeCount

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim()

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.code.toLowerCase().includes(normalizedQuery) ||
        product.name.toLowerCase().includes(normalizedQuery)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.isActive) ||
        (statusFilter === 'archived' && !product.isActive)

      return matchesQuery && matchesStatus
    })
  }, [products, query, statusFilter])

  function openCreateModal() {
    setError(null)
    setSelectedImageFileName('')
    setRemoveImage(false)
    setContentLinkDrafts([])
    setModalMode('create')
    setSelectedProduct({
      ...emptyProduct,
      sortOrder: Math.max(products.length + 1, 1),
    })
    setIsModalOpen(true)
  }

  function openEditModal(product: OsAffiliateProduct) {
    setError(null)
    setSelectedImageFileName('')
    setRemoveImage(false)
    setContentLinkDrafts(product.contentLinks.map((link) => link.url))
    setModalMode('edit')
    setSelectedProduct({
      code: product.code,
      contentLinks: product.contentLinks,
      destinationUrl: product.destinationUrl,
      hasImage: Boolean(product.hasImage),
      id: product.id,
      image: product.image,
      isActive: product.isActive,
      marketplace: product.marketplace,
      name: product.name,
      sortOrder: product.sortOrder,
      type: product.type,
      updatedAt: product.updatedAt,
    })
    setIsModalOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const sortOrder = Number.parseInt(String(formData.get('sortOrder') ?? ''), 10)

    if (!Number.isFinite(sortOrder) || sortOrder < 1) {
      setError('Sort order must be at least 1.')
      return
    }

    if (contentLinkDrafts.some((link) => !link.trim())) {
      setError('Content link cannot be empty. Fill it or remove the row.')
      return
    }

    startTransition(async () => {
      try {
        if (modalMode === 'edit') {
          await updateAffiliateProduct(formData)
        } else {
          await createAffiliateProduct(formData)
        }

        setIsModalOpen(false)
        router.refresh()
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : 'Failed to save product.')
      }
    })
  }

  function runRowAction(action: (formData: FormData) => Promise<void>, formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await action(formData)
        router.refresh()
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : 'Action failed.')
      }
    })
  }

  function setProductActive(product: OsAffiliateProduct, isActive: boolean) {
    const formData = new FormData()
    formData.set('id', product.id)
    formData.set('isActive', String(isActive))
    runRowAction(setAffiliateProductActive, formData)
  }

  function deleteProduct(product: OsAffiliateProduct) {
    if (!window.confirm(`Delete ${product.code}? This cannot be undone.`)) {
      return
    }

    const formData = new FormData()
    formData.set('id', product.id)
    runRowAction(deleteAffiliateProduct, formData)
  }

  function updateContentLinkDraft(index: number, value: string) {
    setContentLinkDrafts((currentDrafts) => currentDrafts.map((draft, draftIndex) => (draftIndex === index ? value : draft)))
  }

  function removeContentLinkDraft(index: number) {
    setContentLinkDrafts((currentDrafts) => currentDrafts.filter((_, draftIndex) => draftIndex !== index))
  }

  return (
    <>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Agung OS / Affiliate</p>
          <h2 className={styles.pageTitle}>Affiliate</h2>
          <p className={styles.pageDescription}>CMS untuk produk yang tampil di halaman publik /affiliate.</p>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          Add product
        </Button>
      </section>

      <section className={styles.panel}>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <Badge color="green" variant="light">
              {activeCount} active
            </Badge>
            <Badge color="gray" variant="light">
              {archivedCount} archived
            </Badge>
          </Group>
          <Group gap="sm">
            <TextInput
              leftSection={<IconSearch size={16} />}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search code or name"
              value={query}
            />
            <Select
              allowDeselect={false}
              data={[
                { label: 'Active', value: 'active' },
                { label: 'Archived', value: 'archived' },
                { label: 'All', value: 'all' },
              ]}
              onChange={(value) => setStatusFilter(value ?? 'active')}
              value={statusFilter}
            />
          </Group>
        </Group>

        <Table.ScrollContainer minWidth={980}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Order</Table.Th>
                <Table.Th>Image</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Marketplace</Table.Th>
                <Table.Th>Internal type</Table.Th>
                <Table.Th>Content</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Updated</Table.Th>
                <Table.Th ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredProducts.map((product) => (
                <Table.Tr key={product.id}>
                  <Table.Td>{product.sortOrder}</Table.Td>
                  <Table.Td>
                    <div className={styles.productThumbWrap}>
                      <Image
                        alt={product.name}
                        className={styles.productThumb}
                        height={64}
                        unoptimized
                        src={
                          product.hasImage
                            ? `/os/affiliate/image/${product.id}?v=${encodeURIComponent(product.updatedAt)}`
                            : product.image
                        }
                        width={64}
                      />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={700}>{product.code}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text lineClamp={2}>{product.name}</Text>
                  </Table.Td>
                  <Table.Td>{getMarketplaceLabel(product.marketplace)}</Table.Td>
                  <Table.Td>{getTypeLabel(product.type)}</Table.Td>
                  <Table.Td>
                    <Badge color={product.contentLinks.length > 0 ? 'blue' : 'gray'} variant="light">
                      {product.contentLinks.length} links
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={product.isActive ? 'green' : 'gray'} variant="light">
                      {product.isActive ? 'Active' : 'Archived'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDate(product.updatedAt)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <Tooltip label="Open product">
                        <ActionIcon
                          aria-label={`Open ${product.code}`}
                          component="a"
                          href={product.destinationUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                          variant="subtle"
                        >
                          <IconExternalLink size={17} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon aria-label={`Edit ${product.code}`} onClick={() => openEditModal(product)} variant="subtle">
                          <IconEdit size={17} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={product.isActive ? 'Archive' : 'Restore'}>
                        <ActionIcon
                          aria-label={product.isActive ? `Archive ${product.code}` : `Restore ${product.code}`}
                          disabled={isPending}
                          onClick={() => setProductActive(product, !product.isActive)}
                          variant="subtle"
                        >
                          {product.isActive ? <IconArchive size={17} /> : <IconRefresh size={17} />}
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          aria-label={`Delete ${product.code}`}
                          color="red"
                          disabled={isPending}
                          onClick={() => deleteProduct(product)}
                          variant="subtle"
                        >
                          <IconTrash size={17} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {filteredProducts.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={10}>
                    <Text c="dimmed" ta="center">
                      No affiliate products found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </section>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={modalMode === 'edit' ? `Edit ${selectedProduct.code}` : 'Add affiliate product'}
      >
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          {modalMode === 'edit' ? <input name="id" type="hidden" value={selectedProduct.id} /> : null}
          <Stack gap="sm">
            <Group grow>
              <TextInput
                label="Code"
                name="code"
                required
                defaultValue={selectedProduct.code}
                placeholder="AG001"
              />
              <TextInput
                label="Sort order"
                name="sortOrder"
                required
                type="number"
                min={1}
                defaultValue={String(selectedProduct.sortOrder)}
              />
            </Group>
            <TextInput label="Product name" name="name" required defaultValue={selectedProduct.name} />
            <div className={styles.affiliateImageEditor}>
              {removeImage ? <input name="removeImage" type="hidden" value="true" /> : null}
              <div className={styles.affiliateImagePreview}>
                <Image
                  alt={selectedProduct.name || selectedProduct.code || 'Product image placeholder'}
                  height={112}
                  unoptimized
                  src={
                    modalMode === 'edit' && selectedProduct.hasImage && !removeImage
                      ? `/os/affiliate/image/${selectedProduct.id}?v=${encodeURIComponent(selectedProduct.updatedAt)}`
                      : selectedProduct.image
                  }
                  width={112}
                />
              </div>
              <div className={styles.affiliateImageControls}>
                <Text fw={700}>{modalMode === 'edit' ? 'Current image' : 'Product image'}</Text>
                <Text c="dimmed" size="sm">
                  {removeImage
                    ? 'Image will be removed after saving.'
                    : selectedImageFileName
                    ? `${selectedImageFileName} selected. Save product to apply.`
                    : modalMode === 'edit'
                      ? selectedProduct.hasImage
                        ? 'Upload a replacement only when you want to change it.'
                        : 'No image yet. Placeholder is shown on public page.'
                      : 'Optional. Placeholder is shown when empty.'}
                </Text>
                <Group gap="xs">
                  <Button component="label" variant="default">
                    {modalMode === 'edit' ? 'Ubah image' : 'Choose image'}
                    <input
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      className={styles.affiliateImageInput}
                      name="imageFile"
                      onChange={(event) => {
                        setSelectedImageFileName(event.currentTarget.files?.[0]?.name ?? '')
                        setRemoveImage(false)
                      }}
                      type="file"
                    />
                  </Button>
                  {modalMode === 'edit' && selectedProduct.hasImage ? (
                    <Button
                      color="red"
                      onClick={() => {
                        setSelectedImageFileName('')
                        setRemoveImage(true)
                      }}
                      type="button"
                      variant="light"
                    >
                      Hapus image
                    </Button>
                  ) : null}
                </Group>
              </div>
            </div>
            <TextInput
              label="Destination URL"
              name="destinationUrl"
              required
              defaultValue={selectedProduct.destinationUrl}
              placeholder="https://..."
            />
            <div className={styles.affiliateContentLinksEditor}>
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={700}>Content links</Text>
                  <Text c="dimmed" size="sm">
                    Link konten yang membahas atau mengarah ke produk ini.
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={15} />}
                  onClick={() => setContentLinkDrafts((currentDrafts) => [...currentDrafts, ''])}
                  type="button"
                  variant="default"
                >
                  Add link
                </Button>
              </Group>
              {contentLinkDrafts.length > 0 ? (
                <div className={styles.affiliateContentLinksList}>
                  {contentLinkDrafts.map((link, index) => (
                    <Group align="flex-start" gap="xs" key={index} wrap="nowrap">
                      <TextInput
                        aria-label={`Content link ${index + 1}`}
                        name="contentLinks"
                        onChange={(event) => updateContentLinkDraft(index, event.currentTarget.value)}
                        placeholder="https://www.instagram.com/..."
                        value={link}
                      />
                      <ActionIcon
                        aria-label={`Remove content link ${index + 1}`}
                        color="red"
                        onClick={() => removeContentLinkDraft(index)}
                        type="button"
                        variant="subtle"
                      >
                        <IconTrash size={17} />
                      </ActionIcon>
                    </Group>
                  ))}
                </div>
              ) : (
                <Text c="dimmed" size="sm">
                  Belum ada content link.
                </Text>
              )}
            </div>
            <Group grow>
              <Select
                allowDeselect={false}
                data={typeOptions}
                defaultValue={selectedProduct.type}
                label="Internal type"
                name="type"
                required
              />
              <Select
                allowDeselect={false}
                data={marketplaceOptions}
                defaultValue={selectedProduct.marketplace}
                label="Marketplace"
                name="marketplace"
                required
              />
            </Group>
            <Switch defaultChecked={selectedProduct.isActive} label="Active on public page" name="isActive" />
          </Stack>

          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}

          <Group className={styles.modalActions}>
            <Button onClick={() => setIsModalOpen(false)} type="button" variant="default">
              Cancel
            </Button>
            <Button disabled={isPending} loading={isPending} type="submit">
              Save product
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  )
}
