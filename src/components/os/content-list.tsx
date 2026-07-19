'use client'

import { useMemo, useState, useTransition } from 'react'
import { IconEdit, IconExternalLink, IconPlus, IconTrash } from '@tabler/icons-react'

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
  const [pageSize, setPageSize] = useState(5)
  const [form, setForm] = useState<ContentForm>(() => getEmptyForm(profiles[0]?.id ?? ''))
  const isEditing = Boolean(form.id)

  const profilesById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])
  const platforms = useMemo(() => ['all', ...Array.from(new Set(content.map((item) => item.platform)))], [content])
  const statuses = useMemo(() => ['all', ...Array.from(new Set(content.map((item) => item.status)))], [content])

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

  const pageCount = Math.max(1, Math.ceil(filteredContent.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginatedContent = filteredContent.slice((safePage - 1) * pageSize, safePage * pageSize)

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
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Content Posts</h3>
          <p className={styles.muted}>Manage drafts, schedules, links, and published posts from DB.</p>
        </div>
        <button className={styles.primaryButton} disabled={isPending} onClick={openCreateModal} type="button">
          <IconPlus size={18} stroke={1.8} />
          Add Content
        </button>
      </div>

      <div className={styles.targetStrip}>
        {targets.map((target) => (
          <div className={styles.targetPill} key={target.id}>
            <p className={styles.compactTitle}>{target.name}</p>
            <p className={styles.muted}>
              {target.platform} · @{target.account} · every {target.cadenceDays} days
            </p>
          </div>
        ))}
      </div>

      <div className={styles.contentToolbar}>
        <input
          className={styles.productSearch}
          onChange={(event) => resetPagination(() => setQuery(event.target.value))}
          placeholder="Cari judul, akun, platform"
          type="search"
          value={query}
        />
        <select
          className={styles.productFilter}
          onChange={(event) => resetPagination(() => setUserSocmedId(event.target.value))}
          value={userSocmedId}
        >
          <option value="all">Akun</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.platform} · @{profile.account}
            </option>
          ))}
        </select>
        <select className={styles.productFilter} onChange={(event) => resetPagination(() => setPlatform(event.target.value))} value={platform}>
          {platforms.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Platform' : item}
            </option>
          ))}
        </select>
        <select className={styles.productFilter} onChange={(event) => resetPagination(() => setStatus(event.target.value))} value={status}>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Status' : item}
            </option>
          ))}
        </select>
        <button
          className={styles.secondaryButton}
          onClick={() => {
            setQuery('')
            setUserSocmedId('all')
            setPlatform('all')
            setStatus('all')
            setPage(1)
          }}
          type="button"
        >
          Atur ulang
        </button>
      </div>

      <ul className={styles.compactList}>
        {paginatedContent.map((item) => (
          <li className={styles.compactItem} key={item.id}>
            <div className={styles.itemHeader}>
              <div>
                <p className={styles.compactTitle}>{item.title}</p>
                <p className={styles.muted}>
                  {item.label} · {item.platform} · @{item.account}
                  {item.groupName ? ` · ${item.groupName}` : ''} · {formatDate(item.scheduledAt)}
                </p>
              </div>
              <div className={styles.profileActions}>
                {item.url ? (
                  <a
                    aria-label="Open content link"
                    className={styles.iconActionButton}
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <IconExternalLink size={18} stroke={1.8} />
                    <span className={styles.tooltipText}>Open</span>
                  </a>
                ) : null}
                <button
                  aria-label="Edit content"
                  className={styles.iconActionButton}
                  disabled={isPending}
                  onClick={() => openEditModal(item)}
                  type="button"
                >
                  <IconEdit size={18} stroke={1.8} />
                  <span className={styles.tooltipText}>Edit</span>
                </button>
                <button
                  aria-label="Delete content"
                  className={`${styles.iconActionButton} ${styles.iconDangerButton}`}
                  disabled={isPending}
                  onClick={() => removeContent(item)}
                  type="button"
                >
                  <IconTrash size={18} stroke={1.8} />
                  <span className={styles.tooltipText}>Delete</span>
                </button>
              </div>
            </div>
            <div className={styles.contentMetaRow}>
              <span className={styles.badge} data-status={item.status}>
                {item.status}
              </span>
              {item.notes ? <span className={styles.profileMeta}>{item.notes}</span> : null}
            </div>
          </li>
        ))}
      </ul>

      {paginatedContent.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.compactTitle}>No content found.</p>
          <p className={styles.muted}>Adjust filters or add a new content item.</p>
        </div>
      ) : null}

      <div className={styles.pagination}>
        <span>
          Page {safePage} of {pageCount} · {filteredContent.length} content
        </span>
        <select
          className={styles.pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value))
            setPage(1)
          }}
          value={pageSize}
        >
          {[5, 10, 20].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <button className={styles.secondaryButton} disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
          Prev
        </button>
        <button className={styles.secondaryButton} disabled={safePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} type="button">
          Next
        </button>
      </div>

      {isOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section aria-labelledby="content-post-title" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Content</p>
                <h3 className={styles.modalTitle} id="content-post-title">
                  {isEditing ? 'Edit Content' : 'Add Content'}
                </h3>
              </div>
              <button
                aria-label="Close content dialog"
                className={styles.iconCloseButton}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form className={styles.modalForm}>
              <label className={styles.field} htmlFor="content-title">
                <span className={styles.label}>Title</span>
                <input
                  className={styles.input}
                  id="content-title"
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Content title"
                  type="text"
                  value={form.title}
                />
              </label>

              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="content-account">
                  <span className={styles.label}>Account</span>
                  <select
                    className={styles.input}
                    id="content-account"
                    onChange={(event) => setForm((current) => ({ ...current, userSocmedId: event.target.value }))}
                    value={form.userSocmedId}
                  >
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.platform} · @{profile.account}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field} htmlFor="content-status">
                  <span className={styles.label}>Status</span>
                  <select
                    className={styles.input}
                    id="content-status"
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    value={form.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="planned">Planned</option>
                    <option value="ready">Ready</option>
                    <option value="published">Published</option>
                    <option value="skipped">Skipped</option>
                  </select>
                </label>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="content-url">
                  <span className={styles.label}>Content Link</span>
                  <input
                    className={styles.input}
                    id="content-url"
                    onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                    placeholder="https://"
                    type="url"
                    value={form.url}
                  />
                </label>

                <label className={styles.field} htmlFor="content-schedule">
                  <span className={styles.label}>Schedule WIB</span>
                  <input
                    className={styles.input}
                    id="content-schedule"
                    onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                    type="datetime-local"
                    value={form.scheduledAt}
                  />
                </label>
              </div>

              <label className={styles.field} htmlFor="content-notes">
                <span className={styles.label}>Notes</span>
                <textarea
                  className={styles.textarea}
                  id="content-notes"
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional"
                  value={form.notes}
                />
              </label>

              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} disabled={isPending} onClick={() => setIsOpen(false)} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={isPending} onClick={saveContent} type="button">
                  {isPending ? 'Saving...' : 'Save Content'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  )
}
