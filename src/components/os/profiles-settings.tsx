'use client'

import { useState, useTransition } from 'react'
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandShopee,
  IconBrandThreads,
  IconBrandTiktok,
  IconBrandX,
  IconBrandYoutube,
  type Icon,
} from '@tabler/icons-react'

import { createUserSocmed, deleteUserSocmed, updateUserSocmed } from '@/app/os/(protected)/socmeds/actions'
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

export default function ProfilesSettings({ groups, socmeds, userSocmeds }: ProfilesSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [copyState, setCopyState] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState('all')
  const [form, setForm] = useState<SocmedForm>({
    ...emptyForm,
    socmedId: socmeds[0]?.id ?? '',
  })
  const isEditing = Boolean(form.id)
  const visibleSocmeds =
    selectedGroupId === 'all'
      ? userSocmeds
      : userSocmeds.filter((profile) => profile.accountGroupId === selectedGroupId)
  const groupCards = [
    {
      count: userSocmeds.length,
      id: 'all',
      meta: `${groups.length} groups`,
      name: 'All Social Media',
    },
    ...groups.map((group) => {
      const accounts = userSocmeds.filter((profile) => profile.accountGroupId === group.id)
      return {
        count: accounts.length,
        id: group.id,
        meta: `${new Set(accounts.map((profile) => profile.platform)).size} platforms`,
        name: group.name,
      }
    }),
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
      if (isEditing) {
        await updateUserSocmed(buildFormData(form))
      } else {
        await createUserSocmed(buildFormData(form))
      }

      setIsOpen(false)
    })
  }

  function deleteSocmed(profile: UserSocmed) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', profile.id)
      await deleteUserSocmed(formData)
    })
  }

  return (
    <>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Agung OS / Social Media</p>
          <h2 className={styles.pageTitle}>Social Media</h2>
          <p className={styles.pageDescription}>
            Platform accounts used to map content, publishing targets, and future embeds.
          </p>
        </div>
        <button className={styles.primaryButton} disabled={isPending} onClick={openCreateModal} type="button">
          Add Social Account
        </button>
      </section>

      <section aria-label="Account groups" className={styles.groupCardGrid}>
        {groupCards.map((group) => (
          <button
            aria-pressed={selectedGroupId === group.id}
            className={styles.groupCard}
            data-active={selectedGroupId === group.id}
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            type="button"
          >
            <span className={styles.groupCardLabel}>{group.name}</span>
            <span className={styles.groupCardCount}>{group.count}</span>
            <span className={styles.groupCardMeta}>{group.meta}</span>
          </button>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Social Accounts</h3>
            <p className={styles.muted}>Each account is linked to a master platform and an account group.</p>
          </div>
        </div>

        <ul className={styles.profileList}>
          {visibleSocmeds.map((profile) => (
            <li className={styles.profileItem} key={profile.id}>
              <div className={styles.profileBrand} data-platform={profile.platform}>
                {(() => {
                  const PlatformIcon = platformIcons[profile.platform]
                  return PlatformIcon ? <PlatformIcon size={28} stroke={1.7} /> : profile.platform.slice(0, 2)
                })()}
              </div>
              <div className={styles.profileBody}>
                <div className={styles.itemHeader}>
                  <div>
                    <p className={styles.compactTitle}>{profile.label}</p>
                    <p className={styles.muted}>
                      {profile.platform} · @{profile.account}
                      {profile.groupName ? ` · ${profile.groupName}` : ''}
                    </p>
                    <p className={styles.profileMeta}>
                      Email: {profile.linkedEmail ?? '-'} · WA: {profile.linkedWhatsapp ?? '-'}
                    </p>
                  </div>
                  <div className={styles.profileActions}>
                    <button className={styles.secondaryButton} onClick={() => copyProfileUrl(profile)} type="button">
                      {copyState === profile.id ? 'Copied' : 'Copy URL'}
                    </button>
                    <button className={styles.secondaryButton} disabled={isPending} onClick={() => openEditModal(profile)} type="button">
                      Edit
                    </button>
                    <button className={styles.dangerButton} disabled={isPending} onClick={() => deleteSocmed(profile)} type="button">
                      Delete
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

        {visibleSocmeds.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.compactTitle}>No social accounts in this group.</p>
            <p className={styles.muted}>Add an account or choose another group.</p>
          </div>
        ) : null}
      </section>

      {isOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section aria-labelledby="user-socmed-title" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Social Media</p>
                <h3 className={styles.modalTitle} id="user-socmed-title">
                  {isEditing ? 'Edit Social Account' : 'Add Social Account'}
                </h3>
              </div>
              <button
                aria-label="Close user socmed dialog"
                className={styles.iconCloseButton}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form className={styles.modalForm}>
              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="user-socmed-platform">
                  <span className={styles.label}>Platform</span>
                  <select
                    className={styles.input}
                    id="user-socmed-platform"
                    onChange={(event) => setForm((current) => ({ ...current, socmedId: event.target.value }))}
                    value={form.socmedId}
                  >
                    {socmeds.map((socmed) => (
                      <option key={socmed.id} value={socmed.id}>
                        {socmed.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field} htmlFor="user-socmed-group">
                  <span className={styles.label}>Account Group</span>
                  <select
                    className={styles.input}
                    id="user-socmed-group"
                    onChange={(event) => setForm((current) => ({ ...current, accountGroupId: event.target.value }))}
                    value={form.accountGroupId}
                  >
                    <option value="">No group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="user-socmed-account">
                  <span className={styles.label}>Account</span>
                  <input
                    className={styles.input}
                    id="user-socmed-account"
                    onChange={(event) => setForm((current) => ({ ...current, account: event.target.value }))}
                    placeholder="das.agung"
                    type="text"
                    value={form.account}
                  />
                </label>

                <label className={styles.field} htmlFor="user-socmed-label">
                  <span className={styles.label}>Label</span>
                  <input
                    className={styles.input}
                    id="user-socmed-label"
                    onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                    placeholder="Personal Brand"
                    type="text"
                    value={form.label}
                  />
                </label>
              </div>

              <label className={styles.field} htmlFor="user-socmed-url">
                <span className={styles.label}>Profile URL</span>
                <input
                  className={styles.input}
                  id="user-socmed-url"
                  onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://..."
                  type="url"
                  value={form.url}
                />
              </label>

              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="user-socmed-email">
                  <span className={styles.label}>Linked Email</span>
                  <input
                    className={styles.input}
                    id="user-socmed-email"
                    onChange={(event) => setForm((current) => ({ ...current, linkedEmail: event.target.value }))}
                    placeholder="Optional"
                    type="email"
                    value={form.linkedEmail}
                  />
                </label>

                <label className={styles.field} htmlFor="user-socmed-whatsapp">
                  <span className={styles.label}>Linked WhatsApp</span>
                  <input
                    className={styles.input}
                    id="user-socmed-whatsapp"
                    onChange={(event) => setForm((current) => ({ ...current, linkedWhatsapp: event.target.value }))}
                    placeholder="Optional"
                    type="text"
                    value={form.linkedWhatsapp}
                  />
                </label>
              </div>

              <label className={styles.field} htmlFor="user-socmed-status">
                <span className={styles.label}>Status</span>
                <select
                  className={styles.input}
                  id="user-socmed-status"
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  value={form.status}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} disabled={isPending} onClick={() => setIsOpen(false)} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={isPending} onClick={saveSocmed} type="button">
                  {isPending ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
