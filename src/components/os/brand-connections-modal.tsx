'use client'

import { Badge, Box, Button, Card, Checkbox, Group, Modal, Stack, Text } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { updateBrandConnections } from '@/app/os/(protected)/brands/actions'
import type { BrandConnectionOption } from '@/lib/os-brands-schema'

import styles from './os-shell.module.css'

type BrandConnectionsModalProps = {
  availableAccounts: BrandConnectionOption[]
  brandId: string
  initiallySelectedIds: string[]
  onClose: () => void
  opened: boolean
}

export default function BrandConnectionsModal({
  availableAccounts,
  brandId,
  initiallySelectedIds,
  onClose,
  opened,
}: BrandConnectionsModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>(initiallySelectedIds)

  function saveConnections() {
    startTransition(async () => {
      try {
        setError(null)
        const formData = new FormData()
        formData.set('brandId', brandId)

        for (const accountId of selectedIds) {
          formData.append('socialMediaAccountIds', accountId)
        }

        await updateBrandConnections(formData)
        onClose()
        router.refresh()
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to update social media connections.')
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
      title="Manage Social Media Connections"
      size="44rem"
    >
      <Stack className={styles.modalSection} gap="sm">
        {availableAccounts.length > 0 ? (
          <Checkbox.Group onChange={setSelectedIds} value={selectedIds}>
            <Stack gap="xs">
              {availableAccounts.map((account) => (
                <Card className={styles.brandConnectionOption} key={account.id} padding="sm" radius="sm" withBorder>
                  <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                    <Checkbox value={account.id} />
                    <Box className={styles.brandConnectionOptionBody}>
                      <Group gap="xs" wrap="wrap">
                        <Text className={styles.compactTitle}>{account.platform}</Text>
                        <Badge className={styles.badge} data-status={account.status} variant="light">
                          {account.status}
                        </Badge>
                      </Group>
                      <Text className={styles.muted}>
                        @{account.account} · {account.label}
                      </Text>
                      <Text className={styles.profileMeta}>{account.url}</Text>
                    </Box>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Checkbox.Group>
        ) : (
          <Card className={styles.emptyState} padding="md" radius="sm" withBorder>
            <Text className={styles.compactTitle}>No social media account available.</Text>
            <Text className={styles.muted}>Buat account lebih dulu dari module Social Medias, lalu hubungkan dari sini.</Text>
          </Card>
        )}
        {error ? <Text className={styles.error}>{error}</Text> : null}
        <Group justify="flex-end">
          <Button className={styles.neutralAction} disabled={isPending} onClick={onClose} variant="default">
            Cancel
          </Button>
          <Button className={styles.accentAction} disabled={availableAccounts.length === 0} loading={isPending} onClick={saveConnections} variant="default">
            Save Connections
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
