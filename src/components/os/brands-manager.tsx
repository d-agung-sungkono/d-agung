'use client'

import Link from 'next/link'
import { ActionIcon, Badge, Box, Button, Card, Group, SimpleGrid, Text, Tooltip } from '@mantine/core'
import { IconEdit, IconExternalLink, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

import type { BrandListItem } from '@/lib/os-brands-schema'

import BrandEditorModal from './brand-editor-modal'
import BrandImage from './brand-image'
import styles from './os-shell.module.css'

type BrandsManagerProps = {
  brands: BrandListItem[]
}

function getDescriptionPreview(value: string | null) {
  if (!value) {
    return 'Belum ada deskripsi.'
  }

  return value
}

export default function BrandsManager({ brands }: BrandsManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandListItem | null>(null)

  return (
    <>
      <Box component="section" className={styles.pageHeader}>
        <Box>
          <Text className={styles.breadcrumb}>Agung OS / Brands</Text>
          <Text component="h2" className={styles.pageTitle}>Brands</Text>
          <Text className={styles.pageDescription}>Dokumentasi hal-hal yang sedang saya handle.</Text>
        </Box>
        <Group className={styles.pageActions} gap="sm">
          <Button className={styles.primaryAction} leftSection={<IconPlus size={18} stroke={1.8} />} onClick={() => setIsCreateOpen(true)}>
            Add Brand
          </Button>
        </Group>
      </Box>

      {brands.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="sm">
          {brands.map((brand) => (
            <Card className={styles.brandCard} key={brand.id} padding="md" radius="sm" withBorder>
              <BrandImage alt={brand.title} className={styles.brandCardImage} labelClassName={styles.brandCardImageFallback} src={brand.imageUrl} />
              <Group justify="space-between" align="flex-start" gap="sm">
                <Box className={styles.brandCardHeader}>
                  <Text className={styles.compactTitle}>{brand.title}</Text>
                  <Text className={styles.brandCardDescription}>{getDescriptionPreview(brand.description)}</Text>
                </Box>
                <Badge className={styles.badge} data-status={brand.status} variant="light">
                  {brand.status}
                </Badge>
              </Group>
              <Box className={styles.brandCardMeta}>
                {brand.websiteUrl ? (
                  <Text className={styles.brandMetaLine}>
                    <span aria-hidden="true">🌐</span> Website available
                  </Text>
                ) : (
                  <Text className={styles.brandMetaLine}>No website linked</Text>
                )}
                <Text className={styles.brandMetaLine}>
                  {brand.connectedSocialAccounts} social account{brand.connectedSocialAccounts === 1 ? '' : 's'}
                </Text>
              </Box>
              <Group className={styles.listActionGroup} gap="xs" justify="space-between">
                <Button component={Link} className={styles.accentAction} href={`/os/brands/${brand.id}`} variant="default">
                  Open
                </Button>
                <Group gap="xs">
                  {brand.websiteUrl ? (
                    <Tooltip label="Open website">
                      <ActionIcon
                        aria-label="Open brand website"
                        className={styles.accentIconAction}
                        component="a"
                        href={brand.websiteUrl}
                        rel="noreferrer noopener"
                        target="_blank"
                        variant="default"
                      >
                        <IconExternalLink size={18} stroke={1.8} />
                      </ActionIcon>
                    </Tooltip>
                  ) : null}
                  <Tooltip label="Edit">
                    <ActionIcon aria-label="Edit brand" className={styles.accentIconAction} onClick={() => setEditingBrand(brand)} variant="default">
                      <IconEdit size={18} stroke={1.8} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Card className={styles.emptyState} padding="lg" radius="sm" withBorder>
          <Text className={styles.compactTitle}>Belum ada brand.</Text>
          <Text className={styles.muted}>Tambahkan brand pertama untuk mulai membangun knowledge root di Agung OS.</Text>
        </Card>
      )}

      {isCreateOpen ? <BrandEditorModal onClose={() => setIsCreateOpen(false)} opened /> : null}
      {editingBrand ? <BrandEditorModal brand={editingBrand} onClose={() => setEditingBrand(null)} opened /> : null}
    </>
  )
}
