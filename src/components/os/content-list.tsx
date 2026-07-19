'use client'

import { useMemo, useState } from 'react'

import styles from './os-shell.module.css'

type ContentItem = {
  id: string
  title: string
  account: string
  platform: string
  profileId: string
  url: string
  scheduledAt: string
  status: string
}

type Profile = {
  id: string
  platform: string
  account: string
  label: string
}

type ContentListProps = {
  content: ContentItem[]
  profiles: Profile[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

export default function ContentList({ content, profiles }: ContentListProps) {
  const [query, setQuery] = useState('')
  const [profileId, setProfileId] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const profilesById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])
  const platforms = useMemo(() => ['all', ...Array.from(new Set(content.map((item) => item.platform)))], [content])
  const statuses = useMemo(() => ['all', ...Array.from(new Set(content.map((item) => item.status)))], [content])

  const filteredContent = content.filter((item) => {
    const profile = profilesById.get(item.profileId)
    const normalizedQuery = query.toLowerCase()
    const matchesQuery =
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.account.toLowerCase().includes(normalizedQuery) ||
      item.platform.toLowerCase().includes(normalizedQuery) ||
      profile?.account.toLowerCase().includes(normalizedQuery)
    const matchesProfile = profileId === 'all' || item.profileId === profileId
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

  return (
    <section className={styles.panel}>
      <div className={styles.contentToolbar}>
        <input
          className={styles.productSearch}
          onChange={(event) => resetPagination(() => setQuery(event.target.value))}
          placeholder="Cari judul, akun, platform"
          type="search"
          value={query}
        />
        <select className={styles.productFilter} onChange={(event) => resetPagination(() => setProfileId(event.target.value))} value={profileId}>
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
            setProfileId('all')
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
              <p className={styles.compactTitle}>{item.title}</p>
              <a className={styles.secondaryButton} href={item.url} rel="noreferrer" target="_blank">
                Open
              </a>
            </div>
            <p className={styles.muted}>
              {profilesById.get(item.profileId)?.label ?? item.account} · {item.platform} · @
              {profilesById.get(item.profileId)?.account ?? item.account} · {formatDate(item.scheduledAt)}
            </p>
            <span className={styles.badge} data-status={item.status}>
              {item.status}
            </span>
          </li>
        ))}
      </ul>

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
    </section>
  )
}
