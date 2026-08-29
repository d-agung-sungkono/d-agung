'use client'

import { useMemo, useState } from 'react'
import { ActionIcon, Badge, Box, Button, Card, Group, Modal, Select, SimpleGrid, Stack, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { IconArchive, IconEdit, IconFlask, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react'

import styles from './os-shell.module.css'

type Lab = {
  body?: string
  category: string
  createdAt: string
  id: string
  priority: string
  status: string
  title: string
}

type LabsManagerProps = {
  labs: Lab[]
}

type LabForm = {
  body: string
  category: string
  priority: string
  status: string
  title: string
}

const emptyForm: LabForm = {
  body: '',
  category: 'General',
  priority: 'medium',
  status: 'open',
  title: '',
}

const priorities = ['low', 'medium', 'high']
const statuses = ['idea', 'open', 'paused', 'done', 'archived']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

function getCharacterCount(value: string) {
  return `${value.length} characters`
}

export default function LabsManager({ labs }: LabsManagerProps) {
  const [items, setItems] = useState(labs)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<LabForm>(emptyForm)

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.category)))], [items])
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

  function openCreateModal() {
    setEditingId(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  function openEditModal(lab: Lab) {
    setEditingId(lab.id)
    setForm({
      body: lab.body ?? '',
      category: lab.category,
      priority: lab.priority,
      status: lab.status,
      title: lab.title,
    })
    setIsModalOpen(true)
  }

  function saveLab() {
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
                priority: form.priority,
                status: form.status,
                title: form.title,
              }
            : item
        )
      )
    } else {
      setItems((currentItems) => [
        {
          id: `lab-${Date.now()}`,
          body: form.body,
          category: form.category,
          createdAt: new Date().toISOString(),
          priority: form.priority,
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

  function toggleArchive(lab: Lab) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === lab.id ? { ...item, status: item.status === 'archived' ? 'open' : 'archived' } : item
      )
    )
  }

  function deleteLab(labId: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== labId))
  }

  return (
    <>
      <Box component="section" className={styles.pageHeader}>
        <Box>
          <Text component="h2" className={styles.pageTitle}>Labs</Text>
          <Text className={styles.pageDescription}>
            Small experiments, fixes, and lightweight things to work on without turning them into full projects.
          </Text>
        </Box>
        <Group className={styles.pageActions}>
          <Button className={styles.primaryAction} leftSection={<IconPlus size={18} stroke={1.8} />} onClick={openCreateModal}>
            Add Lab
          </Button>
        </Group>
      </Box>

      <Box component="section" className={styles.panel}>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs" className={`${styles.contentToolbar} ${styles.toolbarPanel}`}>
          <TextInput
            onChange={(event) => {
              const { value } = event.currentTarget
              setQuery(value)
            }}
            placeholder="Search lab, category, note"
            type="search"
            value={query}
          />
          <Select
            data={categories.map((item) => ({ label: item === 'all' ? 'Category' : item, value: item }))}
            onChange={(value) => setCategory(value ?? 'all')}
            value={category}
          />
          <Select
            data={statuses.map((item) => ({ label: item === 'all' ? 'Status' : item, value: item }))}
            onChange={(value) => setStatus(value ?? 'all')}
            value={status}
          />
          <Button
            className={styles.neutralAction}
            leftSection={<IconRefresh size={18} stroke={1.8} />}
            onClick={() => {
              setQuery('')
              setCategory('all')
              setStatus('all')
            }}
            variant="default"
          >
            Reset
          </Button>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
          {filteredItems.map((lab) => (
            <Card className={styles.labItem} key={lab.id} padding="sm" radius="sm" withBorder>
              <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                <Box className={styles.labIcon} aria-hidden="true">
                  <IconFlask size={20} stroke={1.8} />
                </Box>
                <Box className={styles.labBody}>
                  <Group gap="xs" wrap="wrap">
                    <Text className={styles.compactTitle}>{lab.title}</Text>
                    <Badge className={styles.badge} data-status={lab.status} variant="light">
                      {lab.status}
                    </Badge>
                  </Group>
                  {lab.body ? <Text className={styles.thoughtBody}>{lab.body}</Text> : null}
                  <Text className={styles.muted}>
                    {lab.category} · {lab.priority} priority · {formatDate(lab.createdAt)}
                  </Text>
                </Box>
              </Group>

              <Group gap="xs" className={styles.listActionGroup}>
                <Tooltip label="Edit">
                  <ActionIcon aria-label="Edit lab" className={styles.editIconAction} onClick={() => openEditModal(lab)} variant="default">
                    <IconEdit size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={lab.status === 'archived' ? 'Restore' : 'Archive'}>
                  <ActionIcon aria-label={lab.status === 'archived' ? 'Restore lab' : 'Archive lab'} className={styles.neutralIconAction} onClick={() => toggleArchive(lab)} variant="default">
                    <IconArchive size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon aria-label="Delete lab" className={styles.dangerIconAction} onClick={() => deleteLab(lab.id)} variant="default">
                    <IconTrash size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        {filteredItems.length === 0 ? (
          <Card className={styles.emptyState} padding="md" radius="sm" withBorder>
            <Text className={styles.compactTitle}>No labs in this view.</Text>
            <Text className={styles.muted}>Adjust the filters or add a small thing to work on.</Text>
          </Card>
        ) : null}
      </Box>

      <Modal
        centered
        classNames={{ body: styles.osModalBody, content: styles.osModalContent, header: styles.osModalHeader, title: styles.osModalTitle }}
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Lab' : 'Add Lab'}
      >
        <Stack gap="sm">
          <TextInput
            description={getCharacterCount(form.title)}
            label="Title"
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({ ...current, title: value }))
            }}
            required
            value={form.title}
          />
          <Textarea
            autosize
            description={getCharacterCount(form.body)}
            label="Notes"
            minRows={4}
            onChange={(event) => {
              const { value } = event.currentTarget
              setForm((current) => ({ ...current, body: value }))
            }}
            value={form.body}
          />
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <TextInput
              description={getCharacterCount(form.category)}
              label="Category"
              onChange={(event) => {
                const { value } = event.currentTarget
                setForm((current) => ({ ...current, category: value }))
              }}
              value={form.category}
            />
            <Select
              allowDeselect={false}
              data={priorities.map((item) => ({ label: item, value: item }))}
              label="Priority"
              onChange={(value) => setForm((current) => ({ ...current, priority: value ?? 'medium' }))}
              value={form.priority}
            />
            <Select
              allowDeselect={false}
              data={statuses.map((item) => ({ label: item, value: item }))}
              label="Status"
              onChange={(value) => setForm((current) => ({ ...current, status: value ?? 'open' }))}
              value={form.status}
            />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button className={styles.neutralAction} onClick={() => setIsModalOpen(false)} variant="default">
              Cancel
            </Button>
            <Button className={styles.primaryAction} disabled={!form.title.trim()} onClick={saveLab}>
              Save Lab
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
