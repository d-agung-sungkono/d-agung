'use client'

import { Badge, Box, Button, ColorInput, Group, Modal, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { createBrand, updateBrand } from '@/app/os/(protected)/brands/actions'
import { brandStatuses, type BrandDetail, type BrandListItem } from '@/lib/os-brands-schema'

import BrandImage from './brand-image'
import styles from './os-shell.module.css'

type BrandFormValues = {
  brandColor: string
  description: string
  direction: string
  id: string
  imageUrl: string
  nextDevelopment: string
  status: string
  title: string
  websiteUrl: string
}

type BrandEditorModalProps = {
  brand?: BrandDetail | BrandListItem | null
  onClose: () => void
  onSaved?: () => void
  opened: boolean
}

const emptyValues: BrandFormValues = {
  brandColor: '#2563eb',
  description: '',
  direction: '',
  id: '',
  imageUrl: '',
  nextDevelopment: '',
  status: 'ACTIVE',
  title: '',
  websiteUrl: '',
}

function getInitialValues(brand?: BrandDetail | BrandListItem | null): BrandFormValues {
  if (!brand) {
    return emptyValues
  }

  return {
    brandColor: brand.brandColor,
    description: brand.description ?? '',
    direction: 'direction' in brand ? (brand.direction ?? '') : '',
    id: brand.id,
    imageUrl: brand.imageUrl?.startsWith('/') ? '' : (brand.imageUrl ?? ''),
    nextDevelopment: 'nextDevelopment' in brand ? (brand.nextDevelopment ?? '') : '',
    status: brand.status,
    title: brand.title,
    websiteUrl: brand.websiteUrl ?? '',
  }
}

function buildFormData(values: BrandFormValues, imageFile: File | null, removeImage: boolean) {
  const formData = new FormData()
  formData.set('id', values.id)
  formData.set('title', values.title)
  formData.set('brandColor', values.brandColor)
  formData.set('description', values.description)
  formData.set('imageUrl', values.imageUrl)
  formData.set('websiteUrl', values.websiteUrl)
  formData.set('status', values.status)
  formData.set('direction', values.direction)
  formData.set('nextDevelopment', values.nextDevelopment)
  formData.set('removeImage', String(removeImage))

  if (imageFile) {
    formData.set('imageFile', imageFile)
  }

  return formData
}

function getCharacterCount(value: string) {
  return `${value.length} characters`
}

export default function BrandEditorModal({ brand, onClose, onSaved, opened }: BrandEditorModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<BrandFormValues>(getInitialValues(brand))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const isEditing = Boolean(brand)
  const hasStoredImage = Boolean(isEditing && brand?.hasImage)
  const currentImageUrl = imageFile ? null : values.imageUrl || brand?.imageUrl || null
  const showCurrentImage = Boolean(currentImageUrl && !removeImage)

  function saveBrand() {
    if (!values.title.trim()) {
      setError('Title is required.')
      return
    }

    startTransition(async () => {
      try {
        setError(null)
        const formData = buildFormData(values, imageFile, removeImage)

        if (isEditing) {
          await updateBrand(formData)
        } else {
          const createdBrand = await createBrand(formData)
          if (createdBrand.id) {
            router.push(`/os/brands/${createdBrand.id}`)
          }
        }

        onClose()
        onSaved?.()
        router.refresh()
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save brand.')
      }
    })
  }

  return (
    <Modal
      centered
      classNames={{
        body: styles.osModalBody,
        content: styles.osModalContent,
        header: styles.osModalHeader,
        title: styles.osModalTitle,
      }}
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Edit Brand' : 'Add Brand'}
      size={isEditing ? '62rem' : 'md'}
    >
      {!isEditing ? (
        <Stack className={styles.modalSection} gap="md">
          <TextInput
            description={getCharacterCount(values.title)}
            label="Brand name"
            onChange={(event) => {
              const { value } = event.currentTarget
              setValues((current) => ({ ...current, title: value }))
            }}
            placeholder="LaviumHub"
            required
            size="md"
            value={values.title}
          />
          {error ? <Text className={styles.error}>{error}</Text> : null}
          <Group justify="flex-end">
            <Button className={styles.neutralAction} disabled={isPending} onClick={onClose} variant="default">
              Cancel
            </Button>
            <Button className={styles.primaryAction} loading={isPending} onClick={saveBrand}>
              Create Brand
            </Button>
          </Group>
        </Stack>
      ) : (
      <Stack className={styles.modalSection} gap="md">
        <Group justify="space-between" align="flex-start" gap="md" className={styles.brandFormTopbar}>
          <Box>
            <Text className={styles.brandFormEyebrow}>Knowledge Root</Text>
            <Text className={styles.brandFormLead}>
              Simpan identitas brand, arah yang sedang dituju, dan konteks pengembangannya.
            </Text>
          </Box>
          <Badge className={styles.badge} data-status={values.status} variant="light">
            {values.status}
          </Badge>
        </Group>

        <div className={styles.brandFormLayout}>
          <aside className={styles.brandFormAside}>
            <div className={styles.brandFormAsideCard}>
              <Text className={styles.modalSectionTitle}>What belongs here</Text>
              <Text className={styles.modalSectionHint}>
                Gunakan Brand sebagai source of truth untuk apa yang sedang di-handle, presence brand-nya di mana,
                dan arahnya ke depan.
              </Text>
            </div>
            <div className={styles.brandFormAsideCard}>
              <Text className={styles.modalSectionTitle}>Minimum useful shape</Text>
              <div className={styles.brandFormChecklist}>
                <Text className={styles.muted}>Apa brand ini?</Text>
                <Text className={styles.muted}>Presence utamanya di mana?</Text>
                <Text className={styles.muted}>Sekarang mau dibawa ke mana?</Text>
                <Text className={styles.muted}>Pengembangan berikutnya apa?</Text>
              </div>
            </div>
          </aside>

          <div className={styles.brandFormMain}>
            <section className={styles.brandFormPanel}>
              <div className={styles.brandFormSectionHeader}>
                <Text className={styles.modalSectionTitle}>Identity</Text>
                <Text className={styles.modalSectionHint}>Informasi dasar untuk mengenali brand ini dengan cepat.</Text>
              </div>
              <Stack gap="sm">
                <TextInput
                  description={getCharacterCount(values.title)}
                  label="Title"
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setValues((current) => ({ ...current, title: value }))
                  }}
                  placeholder="LaviumHub"
                  required
                  size="md"
                  value={values.title}
                />
                <ColorInput
                  description="Used for brand accents in Today."
                  format="hex"
                  label="Brand color"
                  onChange={(value) => setValues((current) => ({ ...current, brandColor: value }))}
                  swatches={['#2563eb', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#7c3aed', '#db2777', '#111827']}
                  value={values.brandColor}
                />
                <Textarea
                  autosize
                  description={getCharacterCount(values.description)}
                  label="Description"
                  minRows={4}
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setValues((current) => ({ ...current, description: value }))
                  }}
                  placeholder="Apa brand ini, problem apa yang dia handle, dan konteks singkatnya."
                  value={values.description}
                />
                <div className={styles.brandLogoEditor}>
                  {removeImage ? <input name="removeImage" type="hidden" value="true" /> : null}
                  <div className={styles.brandLogoPreview}>
                    <BrandImage
                      alt={values.title || 'Brand logo'}
                      className={styles.brandLogoImage}
                      labelClassName={styles.brandLogoImageFallback}
                      src={showCurrentImage ? currentImageUrl : null}
                    />
                  </div>
                  <div className={styles.brandLogoControls}>
                    <Text className={styles.modalSectionTitle}>Logo</Text>
                    <Text className={styles.modalSectionHint}>
                      {removeImage
                        ? 'Logo will be removed after saving.'
                        : imageFile
                          ? `${imageFile.name} selected. Save brand to apply.`
                          : hasStoredImage
                            ? 'Stored as a database blob. Upload a replacement only when needed.'
                            : values.imageUrl
                              ? 'Using the Image URL below. Upload a file to store it as a database blob.'
                              : 'No logo yet. The brand initial is shown as fallback.'}
                    </Text>
                    <Group gap="xs">
                      <Button className={styles.neutralAction} component="label" variant="default">
                        {hasStoredImage ? 'Change logo' : 'Choose logo'}
                        <input
                          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                          className={styles.affiliateImageInput}
                          onChange={(event) => {
                            setImageFile(event.currentTarget.files?.[0] ?? null)
                            setRemoveImage(false)
                          }}
                          type="file"
                        />
                      </Button>
                      {hasStoredImage && brand?.id ? (
                        <Button
                          className={styles.accentAction}
                          component="a"
                          download
                          href={`/os/brands/image/${brand.id}?download=true`}
                          variant="default"
                        >
                          Download logo
                        </Button>
                      ) : null}
                      {showCurrentImage ? (
                        <Button
                          className={styles.dangerAction}
                          onClick={() => {
                            setImageFile(null)
                            setRemoveImage(true)
                            setValues((current) => ({ ...current, imageUrl: '' }))
                          }}
                          type="button"
                          variant="default"
                        >
                          Delete logo
                        </Button>
                      ) : null}
                    </Group>
                  </div>
                </div>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                  <TextInput
                    description={getCharacterCount(values.imageUrl)}
                    label="Image URL"
                    onChange={(event) => {
                      const { value } = event.currentTarget
                      setValues((current) => ({ ...current, imageUrl: value }))
                    }}
                    placeholder="https://..."
                    value={values.imageUrl}
                  />
                  <TextInput
                    description={getCharacterCount(values.websiteUrl)}
                    label="Website URL"
                    onChange={(event) => {
                      const { value } = event.currentTarget
                      setValues((current) => ({ ...current, websiteUrl: value }))
                    }}
                    placeholder="https://..."
                    value={values.websiteUrl}
                  />
                </SimpleGrid>
                <Select
                  data={brandStatuses.map((status) => ({ label: status, value: status }))}
                  label="Status"
                  onChange={(value) => setValues((current) => ({ ...current, status: value ?? 'ACTIVE' }))}
                  value={values.status}
                />
              </Stack>
            </section>

            <section className={styles.brandFormPanel}>
              <div className={styles.brandFormSectionHeader}>
                <Text className={styles.modalSectionTitle}>Direction</Text>
                <Text className={styles.modalSectionHint}>Jawab: brand ini sekarang mau dibawa ke mana?</Text>
              </div>
              <Textarea
                autosize
                description={getCharacterCount(values.direction)}
                label="Direction"
                minRows={5}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setValues((current) => ({ ...current, direction: value }))
                }}
                placeholder="Tulis arah strategis brand ini dalam bahasa yang jelas dan bisa dipakai sebagai pegangan kerja."
                value={values.direction}
              />
            </section>

            <section className={styles.brandFormPanel}>
              <div className={styles.brandFormSectionHeader}>
                <Text className={styles.modalSectionTitle}>Next Development</Text>
                <Text className={styles.modalSectionHint}>Isi langkah atau fokus pengembangan berikutnya.</Text>
              </div>
              <Textarea
                autosize
                description={getCharacterCount(values.nextDevelopment)}
                label="Next Development"
                minRows={5}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setValues((current) => ({ ...current, nextDevelopment: value }))
                }}
                placeholder="Contoh: perjelas customer persona, rapikan presence social media, atau mulai dokumentasi offer."
                value={values.nextDevelopment}
              />
            </section>
          </div>
        </div>

        {error ? <Text className={styles.error}>{error}</Text> : null}
        <Group justify="flex-end" className={styles.brandFormFooter}>
          <Button className={styles.neutralAction} disabled={isPending} onClick={onClose} variant="default">
            Cancel
          </Button>
          <Button className={styles.primaryAction} loading={isPending} onClick={saveBrand}>
            {isEditing ? 'Save Brand' : 'Create Brand'}
          </Button>
        </Group>
      </Stack>
      )}
    </Modal>
  )
}
