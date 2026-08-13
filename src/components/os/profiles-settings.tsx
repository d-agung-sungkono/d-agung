'use client'

import { useState, useTransition } from 'react'
import { ActionIcon, Badge, Box, Button, Card, Group, Modal, Select, SimpleGrid, Stack, Text, TextInput, Tooltip } from '@mantine/core'
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
  type Icon,
} from '@tabler/icons-react'

import {
  createAccountGroup,
  createUserSocmed,
  deleteAccountGroup,
  deleteUserSocmed,
  updateAccountGroup,
  updateUserSocmed,
} from '@/app/os/(protected)/socmeds/actions'
import type { AccountGroupOption, SocmedOption, UserSocmed } from '@/lib/os-settings'

import styles from './os-shell.module.css'

type ProfilesSettingsProps = {
  groups: AccountGroupOption[]
  socmeds: SocmedOption[]
  userSocmeds: UserSocmed[]
}

type SocmedForm = {
  account: string
  accountGroupId: string
  id: string
  label: string
  linkedEmail: string
  linkedWhatsapp: string
  socmedId: string
  status: string
  url: string
}

type GroupForm = {
  description: string
  id: string
  name: string
  status: string
}

const emptyForm: SocmedForm = {
  account: '',
  accountGroupId: '',
  id: '',
  label: '',
  linkedEmail: '',
  linkedWhatsapp: '',
  socmedId: '',
  status: 'active',
  url: '',
}

const emptyGroupForm: GroupForm = {
  description: '',
  id: '',
  name: '',
  status: 'active',
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
  formData.set('accountGroupId', form.accountGroupId)
  formData.set('id', form.id)
  formData.set('label', form.label)
  formData.set('linkedEmail', form.linkedEmail)
  formData.set('linkedWhatsapp', form.linkedWhatsapp)
  formData.set('socmedId', form.socmedId)
  formData.set('status', form.status)
  formData.set('url', form.url)
  return formData
}

function buildGroupFormData(form: GroupForm) {
  const formData = new FormData()
  formData.set('description', form.description)
  formData.set('id', form.id)
  formData.set('name', form.name)
  formData.set('status', form.status)
  return formData
}

export default function ProfilesSettings({ groups, socmeds, userSocmeds }: ProfilesSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [copyState, setCopyState] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState('all')
  const [form, setForm] = useState<SocmedForm>({
    ...emptyForm,
    socmedId: socmeds[0]?.id ?? '',
  })
  const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm)
  const isEditing = Boolean(form.id)
  const isEditingGroup = Boolean(groupForm.id)
  const visibleSocmeds =
    selectedGroupId === 'all'
      ? userSocmeds
      : userSocmeds.filter((profile) => profile.accountGroupId === selectedGroupId)
  const groupCards = [
    {
      count: userSocmeds.length,
      id: 'all',
      meta: `${groups.filter((group) => group.status === 'active').length} groups`,
      name: 'All Social Medias',
    },
    ...groups.filter((group) => group.status === 'active').map((group) => {
      const accounts = userSocmeds.filter((profile) => profile.accountGroupId === group.id)
      return {
        count: accounts.length,
        id: group.id,
        meta: `${new Set(accounts.map((profile) => profile.platform)).size} platforms`,
        name: group.name,
      }
    }),
  ]
  const socmedOptions = socmeds.map((socmed) => ({ label: socmed.name, value: socmed.id }))
  const groupOptions = [
    { label: 'No group', value: 'none' },
    ...groups.filter((group) => group.status === 'active').map((group) => ({ label: group.name, value: group.id })),
  ]

  async function copyProfileUrl(profile: UserSocmed) {
    await navigator.clipboard.writeText(profile.url)
    setCopyState(profile.id)
    window.setTimeout(() => setCopyState(null), 1400)
  }

  function openCreateModal() {
    setForm({
      ...emptyForm,
      socmedId: socmeds[0]?.id ?? '',
    })
    setIsOpen(true)
  }

  function openCreateGroupModal() {
    setGroupForm(emptyGroupForm)
    setIsGroupModalOpen(true)
  }

  function openEditGroupModal(group: AccountGroupOption) {
    setGroupForm({
      description: group.description ?? '',
      id: group.id,
      name: group.name,
      status: group.status,
    })
    setIsGroupModalOpen(true)
  }

  function openEditModal(profile: UserSocmed) {
    setForm({
      account: profile.account,
      accountGroupId: profile.accountGroupId ?? '',
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
      const normalizedForm = {
        ...form,
        accountGroupId: form.accountGroupId === 'none' ? '' : form.accountGroupId,
      }

      if (isEditing) {
        await updateUserSocmed(buildFormData(normalizedForm))
      } else {
        await createUserSocmed(buildFormData(normalizedForm))
      }

      setIsOpen(false)
    })
  }

  function saveGroup() {
    startTransition(async () => {
      if (isEditingGroup) {
        await updateAccountGroup(buildGroupFormData(groupForm))
      } else {
        await createAccountGroup(buildGroupFormData(groupForm))
      }

      setIsGroupModalOpen(false)
      setGroupForm(emptyGroupForm)
    })
  }

  function deleteSocmed(profile: UserSocmed) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', profile.id)
      await deleteUserSocmed(formData)
    })
  }

  function removeGroup(group: AccountGroupOption) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', group.id)
      await deleteAccountGroup(formData)

      if (selectedGroupId === group.id) {
        setSelectedGroupId('all')
      }
    })
  }

  return (
    <>
      <Box component="section" className={styles.pageHeader}>
        <Box>
          <Text className={styles.breadcrumb}>Agung OS / Social Medias</Text>
          <Text component="h2" className={styles.pageTitle}>Social Medias</Text>
          <Text className={styles.pageDescription}>
            Platform accounts used to map content, publishing targets, and future embeds.
          </Text>
        </Box>
        <Group gap="sm" className={styles.pageActions}>
          <Button className={styles.neutralAction} disabled={isPending} onClick={openCreateGroupModal} variant="default">
            Manage Account Groups
          </Button>
          <Button className={styles.primaryAction} leftSection={<IconPlus size={18} stroke={1.8} />} loading={isPending} onClick={openCreateModal}>
            Add Social Media Account
          </Button>
        </Group>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs" className={styles.groupCardGrid}>
        {groupCards.map((group) => (
          <Card
            aria-pressed={selectedGroupId === group.id}
            className={styles.groupCard}
            component="button"
            data-active={selectedGroupId === group.id}
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            padding="sm"
            radius="sm"
            withBorder
          >
            <Text className={styles.groupCardLabel}>{group.name}</Text>
            <Text className={styles.groupCardCount}>{group.count}</Text>
            <Text className={styles.groupCardMeta}>{group.meta}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <Box component="section" className={styles.panel}>
        <Group justify="space-between" align="flex-start" className={styles.panelHeader}>
          <Box className={styles.panelIntro}>
            <Text component="h3" className={styles.panelTitle}>Social Media Accounts</Text>
            <Text className={styles.muted}>Each account is linked to a master platform and an account group.</Text>
          </Box>
        </Group>

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
                        {profile.groupName ? ` · ${profile.groupName}` : ''}
                      </Text>
                      <Text className={styles.profileMeta}>
                        Email: {profile.linkedEmail ?? '-'} · WA: {profile.linkedWhatsapp ?? '-'}
                      </Text>
                    </Box>
                    <Group gap="xs" wrap="nowrap" className={styles.listActionGroup}>
                      <Tooltip label={copyState === profile.id ? 'Copied' : 'Copy URL'}>
                        <ActionIcon
                          aria-label={copyState === profile.id ? 'Copied profile URL' : 'Copy profile URL'}
                          onClick={() => copyProfileUrl(profile)}
                          className={styles.neutralIconAction}
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
                        <ActionIcon aria-label="Delete social account" className={styles.dangerIconAction} disabled={isPending} onClick={() => deleteSocmed(profile)} variant="light">
                          <IconTrash size={18} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Open">
                        <ActionIcon aria-label="Open social profile" className={styles.accentIconAction} component="a" href={profile.url} rel="noreferrer" target="_blank" variant="default">
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

        {visibleSocmeds.length === 0 ? (
          <Card className={styles.emptyState} padding="md" radius="sm" withBorder>
            <Text className={styles.compactTitle}>No social medias in this group.</Text>
            <Text className={styles.muted}>Add an account or choose another group.</Text>
          </Card>
        ) : null}
      </Box>

      <Modal
        classNames={{ body: styles.osModalBody, content: styles.osModalContent, header: styles.osModalHeader, title: styles.osModalTitle }}
        opened={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEditing ? 'Edit Social Media Account' : 'Add Social Media Account'}
        centered
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
              data={groupOptions}
              label="Account Group"
              onChange={(value) => setForm((current) => ({ ...current, accountGroupId: value === 'none' ? '' : value ?? '' }))}
              value={form.accountGroupId || 'none'}
            />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Account"
              onChange={(event) => {
                const { value } = event.currentTarget
                setForm((current) => ({ ...current, account: value }))
              }}
              placeholder="das.agung"
              value={form.account}
            />
            <TextInput
              label="Label"
              onChange={(event) => {
                const { value } = event.currentTarget
                setForm((current) => ({ ...current, label: value }))
              }}
              placeholder="Personal Brand"
              value={form.label}
            />
          </SimpleGrid>
          <TextInput
            label="Profile URL"
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({ ...current, url: value }))
            }}
            placeholder="https://..."
            type="url"
            value={form.url}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Linked Email"
              onChange={(event) => {
                const { value } = event.currentTarget
                setForm((current) => ({ ...current, linkedEmail: value }))
              }}
              placeholder="Optional"
              type="email"
              value={form.linkedEmail}
            />
            <TextInput
              label="Linked WhatsApp"
              onChange={(event) => {
                const { value } = event.currentTarget
                setForm((current) => ({ ...current, linkedWhatsapp: value }))
              }}
              placeholder="Optional"
              value={form.linkedWhatsapp}
            />
          </SimpleGrid>
          <Select
            data={[
              { label: 'Active', value: 'active' },
              { label: 'Archived', value: 'archived' },
            ]}
            label="Status"
            onChange={(value) => setForm((current) => ({ ...current, status: value ?? 'active' }))}
            value={form.status}
          />
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

      <Modal
        classNames={{ body: styles.osModalBody, content: styles.osModalContent, header: styles.osModalHeader, title: styles.osModalTitle }}
        opened={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={isEditingGroup ? 'Edit Account Group' : 'Add Account Group'}
        centered
      >
        <Stack gap="sm" className={styles.modalSection}>
          <Text className={styles.modalSectionHint}>
            Manage account-group naming in one place so social media mapping stays consistent.
          </Text>
          <TextInput
            label="Group Name"
            onChange={(event) => {
              const { value } = event.currentTarget
              setGroupForm((current) => ({ ...current, name: value }))
            }}
            placeholder="Laviumhub"
            value={groupForm.name}
          />
          <TextInput
            label="Description"
            onChange={(event) => {
              const { value } = event.currentTarget
              setGroupForm((current) => ({ ...current, description: value }))
            }}
            placeholder="Optional"
            value={groupForm.description}
          />
          <Select
            data={[
              { label: 'Active', value: 'active' },
              { label: 'Archived', value: 'archived' },
            ]}
            label="Status"
            onChange={(value) => setGroupForm((current) => ({ ...current, status: value ?? 'active' }))}
            value={groupForm.status}
          />
          <Group justify="flex-end">
            <Button className={styles.neutralAction} disabled={isPending} onClick={() => setIsGroupModalOpen(false)} variant="default">
              Cancel
            </Button>
            <Button className={styles.primaryAction} loading={isPending} onClick={saveGroup}>
              Save Group
            </Button>
          </Group>

          <Stack gap="xs" mt="sm" className={`${styles.modalSection} ${styles.modalSectionMuted}`}>
            <Text component="h3" className={styles.modalSectionTitle}>Existing Account Groups</Text>
            {groups.map((group) => (
              <Card className={styles.profileItem} key={group.id} padding="sm" radius="sm" withBorder>
                <Box className={styles.profileBody}>
                  <Group justify="space-between" align="flex-start" gap="sm">
                    <Box>
                      <Group gap="xs" wrap="nowrap" className={styles.profileTitleRow}>
                        <Text className={styles.compactTitle}>{group.name}</Text>
                        <Badge className={styles.badge} data-status={group.status} variant="light">
                          {group.status}
                        </Badge>
                      </Group>
                      <Text className={styles.muted}>{group.slug}</Text>
                      {group.description ? <Text className={styles.profileMeta}>{group.description}</Text> : null}
                    </Box>
                    <Group gap="xs" wrap="nowrap" className={styles.listActionGroup}>
                      <Tooltip label="Edit group">
                        <ActionIcon aria-label="Edit account group" className={styles.accentIconAction} disabled={isPending} onClick={() => openEditGroupModal(group)} variant="default">
                          <IconEdit size={18} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete group">
                        <ActionIcon aria-label="Delete account group" className={styles.dangerIconAction} disabled={isPending} onClick={() => removeGroup(group)} variant="light">
                          <IconTrash size={18} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Box>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
