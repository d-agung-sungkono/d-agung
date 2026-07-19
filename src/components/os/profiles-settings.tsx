'use client'

import { useState } from 'react'

import styles from './os-shell.module.css'

type Profile = {
  id: string
  platform: string
  account: string
  label: string
  url: string
  status: string
}

type ProfilesSettingsProps = {
  profiles: Profile[]
}

const platformMarks: Record<string, string> = {
  Facebook: 'f',
  Instagram: '◎',
  LinkedIn: 'in',
  Shopee: 'S',
  Threads: '@',
  TikTok: '♪',
  X: 'X',
  YouTube: '▶',
}

function getProfileId(platform: string, account: string) {
  return `profile-${platform.toLowerCase().replace(/\s+/g, '-')}-${account.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export default function ProfilesSettings({ profiles }: ProfilesSettingsProps) {
  const [items, setItems] = useState(profiles)
  const [isOpen, setIsOpen] = useState(false)
  const [copyState, setCopyState] = useState<string | null>(null)
  const [form, setForm] = useState({
    account: '',
    label: '',
    platform: 'TikTok',
    url: '',
  })

  async function copyProfileUrl(profile: Profile) {
    await navigator.clipboard.writeText(profile.url)
    setCopyState(profile.id)
    window.setTimeout(() => setCopyState(null), 1400)
  }

  function addProfile() {
    if (!form.account || !form.platform || !form.url) {
      return
    }

    const nextProfile = {
      id: getProfileId(form.platform, form.account),
      platform: form.platform,
      account: form.account,
      label: form.label || form.account,
      url: form.url,
      status: 'active',
    }

    setItems((currentItems) => [nextProfile, ...currentItems])
    setForm({ account: '', label: '', platform: 'TikTok', url: '' })
    setIsOpen(false)
  }

  return (
    <>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Agung OS / Settings</p>
          <h2 className={styles.pageTitle}>Settings</h2>
          <p className={styles.pageDescription}>
            Platform accounts used to map content, publishing targets, and future embeds.
          </p>
        </div>
        <button className={styles.primaryButton} onClick={() => setIsOpen(true)} type="button">
          Add Profile
        </button>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Profile Mapping</h3>
            <p className={styles.muted}>Each content item can point to one of these accounts.</p>
          </div>
        </div>

        <ul className={styles.profileList}>
          {items.map((profile) => (
            <li className={styles.profileItem} key={profile.id}>
              <div className={styles.profileMark} data-platform={profile.platform}>
                {platformMarks[profile.platform] ?? profile.platform.slice(0, 2)}
              </div>
              <div className={styles.profileBody}>
                <div className={styles.itemHeader}>
                  <div>
                    <p className={styles.compactTitle}>{profile.label}</p>
                    <p className={styles.muted}>
                      {profile.platform} · @{profile.account}
                    </p>
                  </div>
                  <div className={styles.profileActions}>
                    <button className={styles.secondaryButton} onClick={() => copyProfileUrl(profile)} type="button">
                      {copyState === profile.id ? 'Copied' : 'Copy URL'}
                    </button>
                    <a className={styles.secondaryButton} href={profile.url} rel="noreferrer" target="_blank">
                      Open
                    </a>
                  </div>
                </div>
              </div>
              <span className={styles.badge} data-status={profile.status}>
                {profile.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {isOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section aria-labelledby="add-profile-title" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Settings</p>
                <h3 className={styles.modalTitle} id="add-profile-title">
                  Add Profile
                </h3>
              </div>
              <button
                aria-label="Close add profile dialog"
                className={styles.iconCloseButton}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form className={styles.modalForm}>
              <label className={styles.field} htmlFor="profile-platform">
                <span className={styles.label}>Platform</span>
                <select
                  className={styles.input}
                  id="profile-platform"
                  onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))}
                  value={form.platform}
                >
                  {['TikTok', 'Instagram', 'Threads', 'Facebook', 'YouTube', 'X', 'LinkedIn', 'Shopee'].map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field} htmlFor="profile-account">
                <span className={styles.label}>Account</span>
                <input
                  className={styles.input}
                  id="profile-account"
                  onChange={(event) => setForm((current) => ({ ...current, account: event.target.value }))}
                  placeholder="das.agung"
                  type="text"
                  value={form.account}
                />
              </label>

              <label className={styles.field} htmlFor="profile-label">
                <span className={styles.label}>Label</span>
                <input
                  className={styles.input}
                  id="profile-label"
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Personal Brand"
                  type="text"
                  value={form.label}
                />
              </label>

              <label className={styles.field} htmlFor="profile-url">
                <span className={styles.label}>Profile URL</span>
                <input
                  className={styles.input}
                  id="profile-url"
                  onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://..."
                  type="url"
                  value={form.url}
                />
              </label>

              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={() => setIsOpen(false)} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} onClick={addProfile} type="button">
                  Add Profile
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
