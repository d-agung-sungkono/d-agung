'use client'

import { useMemo, useState } from 'react'

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
  const [pageSize, setPageSize] = useState(5)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<ThoughtForm>(emptyForm)

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.category)))], [items])
  const statuses = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.status)))], [items])

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

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginatedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize)

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
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Agung OS / Thoughts</p>
          <h2 className={styles.pageTitle}>Thoughts</h2>
          <p className={styles.pageDescription}>
            A capture inbox for product ideas, operating notes, and content angles before they become tasks.
          </p>
        </div>
        <button className={styles.primaryButton} onClick={openCreateModal} type="button">
          Capture Thought
        </button>
      </section>

      <section className={styles.panel}>
        <div className={styles.contentToolbar}>
          <input
            className={styles.productSearch}
            onChange={(event) => resetPagination(() => setQuery(event.target.value))}
            placeholder="Cari thought, kategori, catatan"
            type="search"
            value={query}
          />
          <select className={styles.productFilter} onChange={(event) => resetPagination(() => setCategory(event.target.value))} value={category}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Kategori' : item}
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
              setCategory('all')
              setStatus('all')
              setPage(1)
            }}
            type="button"
          >
            Atur ulang
          </button>
        </div>

        <ul className={styles.thoughtList}>
          {paginatedItems.map((thought) => (
            <li className={styles.thoughtItem} key={thought.id}>
              <div className={styles.thoughtMain}>
                <div>
                  <p className={styles.compactTitle}>{thought.title}</p>
                  {thought.body ? <p className={styles.thoughtBody}>{thought.body}</p> : null}
                  <p className={styles.muted}>
                    {thought.category} · {formatDate(thought.createdAt)}
                  </p>
                </div>
                <span className={styles.badge} data-status={thought.status}>
                  {thought.status}
                </span>
              </div>

              <div className={styles.thoughtActions}>
                <button className={styles.secondaryButton} onClick={() => openEditModal(thought)} type="button">
                  Edit
                </button>
                <button className={styles.secondaryButton} onClick={() => toggleArchive(thought)} type="button">
                  {thought.status === 'archived' ? 'Reopen' : 'Archive'}
                </button>
                <button className={styles.dangerButton} onClick={() => deleteThought(thought.id)} type="button">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.pagination}>
          <span>
            Page {safePage} of {pageCount} · {filteredItems.length} thoughts
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
      </section>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section aria-labelledby="thought-modal-title" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Thoughts</p>
                <h3 className={styles.modalTitle} id="thought-modal-title">
                  {editingId ? 'Edit Thought' : 'Capture Thought'}
                </h3>
              </div>
              <button
                aria-label="Close thought dialog"
                className={styles.iconCloseButton}
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form className={styles.modalForm}>
              <label className={styles.field} htmlFor="thought-title">
                <span className={styles.label}>Title</span>
                <input
                  className={styles.input}
                  id="thought-title"
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Short thought title"
                  type="text"
                  value={form.title}
                />
              </label>

              <label className={styles.field} htmlFor="thought-body">
                <span className={styles.label}>Note</span>
                <textarea
                  className={styles.textarea}
                  id="thought-body"
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  placeholder="Capture the context, why it matters, or what to do next."
                  rows={5}
                  value={form.body}
                />
              </label>

              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="thought-category">
                  <span className={styles.label}>Category</span>
                  <input
                    className={styles.input}
                    id="thought-category"
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Product"
                    type="text"
                    value={form.category}
                  />
                </label>

                <label className={styles.field} htmlFor="thought-status">
                  <span className={styles.label}>Status</span>
                  <select
                    className={styles.input}
                    id="thought-status"
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    value={form.status}
                  >
                    <option value="open">Open</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} onClick={saveThought} type="button">
                  Save Thought
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
