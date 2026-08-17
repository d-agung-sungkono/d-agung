'use client'

import { useMemo, useState, useTransition } from 'react'
import { ActionIcon, Badge, Box, Button, Card, Group, Modal, Select, SimpleGrid, Stack, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { IconEdit, IconExternalLink, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react'

import {
  createContentPost,
  createContentTarget,
  deleteContentPost,
  deleteContentTarget,
  scrapeContentPostLink,
  updateContentPost,
  updateContentTarget,
} from '@/app/os/(protected)/content/actions'

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
  notes: string | null
  latestPublishedAt: string | null
  nextDueAt: string
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
  scrapeDescription: string
  scrapeImage: string
  scrapeSiteName: string
  scrapedAt: string
  sourceUrl: string
  status: string
  title: string
  url: string
  userSocmedId: string
}

type ScheduleForm = {
  cadenceDays: string
  id: string
  name: string
  notes: string
  preferredTime: string
  startDate: string
  status: string
  userSocmedId: string
}

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Planned', value: 'planned' },
  { label: 'Ready', value: 'ready' },
  { label: 'Published', value: 'published' },
  { label: 'Skipped', value: 'skipped' },
]

const scheduleStatusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Archived', value: 'archived' },
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

function getCurrentJakartaDateTimeInput() {
  return formatInputDate(new Date().toISOString())
}

function buildFormData(form: ContentForm) {
  const formData = new FormData()
  formData.set('id', form.id)
  formData.set('notes', form.notes)
  formData.set('scheduledAt', form.scheduledAt)
  formData.set('scrapeDescription', form.scrapeDescription)
  formData.set('scrapeImage', form.scrapeImage)
  formData.set('scrapeSiteName', form.scrapeSiteName)
  formData.set('scrapedAt', form.scrapedAt)
  formData.set('sourceUrl', form.sourceUrl)
  formData.set('status', form.status)
  formData.set('title', form.title)
  formData.set('url', form.url)
  formData.set('userSocmedId', form.userSocmedId)
  return formData
}

function buildScheduleFormData(form: ScheduleForm) {
  const formData = new FormData()
  formData.set('cadenceDays', form.cadenceDays)
  formData.set('id', form.id)
  formData.set('name', form.name)
  formData.set('notes', form.notes)
  formData.set('preferredTime', form.preferredTime)
  formData.set('startDate', form.startDate)
  formData.set('status', form.status)
  formData.set('userSocmedId', form.userSocmedId)
  return formData
}

function getEmptyForm(profileId = ''): ContentForm {
  return {
    id: '',
    notes: '',
    scheduledAt: getCurrentJakartaDateTimeInput(),
    scrapeDescription: '',
    scrapeImage: '',
    scrapeSiteName: '',
    scrapedAt: '',
    sourceUrl: '',
    status: 'published',
    title: '',
    url: '',
    userSocmedId: profileId,
  }
}

function getEmptyScheduleForm(profileId = ''): ScheduleForm {
  return {
    cadenceDays: '3',
    id: '',
    name: '',
    notes: '',
    preferredTime: '19:00',
    startDate: new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
    }).format(new Date()),
    status: 'active',
    userSocmedId: profileId,
  }
}

function inferPlatformFromUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, '').toLowerCase()

    if (hostname.includes('tiktok.com')) {
      return 'TikTok'
    }

    if (hostname.includes('shopee.')) {
      return 'Shopee'
    }
  } catch {
    return null
  }

  return null
}

function buildScrapedNotes(scraped: {
  canonicalUrl: string
  description: string | null
  image: string | null
  siteName: string | null
  title: string
}) {
  return [
    scraped.description,
    scraped.siteName ? `Site: ${scraped.siteName}` : null,
    `Source: ${scraped.canonicalUrl}`,
    scraped.image ? `Image: ${scraped.image}` : null,
  ]
    .filter((item): item is string => Boolean(item))
    .join('\n')
}

export default function ContentList({ content, profiles, targets }: ContentListProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState('all')
  const [userSocmedId, setUserSocmedId] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('5')
  const [form, setForm] = useState<ContentForm>(() => getEmptyForm(profiles[0]?.id ?? ''))
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(() => getEmptyScheduleForm(profiles[0]?.id ?? ''))
  const isEditing = Boolean(form.id)
  const isEditingSchedule = Boolean(scheduleForm.id)

  const profilesById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])
  const platforms = useMemo(() => ['all', ...Array.from(new Set(content.map((item) => item.platform)))], [content])
  const statuses = useMemo(() => ['all', ...Array.from(new Set(content.map((item) => item.status)))], [content])
  const profileOptions = profiles.map((profile) => ({
    label: `${profile.platform} · @${profile.account}`,
    value: profile.id,
  }))
  const pageSizeNumber = Number(pageSize)
  const filterCards = [
    {
      count: content.length,
      id: 'all',
      meta: `${platforms.length - 1} platforms`,
      name: 'All Contents',
      type: 'all',
      value: 'all',
    },
    ...platforms
      .filter((item) => item !== 'all')
      .map((item) => ({
        count: content.filter((contentItem) => contentItem.platform === item).length,
        id: `platform:${item}`,
        meta: 'platform',
        name: item,
        type: 'platform',
        value: item,
      })),
    ...statuses
      .filter((item) => item !== 'all')
      .map((item) => ({
        count: content.filter((contentItem) => contentItem.status === item).length,
        id: `status:${item}`,
        meta: 'status',
        name: item.charAt(0).toUpperCase() + item.slice(1),
        type: 'status',
        value: item,
      })),
  ]

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

  function applyFilterCard(card: (typeof filterCards)[number]) {
    setSelectedCard(card.id)
    setPage(1)

    if (card.type === 'all') {
      setPlatform('all')
      setStatus('all')
      return
    }

    if (card.type === 'platform') {
      setPlatform(card.value)
      setStatus('all')
      return
    }

    setPlatform('all')
    setStatus(card.value)
  }

  function openCreateModal() {
    setForm(getEmptyForm(profiles[0]?.id ?? ''))
    setIsOpen(true)
  }

  function openCreateScheduleModal() {
    setScheduleForm(getEmptyScheduleForm(profiles[0]?.id ?? ''))
    setIsScheduleOpen(true)
  }

  function openEditModal(item: ContentItem) {
    setForm({
      id: item.id,
      notes: item.notes ?? '',
      scheduledAt: formatInputDate(item.scheduledAt),
      scrapeDescription: '',
      scrapeImage: '',
      scrapeSiteName: '',
      scrapedAt: '',
      sourceUrl: item.url ?? '',
      status: item.status,
      title: item.title,
      url: item.url ?? '',
      userSocmedId: item.userSocmedId ?? profiles[0]?.id ?? '',
    })
    setIsOpen(true)
  }

  function openEditScheduleModal(item: ContentTarget) {
    setScheduleForm({
      cadenceDays: String(item.cadenceDays),
      id: item.id,
      name: item.name,
      notes: item.notes ?? '',
      preferredTime: item.preferredTime ? item.preferredTime.slice(0, 5) : '',
      startDate: item.startDate,
      status: item.status,
      userSocmedId: item.userSocmedId,
    })
    setIsScheduleOpen(true)
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

  function scrapeContent() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('url', form.url)
      const scraped = await scrapeContentPostLink(formData)
      const inferredPlatform = inferPlatformFromUrl(scraped.canonicalUrl)
      const inferredProfile = inferredPlatform
        ? profiles.find((profile) => profile.platform.toLowerCase() === inferredPlatform.toLowerCase())
        : null
      const inferredTarget = inferredProfile
        ? targets.find((target) => target.status === 'active' && target.userSocmedId === inferredProfile.id)
        : null

      setForm((current) => ({
        ...current,
        notes: buildScrapedNotes(scraped),
        scheduledAt: current.scheduledAt || (inferredTarget ? formatInputDate(inferredTarget.nextDueAt) : ''),
        scrapeDescription: scraped.description ?? '',
        scrapeImage: scraped.image ?? '',
        scrapeSiteName: scraped.siteName ?? '',
        scrapedAt: new Date().toISOString(),
        sourceUrl: current.url,
        title: scraped.title,
        url: scraped.canonicalUrl,
        userSocmedId: inferredProfile?.id ?? current.userSocmedId,
      }))
    })
  }

  function saveSchedule() {
    startTransition(async () => {
      if (isEditingSchedule) {
        await updateContentTarget(buildScheduleFormData(scheduleForm))
      } else {
        await createContentTarget(buildScheduleFormData(scheduleForm))
      }

      setIsScheduleOpen(false)
    })
  }

  function removeContent(item: ContentItem) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', item.id)
      await deleteContentPost(formData)
    })
  }

  function removeSchedule(item: ContentTarget) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', item.id)
      await deleteContentTarget(formData)
    })
  }

  return (
    <Box component="section" className={styles.panel}>
      <Group justify="space-between" align="flex-start" gap="md" className={styles.panelHeader}>
        <Box className={styles.panelIntro}>
          <Text component="h3" className={styles.panelTitle}>Contents</Text>
          <Text className={styles.muted}>Manage drafts, schedules, links, and published posts from DB.</Text>
        </Box>
        <Group gap="xs" className={styles.pageActions}>
          <Button className={styles.accentAction} leftSection={<IconPlus size={18} stroke={1.8} />} loading={isPending} onClick={openCreateScheduleModal} variant="default">
            Add Schedule
          </Button>
          <Button className={styles.primaryAction} leftSection={<IconPlus size={18} stroke={1.8} />} loading={isPending} onClick={openCreateModal}>
            Add Contents
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs" className={styles.targetStrip}>
        {targets.map((target) => (
          <Card className={styles.targetPill} key={target.id} padding="sm" radius="sm" withBorder>
            <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
              <Box>
                <Text className={styles.compactTitle}>{target.name}</Text>
                <Text className={styles.muted}>
                  {target.platform} · @{target.account} · every {target.cadenceDays} days
                  {target.preferredTime ? ` · ${target.preferredTime.slice(0, 5)} WIB` : ''}
                </Text>
                <Text className={styles.profileMeta}>
                  Next due {formatDate(target.nextDueAt)}
                  {target.latestPublishedAt ? ` · last published ${formatDate(target.latestPublishedAt)}` : ''}
                </Text>
              </Box>
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Edit schedule">
                  <ActionIcon aria-label="Edit schedule" className={styles.accentIconAction} disabled={isPending} onClick={() => openEditScheduleModal(target)} variant="default">
                    <IconEdit size={17} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete schedule">
                  <ActionIcon aria-label="Delete schedule" className={styles.dangerIconAction} disabled={isPending} onClick={() => removeSchedule(target)} variant="light">
                    <IconTrash size={17} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs" className={styles.groupCardGrid}>
        {filterCards.map((card) => (
          <Card
            aria-pressed={selectedCard === card.id}
            className={styles.groupCard}
            component="button"
            data-active={selectedCard === card.id}
            key={card.id}
            onClick={() => applyFilterCard(card)}
            padding="sm"
            radius="sm"
            withBorder
          >
            <Text className={styles.groupCardLabel}>{card.name}</Text>
            <Text className={styles.groupCardCount}>{card.count}</Text>
            <Text className={styles.groupCardMeta}>{card.meta}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="xs" className={`${styles.contentToolbar} ${styles.toolbarPanel}`}>
        <TextInput
          onChange={(event) => {
            const { value } = event.currentTarget
            resetPagination(() => setQuery(value))
          }}
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
          className={styles.neutralAction}
          leftSection={<IconRefresh size={18} stroke={1.8} />}
          onClick={() => {
            setQuery('')
            setSelectedCard('all')
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
              <Group gap="xs" wrap="nowrap" className={styles.listActionGroup}>
                {item.url ? (
                  <Tooltip label="Open">
                    <ActionIcon aria-label="Open content link" className={styles.accentIconAction} component="a" href={item.url} rel="noreferrer" target="_blank" variant="default">
                      <IconExternalLink size={18} stroke={1.8} />
                    </ActionIcon>
                  </Tooltip>
                ) : null}
                <Tooltip label="Edit">
                  <ActionIcon aria-label="Edit content" className={styles.accentIconAction} disabled={isPending} onClick={() => openEditModal(item)} variant="default">
                    <IconEdit size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon aria-label="Delete content" className={styles.dangerIconAction} disabled={isPending} onClick={() => removeContent(item)} variant="light">
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
        <Button className={styles.neutralAction} disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} variant="default">
          Prev
        </Button>
        <Button className={styles.neutralAction} disabled={safePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} variant="default">
          Next
        </Button>
      </Group>

      <Modal
        classNames={{ body: styles.osModalBody, content: styles.osModalContent, header: styles.osModalHeader, title: styles.osModalTitle }}
        opened={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEditing ? 'Edit Contents' : 'Add Contents'}
        centered
      >
        <Stack gap="sm" className={styles.modalSection}>
          <TextInput
            label="Contents Link"
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({
                ...current,
                scrapeDescription: '',
                scrapeImage: '',
                scrapeSiteName: '',
                scrapedAt: '',
                sourceUrl: '',
                title: '',
                url: value,
              }))
            }}
            placeholder="https://"
            type="url"
            value={form.url}
          />
          <Group justify="flex-end">
            <Button className={styles.accentAction} disabled={!form.url || isPending} leftSection={<IconRefresh size={18} stroke={1.8} />} loading={isPending} onClick={scrapeContent} variant="default">
              Scrape
            </Button>
          </Group>
          <TextInput
            label="Title"
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({ ...current, title: value }))
            }}
            placeholder="Click Scrape to fill"
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
          <TextInput
            label="Schedule WIB"
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({ ...current, scheduledAt: value }))
            }}
            type="datetime-local"
            value={form.scheduledAt}
          />
          {form.scrapedAt ? (
            <Box>
              <Text className={styles.profileMeta}>
                Scraped from {form.scrapeSiteName || 'linked page'}
                {form.scrapeDescription ? ` · ${form.scrapeDescription}` : ''}
              </Text>
            </Box>
          ) : null}
          <Textarea
            label="Notes"
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({ ...current, notes: value }))
            }}
            placeholder="Optional"
            value={form.notes}
          />
          <Group justify="flex-end">
            <Button className={styles.neutralAction} disabled={isPending} onClick={() => setIsOpen(false)} variant="default">
              Cancel
            </Button>
            <Button className={styles.primaryAction} loading={isPending} onClick={saveContent}>
              Save Contents
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        classNames={{ body: styles.osModalBody, content: styles.osModalContent, header: styles.osModalHeader, title: styles.osModalTitle }}
        opened={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title={isEditingSchedule ? 'Edit Schedule' : 'Add Schedule'}
        centered
      >
        <Stack gap="sm" className={styles.modalSection}>
          <TextInput
            label="Schedule Name"
            onChange={(event) => {
              const { value } = event.currentTarget
              setScheduleForm((current) => ({ ...current, name: value }))
            }}
            placeholder="Agung Branding Contents"
            value={scheduleForm.name}
          />
          <Select
            data={profileOptions}
            label="Account"
            onChange={(value) => setScheduleForm((current) => ({ ...current, userSocmedId: value ?? '' }))}
            value={scheduleForm.userSocmedId}
          />
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <TextInput
              label="Every"
              min={1}
              onChange={(event) => {
                const { value } = event.currentTarget
                setScheduleForm((current) => ({ ...current, cadenceDays: value }))
              }}
              type="number"
              value={scheduleForm.cadenceDays}
            />
            <TextInput
              label="Start Date"
              onChange={(event) => {
                const { value } = event.currentTarget
                setScheduleForm((current) => ({ ...current, startDate: value }))
              }}
              type="date"
              value={scheduleForm.startDate}
            />
            <TextInput
              label="Time WIB"
              onChange={(event) => {
                const { value } = event.currentTarget
                setScheduleForm((current) => ({ ...current, preferredTime: value }))
              }}
              type="time"
              value={scheduleForm.preferredTime}
            />
          </SimpleGrid>
          <Select
            data={scheduleStatusOptions}
            label="Status"
            onChange={(value) => setScheduleForm((current) => ({ ...current, status: value ?? 'active' }))}
            value={scheduleForm.status}
          />
          <Textarea
            label="Notes"
            onChange={(event) => {
              const { value } = event.currentTarget
              setScheduleForm((current) => ({ ...current, notes: value }))
            }}
            placeholder="Optional"
            value={scheduleForm.notes}
          />
          <Group justify="flex-end">
            <Button className={styles.neutralAction} disabled={isPending} onClick={() => setIsScheduleOpen(false)} variant="default">
              Cancel
            </Button>
            <Button className={styles.primaryAction} loading={isPending} onClick={saveSchedule}>
              Save Schedule
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
