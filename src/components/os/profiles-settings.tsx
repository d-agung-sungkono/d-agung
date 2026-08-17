'use client'

import { useState, useTransition } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
  type ComboboxItem,
} from '@mantine/core'
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandShopee,
  IconBrandThreads,
  IconBrandTiktok,
  IconBrandX,
  IconBrandYoutube,
  IconCheck,
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconPlus,
  IconTrash,
  IconTopologyStar3,
  type Icon,
} from '@tabler/icons-react'
import Link from 'next/link'

import { createUserSocmed, deleteUserSocmed, updateUserSocmed } from '@/app/os/(protected)/socmeds/actions'
import type { BrandOption, SocmedOption, UserSocmed } from '@/lib/os-settings'

import styles from './os-shell.module.css'

type ProfilesSettingsProps = {
  brands: BrandOption[]
  initialBrandId?: string
  socmeds: SocmedOption[]
  userSocmeds: UserSocmed[]
}

type SocmedForm = {
  account: string
  brandIds: string[]
  id: string
  label: string
  linkedEmail: string
  linkedWhatsapp: string
  socmedId: string
  status: string
  url: string
}

const emptyForm: SocmedForm = {
  account: '',
  brandIds: [],
  id: '',
  label: '',
  linkedEmail: '',
  linkedWhatsapp: '',
  socmedId: '',
  status: 'active',
  url: '',
}

const platformIcons: Record<string, Icon> = {
  Facebook: IconBrandFacebook,
  Instagram: IconBrandInstagram,
  LinkedIn: IconBrandLinkedin,
  Shopee: IconBrandShopee,
  Threads: IconBrandThreads,
  TikTok: IconBrandTiktok,
  X: IconBrandX,
  YouTube: IconBrandYoutube,
}

function buildFormData(form: SocmedForm) {
  const formData = new FormData()
  formData.set('account', form.account)
  for (const brandId of form.brandIds) {
    formData.append('brandIds', brandId)
  }
  formData.set('id', form.id)
  formData.set('label', form.label)
  formData.set('linkedEmail', form.linkedEmail)
  formData.set('linkedWhatsapp', form.linkedWhatsapp)
  formData.set('socmedId', form.socmedId)
  formData.set('status', form.status)
  formData.set('url', form.url)
  return formData
}

export default function ProfilesSettings({ brands, initialBrandId, socmeds, userSocmeds }: ProfilesSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [copyState, setCopyState] = useState<string | null>(null)
  const hasInitialBrand = Boolean(initialBrandId && brands.some((brand) => brand.id === initialBrandId))
  const [selectedBrandId, setSelectedBrandId] = useState(hasInitialBrand ? initialBrandId ?? 'all' : 'all')
  const [form, setForm] = useState<SocmedForm>({
    ...emptyForm,
    socmedId: socmeds[0]?.id ?? '',
  })
  const isEditing = Boolean(form.id)
  const visibleSocmeds =
    selectedBrandId === 'all'
      ? userSocmeds
      : selectedBrandId === 'unassigned'
        ? userSocmeds.filter((profile) => profile.brandIds.length === 0)
        : userSocmeds.filter((profile) => profile.brandIds.includes(selectedBrandId))
  const brandCards = [
    {
      count: userSocmeds.length,
      id: 'all',
      meta: `${brands.filter((brand) => brand.status === 'ACTIVE').length} active brands`,
      name: 'All Social Medias',
    },
    ...brands.map((brand) => {
      const accounts = userSocmeds.filter((profile) => profile.brandIds.includes(brand.id))
      return {
        count: accounts.length,
        id: brand.id,
        meta: `${new Set(accounts.map((profile) => profile.platform)).size} platforms`,
        name: brand.name,
      }
    }),
    {
      count: userSocmeds.filter((profile) => profile.brandIds.length === 0).length,
      id: 'unassigned',
      meta: 'belum terhubung ke brand',
      name: 'Unassigned',
    },
  ]
  const socmedOptions = socmeds.map((socmed) => ({ label: socmed.name, value: socmed.id }))
  const brandOptions: ComboboxItem[] = brands.map((brand) => ({
    label: brand.status === 'ACTIVE' ? brand.name : `${brand.name} (${brand.status})`,
    value: brand.id,
  }))

  async function copyProfileUrl(profile: UserSocmed) {
    await navigator.clipboard.writeText(profile.url)
    setCopyState(profile.id)
    window.setTimeout(() => setCopyState(null), 1400)
  }

  function openCreateModal() {
    setForm({
      ...emptyForm,
      brandIds: selectedBrandId !== 'all' && selectedBrandId !== 'unassigned' ? [selectedBrandId] : [],
      socmedId: socmeds[0]?.id ?? '',
    })
    setIsOpen(true)
  }

  function openEditModal(profile: UserSocmed) {
    setForm({
      account: profile.account,
      brandIds: profile.brandIds,
      id: profile.id,
      label: profile.label,
      linkedEmail: profile.linkedEmail ?? '',
      linkedWhatsapp: profile.linkedWhatsapp ?? '',
      socmedId: profile.socmedId,
      status: profile.status,
      url: profile.url,
    })
    setIsOpen(true)
  }

  function saveSocmed() {
    startTransition(async () => {
      if (isEditing) {
        await updateUserSocmed(buildFormData(form))
      } else {
        await createUserSocmed(buildFormData(form))
      }

      setIsOpen(false)
    })
  }

  function removeSocmed(profile: UserSocmed) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', profile.id)
      await deleteUserSocmed(formData)
    })
  }

  return (
    <>
      <Box component="section" className={styles.pageHeader}>
        <Box>
          <Text className={styles.breadcrumb}>Agung OS / Social Medias</Text>
          <Text component="h2" className={styles.pageTitle}>Social Media Registry</Text>
          <Text className={styles.pageDescription}>
            Registry untuk account social media yang sudah jelas konteks brand-nya. Entry point utamanya tetap dari Brand.
          </Text>
        </Box>
        <Group gap="sm" className={styles.pageActions}>
          <Button
            className={styles.neutralAction}
            component={Link}
            href="/os/brands"
            leftSection={<IconTopologyStar3 size={18} stroke={1.8} />}
            variant="default"
          >
            Go to Brands
          </Button>
          <Button
            className={styles.primaryAction}
            disabled={brands.length === 0}
            leftSection={<IconPlus size={18} stroke={1.8} />}
            loading={isPending}
            onClick={openCreateModal}
          >
            Register Social Account
          </Button>
        </Group>
      </Box>

      <Card className={styles.brandFlowCallout} padding="md" radius="sm" withBorder>
        <Text className={styles.compactTitle}>Flow yang dipakai sekarang</Text>
        <Text className={styles.muted}>
          Tentukan dulu brand yang sedang di-handle, lalu daftarkan social account ke brand itu. Halaman ini dipakai untuk registry, audit, dan maintenance account.
        </Text>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs" className={styles.groupCardGrid}>
        {brandCards.map((brand) => (
          <Card
            aria-pressed={selectedBrandId === brand.id}
            className={styles.groupCard}
            component="button"
            data-active={selectedBrandId === brand.id}
            key={brand.id}
            onClick={() => setSelectedBrandId(brand.id)}
            padding="sm"
            radius="sm"
            withBorder
          >
            <Text className={styles.groupCardLabel}>{brand.name}</Text>
            <Text className={styles.groupCardCount}>{brand.count}</Text>
            <Text className={styles.groupCardMeta}>{brand.meta}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <Box component="section" className={styles.panel}>
        <Group justify="space-between" align="flex-start" className={styles.panelHeader}>
          <Box className={styles.panelIntro}>
            <Text component="h3" className={styles.panelTitle}>Social Media Accounts</Text>
            <Text className={styles.muted}>Each account is mapped to a platform and must be connected directly to one or more brands.</Text>
          </Box>
        </Group>

        {brands.length === 0 ? (
          <Card className={styles.emptyState} padding="md" radius="sm" withBorder>
            <Text className={styles.compactTitle}>Belum ada brand.</Text>
            <Text className={styles.muted}>Buat brand dulu supaya social account bisa diregistrasikan dengan konteks yang jelas.</Text>
            <Button component={Link} className={styles.accentAction} href="/os/brands" mt="md" variant="default">
              Open Brands
            </Button>
          </Card>
        ) : (
          <Stack gap="xs">
            {visibleSocmeds.map((profile) => {
            const PlatformIcon = platformIcons[profile.platform]

            return (
              <Card className={styles.profileItem} key={profile.id} padding="sm" radius="sm" withBorder>
                <Box className={styles.profileBrand} data-platform={profile.platform}>
                  {PlatformIcon ? <PlatformIcon size={28} stroke={1.7} /> : profile.platform.slice(0, 2)}
                </Box>
                <Box className={styles.profileBody}>
                  <Group justify="space-between" align="flex-start" gap="sm">
                    <Box>
                      <Group gap="xs" wrap="nowrap" className={styles.profileTitleRow}>
                        <Text className={styles.compactTitle}>{profile.label}</Text>
                        <Badge className={styles.badge} data-status={profile.status} variant="light">
                          {profile.status}
                        </Badge>
                      </Group>
                      <Text className={styles.muted}>
                        {profile.platform} · @{profile.account}
                      </Text>
                      <Text className={styles.profileMeta}>
                        Email: {profile.linkedEmail ?? '-'} · WA: {profile.linkedWhatsapp ?? '-'}
                      </Text>
                      <Group gap={6} mt={8}>
                        {profile.brandNames.length > 0 ? (
                          profile.brandNames.map((brandName) => (
                            <Badge className={styles.badge} key={brandName} variant="light">
                              {brandName}
                            </Badge>
                          ))
                        ) : (
                          <Badge className={styles.badge} data-status="PAUSED" variant="light">
                            No Brand
                          </Badge>
                        )}
                      </Group>
                    </Box>
                    <Group gap="xs" wrap="nowrap" className={styles.listActionGroup}>
                      <Tooltip label={copyState === profile.id ? 'Copied' : 'Copy URL'}>
                        <ActionIcon
                          aria-label={copyState === profile.id ? 'Copied profile URL' : 'Copy profile URL'}
                          className={styles.neutralIconAction}
                          onClick={() => copyProfileUrl(profile)}
                          variant="default"
                        >
                          {copyState === profile.id ? <IconCheck size={18} stroke={1.8} /> : <IconCopy size={18} stroke={1.8} />}
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon aria-label="Edit social account" className={styles.accentIconAction} disabled={isPending} onClick={() => openEditModal(profile)} variant="default">
                          <IconEdit size={18} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon aria-label="Delete social account" className={styles.dangerIconAction} disabled={isPending} onClick={() => removeSocmed(profile)} variant="light">
                          <IconTrash size={18} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Open">
                        <ActionIcon aria-label="Open social profile" className={styles.accentIconAction} component="a" href={profile.url} rel="noreferrer noopener" target="_blank" variant="default">
                          <IconExternalLink size={18} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Box>
              </Card>
            )
          })}
          </Stack>
        )}

        {brands.length > 0 && visibleSocmeds.length === 0 ? (
          <Card className={styles.emptyState} padding="md" radius="sm" withBorder>
            <Text className={styles.compactTitle}>Belum ada social account di view ini.</Text>
            <Text className={styles.muted}>Pilih brand lain atau registrasikan account baru dengan context brand yang tepat.</Text>
          </Card>
        ) : null}
      </Box>

      <Modal
        centered
        classNames={{ body: styles.osModalBody, content: styles.osModalContent, header: styles.osModalHeader, title: styles.osModalTitle }}
        opened={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEditing ? 'Edit Social Media Account' : 'Add Social Media Account'}
      >
        <Stack gap="sm" className={styles.modalSection}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              data={socmedOptions}
              label="Platform"
              onChange={(value) => setForm((current) => ({ ...current, socmedId: value ?? '' }))}
              value={form.socmedId}
            />
            <Select
              data={[
                { label: 'Active', value: 'active' },
                { label: 'Archived', value: 'archived' },
              ]}
              label="Status"
              onChange={(value) => setForm((current) => ({ ...current, status: value ?? 'active' }))}
              value={form.status}
            />
          </SimpleGrid>
          <MultiSelect
            data={brandOptions}
            label="Brands"
            onChange={(value) => setForm((current) => ({ ...current, brandIds: value }))}
            placeholder="Connect to one or more brands"
            required
            value={form.brandIds}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Account"
              onChange={(event) => setForm((current) => ({ ...current, account: event.currentTarget.value }))}
              placeholder="dagungsungkono"
              value={form.account}
            />
            <TextInput
              label="Label"
              onChange={(event) => setForm((current) => ({ ...current, label: event.currentTarget.value }))}
              placeholder="D.Agung"
              value={form.label}
            />
          </SimpleGrid>
          <TextInput
            label="Profile URL"
            onChange={(event) => setForm((current) => ({ ...current, url: event.currentTarget.value }))}
            placeholder="https://..."
            type="url"
            value={form.url}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Linked Email"
              onChange={(event) => setForm((current) => ({ ...current, linkedEmail: event.currentTarget.value }))}
              placeholder="Optional"
              type="email"
              value={form.linkedEmail}
            />
            <TextInput
              label="Linked WhatsApp"
              onChange={(event) => setForm((current) => ({ ...current, linkedWhatsapp: event.currentTarget.value }))}
              placeholder="Optional"
              value={form.linkedWhatsapp}
            />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button className={styles.neutralAction} disabled={isPending} onClick={() => setIsOpen(false)} variant="default">
              Cancel
            </Button>
            <Button className={styles.primaryAction} loading={isPending} onClick={saveSocmed}>
              Save Account
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
