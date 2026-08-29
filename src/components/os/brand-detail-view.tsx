'use client'

import Link from 'next/link'
import { ActionIcon, Badge, Box, Button, Card, ColorInput, Group, Select, SimpleGrid, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { IconArrowLeft, IconCheck, IconDownload, IconEdit, IconExternalLink, IconInfoCircle, IconLinkPlus, IconTrash, IconUpload, IconX } from '@tabler/icons-react'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { updateBrand } from '@/app/os/(protected)/brands/actions'
import type { BrandConnectionOption, BrandDetail } from '@/lib/os-brands-schema'
import { brandStatuses } from '@/lib/os-brands-schema'

import BrandConnectionsModal from './brand-connections-modal'
import BrandImage from './brand-image'
import styles from './os-shell.module.css'

type BrandDetailViewProps = {
  allConnectionOptions: BrandConnectionOption[]
  brand: BrandDetail
}

type EditableField = 'description' | 'direction' | 'identity' | 'nextDevelopment' | 'websiteUrl'

function EmptySection({ body, title }: { body: string; title: string }) {
  return (
    <Card className={styles.brandSectionEmpty} padding="md" radius="sm" withBorder>
      <Text className={styles.compactTitle}>{title}</Text>
      <Text className={styles.muted}>{body}</Text>
    </Card>
  )
}

function getCharacterCount(value: string) {
  return `${value.length} characters`
}

function SectionTitle({ hint, title }: { hint: string; title: string }) {
  return (
    <div className={styles.sectionTitleRow}>
      <h3 className={styles.panelTitle}>{title}</h3>
      <Tooltip label={hint} multiline w={260} withArrow>
        <span aria-label={`${title} info`} className={styles.hintIcon} role="img" tabIndex={0}>
          <IconInfoCircle size={15} stroke={1.9} />
        </span>
      </Tooltip>
    </div>
  )
}

export default function BrandDetailView({ allConnectionOptions, brand }: BrandDetailViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    brandColor: brand.brandColor,
    description: brand.description ?? '',
    direction: brand.direction ?? '',
    nextDevelopment: brand.nextDevelopment ?? '',
    status: brand.status,
    title: brand.title,
    websiteUrl: brand.websiteUrl ?? '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const selectedConnectionIds = useMemo(() => brand.connections.map((connection) => connection.id), [brand.connections])

  function buildFormData(overrides: Partial<typeof draft> = {}, imageFile: File | null = null, removeImage = false) {
    const values = { ...draft, ...overrides }
    const formData = new FormData()
    formData.set('id', brand.id)
    formData.set('title', values.title)
    formData.set('brandColor', values.brandColor)
    formData.set('description', values.description)
    formData.set('imageUrl', removeImage || brand.hasImage ? '' : (brand.imageUrl ?? ''))
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

  function saveBrandField(overrides?: Partial<typeof draft>) {
    startTransition(async () => {
      try {
        setError(null)
        await updateBrand(buildFormData(overrides))
        setEditingField(null)
        router.refresh()
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save brand.')
      }
    })
  }

  function saveLogo(imageFile: File | null, removeImage = false) {
    startTransition(async () => {
      try {
        setError(null)
        await updateBrand(buildFormData({}, imageFile, removeImage))
        setLogoFile(null)
        router.refresh()
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to update logo.')
      }
    })
  }

  return (
    <>
      <Box component="section" className={styles.pageHeader}>
        <Box>
          <Text component={Link} className={styles.brandBackLink} href="/os/brands">
            <IconArrowLeft size={16} stroke={1.8} />
            Brands
          </Text>
          <Text component="h2" className={styles.pageTitle}>Brand Detail</Text>
          <Text className={styles.pageDescription}>Knowledge page dan operational connections untuk brand ini.</Text>
        </Box>
      </Box>

      <Card className={styles.brandHero} padding="lg" radius="sm" withBorder>
        <BrandImage alt={brand.title} className={styles.brandHeroImage} labelClassName={styles.brandHeroImageFallback} src={brand.imageUrl} />
        <Box className={styles.brandHeroBody}>
          <Group justify="space-between" align="flex-start" gap="md">
            <Box className={styles.brandHeroCopy}>
              <Group gap="xs" wrap="wrap">
                <span aria-hidden="true" className={styles.brandColorSwatch} style={{ backgroundColor: brand.brandColor }} />
                <Text className={styles.brandHeroTitle}>{brand.title}</Text>
                <Badge className={styles.badge} data-status={brand.status} variant="light">
                  {brand.status}
                </Badge>
              </Group>
              <Text className={styles.brandHeroDescription}>
                {brand.description || 'Belum ada deskripsi.'}
              </Text>
              <Text className={styles.brandHeroMeta}>
                Updated {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(new Date(brand.updatedAt))}
              </Text>
            </Box>
            <Group gap="xs" className={styles.pageActions}>
              {brand.websiteUrl ? (
                <Button
                  className={styles.accentAction}
                  component="a"
                  href={brand.websiteUrl}
                  leftSection={<IconExternalLink size={18} stroke={1.8} />}
                  rel="noreferrer noopener"
                  target="_blank"
                  variant="default"
                >
                  Website
                </Button>
              ) : null}
              <Button className={styles.editAction} leftSection={<IconEdit size={18} stroke={1.8} />} onClick={() => setEditingField('identity')} variant="default">
                Edit Identity
              </Button>
            </Group>
          </Group>
          {editingField === 'identity' ? (
            <Card className={styles.inlineEditor} padding="sm" radius="sm" withBorder>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                <TextInput
                  description={getCharacterCount(draft.title)}
                  label="Title"
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setDraft((current) => ({ ...current, title: value }))
                  }}
                  required
                  value={draft.title}
                />
                <ColorInput
                  description="Used for brand accents in Today."
                  format="hex"
                  label="Brand color"
                  onChange={(value) => setDraft((current) => ({ ...current, brandColor: value }))}
                  swatches={['#2563eb', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#7c3aed', '#db2777', '#111827']}
                  value={draft.brandColor}
                />
                <Select
                  allowDeselect={false}
                  data={brandStatuses.map((status) => ({ label: status, value: status }))}
                  label="Status"
                  onChange={(value) => setDraft((current) => ({ ...current, status: value ?? 'ACTIVE' }))}
                  value={draft.status}
                />
              </SimpleGrid>
              <Group justify="flex-end" mt="sm">
                <Button className={styles.neutralAction} disabled={isPending} leftSection={<IconX size={16} />} onClick={() => setEditingField(null)} variant="default">
                  Cancel
                </Button>
                <Button className={styles.primaryAction} disabled={!draft.title.trim()} loading={isPending} leftSection={<IconCheck size={16} />} onClick={() => saveBrandField()}>
                  Save
                </Button>
              </Group>
            </Card>
          ) : null}
          <Card className={styles.inlineEditor} padding="sm" radius="sm" withBorder>
            <Group justify="space-between" align="flex-start" gap="sm">
              <Box className={styles.panelIntro}>
                <SectionTitle hint={brand.hasImage ? 'Logo is stored as a database blob. Upload a replacement, download the current file, or delete it.' : 'Upload a logo file. The image will be stored as a database blob.'} title="Logo" />
                {logoFile ? <Text className={styles.muted}>{logoFile.name} selected.</Text> : null}
              </Box>
              <Group gap="xs">
                <Button className={styles.neutralAction} component="label" leftSection={<IconUpload size={16} />} variant="default">
                  Choose
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    className={styles.affiliateImageInput}
                    onChange={(event) => setLogoFile(event.currentTarget.files?.[0] ?? null)}
                    type="file"
                  />
                </Button>
                {logoFile ? (
                  <Button className={styles.primaryAction} loading={isPending} onClick={() => saveLogo(logoFile)}>
                    Save Logo
                  </Button>
                ) : null}
                {brand.hasImage ? (
                  <Button className={styles.accentAction} component="a" href={`/os/brands/image/${brand.id}?download=true`} leftSection={<IconDownload size={18} stroke={1.8} />} variant="default">
                    Download
                  </Button>
                ) : null}
                {brand.imageUrl ? (
                  <Button className={styles.dangerAction} loading={isPending} leftSection={<IconTrash size={18} stroke={1.8} />} onClick={() => saveLogo(null, true)} variant="default">
                    Delete
                  </Button>
                ) : null}
              </Group>
            </Group>
          </Card>
          {error ? <Text className={styles.error}>{error}</Text> : null}
        </Box>
      </Card>

      <div className={styles.brandDetailGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIntro}>
              <SectionTitle hint="Primary public presence for this brand." title="Website URL" />
            </div>
            <Button className={styles.editAction} leftSection={<IconEdit size={18} stroke={1.8} />} onClick={() => setEditingField('websiteUrl')} variant="default">
              Edit
            </Button>
          </div>
          {editingField === 'websiteUrl' ? (
            <div className={styles.inlineEditor}>
              <TextInput
                description={getCharacterCount(draft.websiteUrl)}
                label="Website URL"
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setDraft((current) => ({ ...current, websiteUrl: value }))
                }}
                placeholder="https://..."
                value={draft.websiteUrl}
              />
              <Group justify="flex-end" mt="sm">
                <Button className={styles.neutralAction} disabled={isPending} onClick={() => setEditingField(null)} variant="default">
                  Cancel
                </Button>
                <Button className={styles.primaryAction} loading={isPending} onClick={() => saveBrandField()}>
                  Save
                </Button>
              </Group>
            </div>
          ) : (
            <Text className={styles.brandSectionText}>{brand.websiteUrl || 'No website linked.'}</Text>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIntro}>
              <SectionTitle hint="Apa brand ini dan konteks utamanya." title="About" />
            </div>
            <Button className={styles.editAction} leftSection={<IconEdit size={18} stroke={1.8} />} onClick={() => setEditingField('description')} variant="default">
              Edit
            </Button>
          </div>
          {editingField === 'description' ? (
            <div className={styles.inlineEditor}>
              <Textarea
                autosize
                description={getCharacterCount(draft.description)}
                minRows={4}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setDraft((current) => ({ ...current, description: value }))
                }}
                value={draft.description}
              />
              <Group justify="flex-end" mt="sm">
                <Button className={styles.neutralAction} disabled={isPending} onClick={() => setEditingField(null)} variant="default">
                  Cancel
                </Button>
                <Button className={styles.primaryAction} loading={isPending} onClick={() => saveBrandField()}>
                  Save
                </Button>
              </Group>
            </div>
          ) : brand.description ? (
            <Text className={styles.brandSectionText}>{brand.description}</Text>
          ) : (
            <EmptySection body="Belum ada deskripsi." title="About belum diisi." />
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIntro}>
              <SectionTitle hint="Presence yang sudah terhubung ke brand ini." title="Social Media" />
            </div>
            <Group gap="xs">
              <Button component={Link} className={styles.neutralAction} href={`/os/socmeds?brand=${brand.id}`} variant="default">
                Open Registry
              </Button>
              <Button className={styles.accentAction} leftSection={<IconLinkPlus size={18} stroke={1.8} />} onClick={() => setIsConnectionsOpen(true)} variant="default">
                Manage Connections
              </Button>
            </Group>
          </div>
          {brand.connections.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
              {brand.connections.map((connection) => (
                <Card className={styles.brandConnectionCard} key={connection.id} padding="sm" radius="sm" withBorder>
                  <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                    <Box>
                      <Group gap="xs" wrap="wrap">
                        <Text className={styles.compactTitle}>{connection.platform}</Text>
                        <Badge className={styles.badge} data-status={connection.status} variant="light">
                          {connection.status}
                        </Badge>
                      </Group>
                      <Text className={styles.muted}>@{connection.account}</Text>
                      <Text className={styles.profileMeta}>
                        {connection.label}
                      </Text>
                    </Box>
                    {connection.url ? (
                      <Tooltip label="Open">
                        <ActionIcon
                          aria-label="Open social account"
                          className={styles.accentIconAction}
                          component="a"
                          href={connection.url}
                          rel="noreferrer noopener"
                          target="_blank"
                          variant="default"
                        >
                          <IconExternalLink size={18} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          ) : allConnectionOptions.length > 0 ? (
            <EmptySection body="Hubungkan existing social media accounts dari module Social Medias." title="Belum ada social media yang terhubung." />
          ) : (
            <EmptySection body="Belum ada social media account di database untuk dihubungkan." title="Tidak ada social media account tersedia." />
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIntro}>
              <SectionTitle hint="Brand ini mau dibawa ke mana." title="Direction" />
            </div>
            <Button className={styles.editAction} leftSection={<IconEdit size={18} stroke={1.8} />} onClick={() => setEditingField('direction')} variant="default">
              Edit
            </Button>
          </div>
          {editingField === 'direction' ? (
            <div className={styles.inlineEditor}>
              <Textarea
                autosize
                description={getCharacterCount(draft.direction)}
                minRows={4}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setDraft((current) => ({ ...current, direction: value }))
                }}
                value={draft.direction}
              />
              <Group justify="flex-end" mt="sm">
                <Button className={styles.neutralAction} disabled={isPending} onClick={() => setEditingField(null)} variant="default">
                  Cancel
                </Button>
                <Button className={styles.primaryAction} loading={isPending} onClick={() => saveBrandField()}>
                  Save
                </Button>
              </Group>
            </div>
          ) : brand.direction ? (
            <Text className={styles.brandSectionText}>{brand.direction}</Text>
          ) : (
            <EmptySection body="Belum ada direction." title="Direction belum diisi." />
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIntro}>
              <SectionTitle hint="Pengembangan berikutnya untuk brand ini." title="Next Development" />
            </div>
            <Button className={styles.editAction} leftSection={<IconEdit size={18} stroke={1.8} />} onClick={() => setEditingField('nextDevelopment')} variant="default">
              Edit
            </Button>
          </div>
          {editingField === 'nextDevelopment' ? (
            <div className={styles.inlineEditor}>
              <Textarea
                autosize
                description={getCharacterCount(draft.nextDevelopment)}
                minRows={4}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setDraft((current) => ({ ...current, nextDevelopment: value }))
                }}
                value={draft.nextDevelopment}
              />
              <Group justify="flex-end" mt="sm">
                <Button className={styles.neutralAction} disabled={isPending} onClick={() => setEditingField(null)} variant="default">
                  Cancel
                </Button>
                <Button className={styles.primaryAction} loading={isPending} onClick={() => saveBrandField()}>
                  Save
                </Button>
              </Group>
            </div>
          ) : brand.nextDevelopment ? (
            <Text className={styles.brandSectionText}>{brand.nextDevelopment}</Text>
          ) : (
            <EmptySection body="Belum ada next development." title="Next Development belum diisi." />
          )}
        </section>

        {brand.contentActivity ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelIntro}>
                <SectionTitle hint="Ringkasan konten dari social account yang terhubung." title="Content Activity" />
              </div>
              <Button component={Link} className={styles.accentAction} href="/os/content" variant="default">
                View Contents
              </Button>
            </div>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
              <Card className={styles.summaryCard} padding="sm" radius="sm" withBorder>
                <Text className={styles.summaryLabel}>Contents</Text>
                <Text className={styles.summaryValue}>{brand.contentActivity.total}</Text>
              </Card>
              <Card className={styles.summaryCard} padding="sm" radius="sm" withBorder>
                <Text className={styles.summaryLabel}>Published</Text>
                <Text className={styles.summaryValue}>{brand.contentActivity.published}</Text>
              </Card>
              <Card className={styles.summaryCard} padding="sm" radius="sm" withBorder>
                <Text className={styles.summaryLabel}>Planned</Text>
                <Text className={styles.summaryValue}>{brand.contentActivity.planned}</Text>
              </Card>
            </SimpleGrid>
          </section>
        ) : null}
      </div>

      {isConnectionsOpen ? (
        <BrandConnectionsModal
          availableAccounts={allConnectionOptions}
          brandId={brand.id}
          initiallySelectedIds={selectedConnectionIds}
          onClose={() => setIsConnectionsOpen(false)}
          opened
        />
      ) : null}
    </>
  )
}
