'use client'

import Link from 'next/link'
import { ActionIcon, Badge, Box, Button, Card, Group, SimpleGrid, Text, Tooltip } from '@mantine/core'
import { IconArrowLeft, IconEdit, IconExternalLink, IconLinkPlus } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import type { BrandConnectionOption, BrandDetail } from '@/lib/os-brands-schema'

import BrandConnectionsModal from './brand-connections-modal'
import BrandEditorModal from './brand-editor-modal'
import BrandImage from './brand-image'
import styles from './os-shell.module.css'

type BrandDetailViewProps = {
  allConnectionOptions: BrandConnectionOption[]
  brand: BrandDetail
}

function EmptySection({ body, title }: { body: string; title: string }) {
  return (
    <Card className={styles.brandSectionEmpty} padding="md" radius="sm" withBorder>
      <Text className={styles.compactTitle}>{title}</Text>
      <Text className={styles.muted}>{body}</Text>
    </Card>
  )
}

export default function BrandDetailView({ allConnectionOptions, brand }: BrandDetailViewProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false)
  const selectedConnectionIds = useMemo(() => brand.connections.map((connection) => connection.id), [brand.connections])

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
              <Button className={styles.accentAction} leftSection={<IconEdit size={18} stroke={1.8} />} onClick={() => setIsEditOpen(true)} variant="default">
                Edit Brand
              </Button>
            </Group>
          </Group>
        </Box>
      </Card>

      <div className={styles.brandDetailGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIntro}>
              <h3 className={styles.panelTitle}>About</h3>
              <p className={styles.muted}>Apa brand ini dan konteks utamanya.</p>
            </div>
          </div>
          {brand.description ? (
            <Text className={styles.brandSectionText}>{brand.description}</Text>
          ) : (
            <EmptySection body="Belum ada deskripsi." title="About belum diisi." />
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIntro}>
              <h3 className={styles.panelTitle}>Social Media</h3>
              <p className={styles.muted}>Presence yang sudah terhubung ke brand ini.</p>
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
              <h3 className={styles.panelTitle}>Direction</h3>
              <p className={styles.muted}>Brand ini mau dibawa ke mana.</p>
            </div>
          </div>
          {brand.direction ? (
            <Text className={styles.brandSectionText}>{brand.direction}</Text>
          ) : (
            <EmptySection body="Belum ada direction." title="Direction belum diisi." />
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIntro}>
              <h3 className={styles.panelTitle}>Next Development</h3>
              <p className={styles.muted}>Pengembangan berikutnya untuk brand ini.</p>
            </div>
          </div>
          {brand.nextDevelopment ? (
            <Text className={styles.brandSectionText}>{brand.nextDevelopment}</Text>
          ) : (
            <EmptySection body="Belum ada next development." title="Next Development belum diisi." />
          )}
        </section>

        {brand.contentActivity ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelIntro}>
                <h3 className={styles.panelTitle}>Content Activity</h3>
                <p className={styles.muted}>Ringkasan konten dari social account yang terhubung.</p>
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

      {isEditOpen ? <BrandEditorModal brand={brand} onClose={() => setIsEditOpen(false)} opened /> : null}
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
