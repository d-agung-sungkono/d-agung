'use client'

import { useMemo, useState, useTransition } from 'react'
import { ActionIcon, Badge, Box, Button, Card, Group, Modal, Select, SimpleGrid, Stack, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { IconEdit, IconExternalLink, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react'

import { createContentPost, deleteContentPost, updateContentPost } from '@/app/os/(protected)/content/actions'

import styles from './os-shell.module.css'

type ContentItem = {
  id: string
  title: string
  account: string
  platform: string
  label: string
  groupName: string | null
  userSocmedId: string | null
  url: string | null
  scheduledAt: string
  publishedAt: string | null
  status: string
  notes: string | null
}

type Profile = {
  id: string
  platform: string
  account: string
  label: string
  groupName: string | null
}

type ContentTarget = {
  id: string
  name: string
  userSocmedId: string
  platform: string
  account: string
  label: string
  groupName: string | null
  cadenceDays: number
  startDate: string
  preferredTime: string | null
  timezone: string
  status: string
}

type ContentListProps = {
  content: ContentItem[]
  profiles: Profile[]
  targets: ContentTarget[]
}

type ContentForm = {
  id: string
  notes: string
  scheduledAt: string
  status: string
  title: string
  url: string
  userSocmedId: string
}

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Planned', value: 'planned' },
  { label: 'Ready', value: 'ready' },
  { label: 'Published', value: 'published' },
  { label: 'Skipped', value: 'skipped' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

function formatInputDate(value: string) {
  const date = new Date(value)
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function buildFormData(form: ContentForm) {
  const formData = new FormData()
  formData.set('id', form.id)
  formData.set('notes', form.notes)
  formData.set('scheduledAt', form.scheduledAt)
  formData.set('status', form.status)
  formData.set('title', form.title)
  formData.set('url', form.url)
  formData.set('userSocmedId', form.userSocmedId)
  return formData
}

function getEmptyForm(profileId = ''): ContentForm {
  return {
    id: '',
    notes: '',
    scheduledAt: '',
    status: 'draft',
    title: '',
    url: '',
    userSocmedId: profileId,
  }
}

export default function ContentList({ content, profiles, targets }: ContentListProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [userSocmedId, setUserSocmedId] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('5')
  const [form, setForm] = useState<ContentForm>(() => getEmptyForm(profiles[0]?.id ?? ''))
  const isEditing = Boolean(form.id)

  const profilesById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])
  const platforms = useMemo(() => ['all', ...Array.from(new Set(content.map((item) => item.platform)))], [content])
  const statuses = useMemo(() => ['all', ...Array.from(new Set(content.map((item) => item.status)))], [content])
  const profileOptions = profiles.map((profile) => ({
    label: `${profile.platform} · @${profile.account}`,
    value: profile.id,
  }))
  const pageSizeNumber = Number(pageSize)

  const filteredContent = content.filter((item) => {
    const profile = item.userSocmedId ? profilesById.get(item.userSocmedId) : null
    const normalizedQuery = query.toLowerCase()
    const matchesQuery =
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.account.toLowerCase().includes(normalizedQuery) ||
      item.platform.toLowerCase().includes(normalizedQuery) ||
      profile?.account.toLowerCase().includes(normalizedQuery)
    const matchesProfile = userSocmedId === 'all' || item.userSocmedId === userSocmedId
    const matchesPlatform = platform === 'all' || item.platform === platform
    const matchesStatus = status === 'all' || item.status === status

    return matchesQuery && matchesProfile && matchesPlatform && matchesStatus
  })

  const pageCount = Math.max(1, Math.ceil(filteredContent.length / pageSizeNumber))
  const safePage = Math.min(page, pageCount)
  const paginatedContent = filteredContent.slice((safePage - 1) * pageSizeNumber, safePage * pageSizeNumber)

  function resetPagination(update: () => void) {
    update()
    setPage(1)
  }

  function openCreateModal() {
    setForm(getEmptyForm(profiles[0]?.id ?? ''))
    setIsOpen(true)
  }

  function openEditModal(item: ContentItem) {
    setForm({
      id: item.id,
      notes: item.notes ?? '',
      scheduledAt: formatInputDate(item.scheduledAt),
      status: item.status,
      title: item.title,
      url: item.url ?? '',
      userSocmedId: item.userSocmedId ?? profiles[0]?.id ?? '',
    })
    setIsOpen(true)
  }

  function saveContent() {
    startTransition(async () => {
      if (isEditing) {
        await updateContentPost(buildFormData(form))
      } else {
        await createContentPost(buildFormData(form))
      }

      setIsOpen(false)
    })
  }

  function removeContent(item: ContentItem) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', item.id)
      await deleteContentPost(formData)
    })
  }

  return (
    <Box component="section" className={styles.panel}>
      <Group justify="space-between" align="flex-start" gap="md" className={styles.panelHeader}>
        <Box>
          <Text component="h3" className={styles.panelTitle}>Contents</Text>
          <Text className={styles.muted}>Manage drafts, schedules, links, and published posts from DB.</Text>
        </Box>
        <Button leftSection={<IconPlus size={18} stroke={1.8} />} loading={isPending} onClick={openCreateModal}>
          Add Contents
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs" className={styles.targetStrip}>
        {targets.map((target) => (
          <Card className={styles.targetPill} key={target.id} padding="sm" radius="sm" withBorder>
            <Text className={styles.compactTitle}>{target.name}</Text>
            <Text className={styles.muted}>
              {target.platform} · @{target.account} · every {target.cadenceDays} days
              {target.preferredTime ? ` · ${target.preferredTime.slice(0, 5)} WIB` : ''}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="xs" className={styles.contentToolbar}>
        <TextInput
          onChange={(event) => resetPagination(() => setQuery(event.currentTarget.value))}
          placeholder="Cari judul, akun, platform"
          type="search"
          value={query}
        />
        <Select
          data={[{ label: 'Akun', value: 'all' }, ...profileOptions]}
          onChange={(value) => resetPagination(() => setUserSocmedId(value ?? 'all'))}
          value={userSocmedId}
        />
        <Select
          data={platforms.map((item) => ({ label: item === 'all' ? 'Platform' : item, value: item }))}
          onChange={(value) => resetPagination(() => setPlatform(value ?? 'all'))}
          value={platform}
        />
        <Select
          data={statuses.map((item) => ({ label: item === 'all' ? 'Status' : item, value: item }))}
          onChange={(value) => resetPagination(() => setStatus(value ?? 'all'))}
          value={status}
        />
        <Button
          leftSection={<IconRefresh size={18} stroke={1.8} />}
          onClick={() => {
            setQuery('')
            setUserSocmedId('all')
            setPlatform('all')
            setStatus('all')
            setPage(1)
          }}
          variant="default"
        >
          Atur ulang
        </Button>
      </SimpleGrid>

      <Stack gap="xs">
        {paginatedContent.map((item) => (
          <Card className={styles.compactItem} key={item.id} padding="sm" radius="sm" withBorder>
            <Group justify="space-between" align="flex-start" gap="sm">
              <Box>
                <Text className={styles.compactTitle}>{item.title}</Text>
                <Text className={styles.muted}>
                  {item.label} · {item.platform} · @{item.account}
                  {item.groupName ? ` · ${item.groupName}` : ''} · {formatDate(item.scheduledAt)}
                </Text>
              </Box>
              <Group gap="xs" wrap="nowrap">
                {item.url ? (
                  <Tooltip label="Open">
                    <ActionIcon aria-label="Open content link" component="a" href={item.url} rel="noreferrer" target="_blank" variant="default">
                      <IconExternalLink size={18} stroke={1.8} />
                    </ActionIcon>
                  </Tooltip>
                ) : null}
                <Tooltip label="Edit">
                  <ActionIcon aria-label="Edit content" disabled={isPending} onClick={() => openEditModal(item)} variant="default">
                    <IconEdit size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon aria-label="Delete content" color="red" disabled={isPending} onClick={() => removeContent(item)} variant="light">
                    <IconTrash size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
            <Group gap="xs" mt="xs">
              <Badge className={styles.badge} data-status={item.status} variant="light">
                {item.status}
              </Badge>
              {item.notes ? <Text className={styles.profileMeta}>{item.notes}</Text> : null}
            </Group>
          </Card>
        ))}
      </Stack>

      {paginatedContent.length === 0 ? (
        <Card className={styles.emptyState} padding="md" radius="sm" withBorder>
          <Text className={styles.compactTitle}>No contents found.</Text>
          <Text className={styles.muted}>Adjust filters or add a new content item.</Text>
        </Card>
      ) : null}

      <Group justify="flex-end" gap="xs" className={styles.pagination}>
        <Text>
          Page {safePage} of {pageCount} · {filteredContent.length} contents
        </Text>
        <Select
          data={[
            { label: '5 / page', value: '5' },
            { label: '10 / page', value: '10' },
            { label: '20 / page', value: '20' },
          ]}
          onChange={(value) => {
            setPageSize(value ?? '5')
            setPage(1)
          }}
          value={pageSize}
          w={110}
        />
        <Button disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} variant="default">
          Prev
        </Button>
        <Button disabled={safePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} variant="default">
          Next
        </Button>
      </Group>

      <Modal opened={isOpen} onClose={() => setIsOpen(false)} title={isEditing ? 'Edit Contents' : 'Add Contents'} centered>
        <Stack gap="sm">
          <TextInput
            label="Title"
            onChange={(event) => setForm((current) => ({ ...current, title: event.currentTarget.value }))}
            placeholder="Contents title"
            value={form.title}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              data={profileOptions}
              label="Account"
              onChange={(value) => setForm((current) => ({ ...current, userSocmedId: value ?? '' }))}
              value={form.userSocmedId}
            />
            <Select
              data={statusOptions}
              label="Status"
              onChange={(value) => setForm((current) => ({ ...current, status: value ?? 'draft' }))}
              value={form.status}
            />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Contents Link"
              onChange={(event) => setForm((current) => ({ ...current, url: event.currentTarget.value }))}
              placeholder="https://"
              type="url"
              value={form.url}
            />
            <TextInput
              label="Schedule WIB"
              onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.currentTarget.value }))}
              type="datetime-local"
              value={form.scheduledAt}
            />
          </SimpleGrid>
          <Textarea
            label="Notes"
            onChange={(event) => setForm((current) => ({ ...current, notes: event.currentTarget.value }))}
            placeholder="Optional"
            value={form.notes}
          />
          <Group justify="flex-end">
            <Button disabled={isPending} onClick={() => setIsOpen(false)} variant="default">
              Cancel
            </Button>
            <Button loading={isPending} onClick={saveContent}>
              Save Contents
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
