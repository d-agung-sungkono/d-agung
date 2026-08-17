'use client'

import { useMemo, useState } from 'react'
import { ActionIcon, Badge, Box, Button, Card, Group, Modal, Select, SimpleGrid, Stack, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { IconArchive, IconEdit, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react'

import styles from './os-shell.module.css'

type Thought = {
  id: string
  title: string
  body?: string
  category: string
  status: string
  createdAt: string
}

type ThoughtsManagerProps = {
  thoughts: Thought[]
}

type ThoughtForm = {
  body: string
  category: string
  status: string
  title: string
}

const emptyForm: ThoughtForm = {
  body: '',
  category: 'General',
  status: 'open',
  title: '',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

export default function ThoughtsManager({ thoughts }: ThoughtsManagerProps) {
  const [items, setItems] = useState(thoughts)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('5')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<ThoughtForm>(emptyForm)

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.category)))], [items])
  const statuses = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.status)))], [items])
  const pageSizeNumber = Number(pageSize)

  const filteredItems = items.filter((item) => {
    const normalizedQuery = query.toLowerCase()
    const matchesQuery =
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.body?.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
    const matchesCategory = category === 'all' || item.category === category
    const matchesStatus = status === 'all' || item.status === status

    return matchesQuery && matchesCategory && matchesStatus
  })

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSizeNumber))
  const safePage = Math.min(page, pageCount)
  const paginatedItems = filteredItems.slice((safePage - 1) * pageSizeNumber, safePage * pageSizeNumber)

  function resetPagination(update: () => void) {
    update()
    setPage(1)
  }

  function openCreateModal() {
    setEditingId(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  function openEditModal(thought: Thought) {
    setEditingId(thought.id)
    setForm({
      body: thought.body ?? '',
      category: thought.category,
      status: thought.status,
      title: thought.title,
    })
    setIsModalOpen(true)
  }

  function saveThought() {
    if (!form.title.trim()) {
      return
    }

    if (editingId) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingId
            ? {
                ...item,
                body: form.body,
                category: form.category,
                status: form.status,
                title: form.title,
              }
            : item
        )
      )
    } else {
      setItems((currentItems) => [
        {
          id: `thought-${Date.now()}`,
          body: form.body,
          category: form.category,
          createdAt: new Date().toISOString(),
          status: form.status,
          title: form.title,
        },
        ...currentItems,
      ])
    }

    setIsModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function toggleArchive(thought: Thought) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === thought.id ? { ...item, status: item.status === 'archived' ? 'open' : 'archived' } : item
      )
    )
  }

  function deleteThought(thoughtId: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== thoughtId))
  }

  return (
    <>
      <Box component="section" className={styles.pageHeader}>
        <Box>
          <Text className={styles.breadcrumb}>Agung OS / Thoughts</Text>
          <Text component="h2" className={styles.pageTitle}>Thoughts</Text>
          <Text className={styles.pageDescription}>
            A capture inbox for product ideas, operating notes, and content angles before they become tasks.
          </Text>
        </Box>
        <Group className={styles.pageActions}>
          <Button className={styles.primaryAction} leftSection={<IconPlus size={18} stroke={1.8} />} onClick={openCreateModal}>
            Capture Thought
          </Button>
        </Group>
      </Box>

      <Box component="section" className={styles.panel}>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs" className={`${styles.contentToolbar} ${styles.toolbarPanel}`}>
          <TextInput
            onChange={(event) => {
              const { value } = event.currentTarget
              resetPagination(() => setQuery(value))
            }}
            placeholder="Cari thought, kategori, catatan"
            type="search"
            value={query}
          />
          <Select
            data={categories.map((item) => ({ label: item === 'all' ? 'Kategori' : item, value: item }))}
            onChange={(value) => resetPagination(() => setCategory(value ?? 'all'))}
            value={category}
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
              setCategory('all')
              setStatus('all')
              setPage(1)
            }}
            variant="default"
          >
            Atur ulang
          </Button>
        </SimpleGrid>

        <Stack gap="xs">
          {paginatedItems.map((thought) => (
            <Card className={styles.thoughtItem} key={thought.id} padding="sm" radius="sm" withBorder>
              <Group justify="space-between" align="flex-start" gap="sm">
                <Box>
                  <Text className={styles.compactTitle}>{thought.title}</Text>
                  {thought.body ? <Text className={styles.thoughtBody}>{thought.body}</Text> : null}
                  <Text className={styles.muted}>
                    {thought.category} · {formatDate(thought.createdAt)}
                  </Text>
                </Box>
                <Badge className={styles.badge} data-status={thought.status} variant="light">
                  {thought.status}
                </Badge>
              </Group>

              <Group gap="xs" className={styles.listActionGroup}>
                <Tooltip label="Edit">
                  <ActionIcon aria-label="Edit thought" className={styles.accentIconAction} onClick={() => openEditModal(thought)} variant="default">
                    <IconEdit size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={thought.status === 'archived' ? 'Reopen' : 'Archive'}>
                  <ActionIcon aria-label={thought.status === 'archived' ? 'Reopen thought' : 'Archive thought'} className={styles.neutralIconAction} onClick={() => toggleArchive(thought)} variant="default">
                    <IconArchive size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon aria-label="Delete thought" className={styles.dangerIconAction} onClick={() => deleteThought(thought.id)} variant="light">
                    <IconTrash size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Card>
          ))}
        </Stack>

        <Group justify="flex-end" gap="xs" className={styles.pagination}>
          <Text>
            Page {safePage} of {pageCount} · {filteredItems.length} thoughts
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
      </Box>

      <Modal
        classNames={{ body: styles.osModalBody, content: styles.osModalContent, header: styles.osModalHeader, title: styles.osModalTitle }}
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Thought' : 'Capture Thought'}
        centered
      >
        <Stack gap="sm" className={styles.modalSection}>
          <TextInput
            label="Title"
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({ ...current, title: value }))
            }}
            placeholder="Short thought title"
            value={form.title}
          />
          <Textarea
            label="Note"
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({ ...current, body: value }))
            }}
            placeholder="Capture the context, why it matters, or what to do next."
            rows={5}
            value={form.body}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Category"
              onChange={(event) => {
                const { value } = event.currentTarget
                setForm((current) => ({ ...current, category: value }))
              }}
              placeholder="Product"
              value={form.category}
            />
            <Select
              data={[
                { label: 'Open', value: 'open' },
                { label: 'Archived', value: 'archived' },
              ]}
              label="Status"
              onChange={(value) => setForm((current) => ({ ...current, status: value ?? 'open' }))}
              value={form.status}
            />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button className={styles.neutralAction} onClick={() => setIsModalOpen(false)} variant="default">
              Cancel
            </Button>
            <Button className={styles.primaryAction} onClick={saveThought}>Save Thought</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
