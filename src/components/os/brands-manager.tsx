'use client'

import Link from 'next/link'
import { ActionIcon, Badge, Box, Button, Card, Group, SimpleGrid, Text, Tooltip } from '@mantine/core'
import { IconArrowRight, IconExternalLink, IconPlus } from '@tabler/icons-react'
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

  return (
    <>
      <Box component="section" className={styles.pageHeader}>
        <Box>
          <Text component="h2" className={styles.pageTitle}>Brands</Text>
          <Text className={styles.pageDescription}>Dokumentasi hal-hal yang sedang saya handle.</Text>
        </Box>
      </Box>

      {brands.length > 0 ? (
        <section className={styles.panel}>
          <Group justify="space-between" align="flex-start" gap="md" className={styles.panelHeader}>
            <Box className={styles.panelIntro}>
              <Text component="h3" className={styles.panelTitle}>Brands</Text>
              <Text className={styles.muted}>Manage brand roots, public presence, and connected channels.</Text>
            </Box>
            <Group className={styles.pageActions} gap="sm">
              <Button className={styles.primaryAction} leftSection={<IconPlus size={18} stroke={1.8} />} onClick={() => setIsCreateOpen(true)}>
                Add Brand
              </Button>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, lg: 2, xl: 3 }} spacing="sm">
            {brands.map((brand) => (
              <Card className={styles.brandCard} key={brand.id} padding="sm" radius="sm" withBorder>
                <BrandImage alt={brand.title} className={styles.brandCardImage} labelClassName={styles.brandCardImageFallback} src={brand.imageUrl} />
                <Box className={styles.brandCardBody}>
                  <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                    <Box className={styles.brandCardHeader}>
                      <Group gap="xs" wrap="nowrap">
                        <span aria-hidden="true" className={styles.brandColorSwatch} style={{ backgroundColor: brand.brandColor }} />
                        <Text className={styles.compactTitle}>{brand.title}</Text>
                      </Group>
                      <Text className={styles.brandCardDescription}>{getDescriptionPreview(brand.description)}</Text>
                    </Box>
                    <Badge className={styles.badge} data-status={brand.status} variant="light">
                      {brand.status}
                    </Badge>
                  </Group>
                  <Group className={styles.brandCardMeta} gap="xs">
                    <Text className={styles.brandMetaLine}>{brand.websiteUrl ? 'Website available' : 'No website linked'}</Text>
                    <Text className={styles.brandMetaLine}>
                      {brand.connectedSocialAccounts} social account{brand.connectedSocialAccounts === 1 ? '' : 's'}
                    </Text>
                  </Group>
                </Box>
                <Group className={styles.listActionGroup} gap="xs" justify="flex-end">
                  <Tooltip label="Open brand">
                    <ActionIcon aria-label="Open brand" className={styles.accentIconAction} component={Link} href={`/os/brands/${brand.id}`} variant="default">
                      <IconArrowRight size={18} stroke={1.8} />
                    </ActionIcon>
                  </Tooltip>
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
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </section>
      ) : (
        <Card className={styles.emptyState} padding="lg" radius="sm" withBorder>
          <Text className={styles.compactTitle}>Belum ada brand.</Text>
          <Text className={styles.muted}>Tambahkan brand pertama untuk mulai membangun knowledge root di Agung OS.</Text>
        </Card>
      )}

      {isCreateOpen ? <BrandEditorModal onClose={() => setIsCreateOpen(false)} opened /> : null}
    </>
  )
}
