'use client'

import { Badge, Box, Button, Group, Modal, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { createBrand, updateBrand } from '@/app/os/(protected)/brands/actions'
import { brandStatuses, type BrandDetail, type BrandListItem } from '@/lib/os-brands-schema'

import styles from './os-shell.module.css'

type BrandFormValues = {
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
    description: brand.description ?? '',
    direction: 'direction' in brand ? (brand.direction ?? '') : '',
    id: brand.id,
    imageUrl: brand.imageUrl ?? '',
    nextDevelopment: 'nextDevelopment' in brand ? (brand.nextDevelopment ?? '') : '',
    status: brand.status,
    title: brand.title,
    websiteUrl: brand.websiteUrl ?? '',
  }
}

function buildFormData(values: BrandFormValues) {
  const formData = new FormData()
  formData.set('id', values.id)
  formData.set('title', values.title)
  formData.set('description', values.description)
  formData.set('imageUrl', values.imageUrl)
  formData.set('websiteUrl', values.websiteUrl)
  formData.set('status', values.status)
  formData.set('direction', values.direction)
  formData.set('nextDevelopment', values.nextDevelopment)
  return formData
}

export default function BrandEditorModal({ brand, onClose, onSaved, opened }: BrandEditorModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<BrandFormValues>(getInitialValues(brand))
  const isEditing = Boolean(brand)

  function saveBrand() {
    if (!values.title.trim()) {
      setError('Title is required.')
      return
    }

    startTransition(async () => {
      try {
        setError(null)

        if (isEditing) {
          await updateBrand(buildFormData(values))
        } else {
          await createBrand(buildFormData(values))
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
      size="62rem"
    >
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
                <Textarea
                  autosize
                  label="Description"
                  minRows={4}
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setValues((current) => ({ ...current, description: value }))
                  }}
                  placeholder="Apa brand ini, problem apa yang dia handle, dan konteks singkatnya."
                  value={values.description}
                />
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                  <TextInput
                    label="Image URL"
                    onChange={(event) => {
                      const { value } = event.currentTarget
                      setValues((current) => ({ ...current, imageUrl: value }))
                    }}
                    placeholder="https://..."
                    value={values.imageUrl}
                  />
                  <TextInput
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
    </Modal>
  )
}
