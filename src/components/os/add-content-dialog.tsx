'use client'

import { useState } from 'react'

import styles from './os-shell.module.css'

type Profile = {
  id: string
  platform: string
  account: string
  label: string
}

type AddContentDialogProps = {
  profiles: Profile[]
}

export default function AddContentDialog({ profiles }: AddContentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button className={styles.primaryButton} onClick={() => setIsOpen(true)} type="button">
        Add Content
      </button>

      {isOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section aria-labelledby="add-content-title" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Content</p>
                <h3 className={styles.modalTitle} id="add-content-title">
                  Add Content
                </h3>
              </div>
              <button
                aria-label="Close add content dialog"
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
                <input className={styles.input} id="content-title" placeholder="Content title" type="text" />
              </label>

              <label className={styles.field} htmlFor="content-profile">
                <span className={styles.label}>Account</span>
                <select className={styles.input} id="content-profile">
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.platform} · @{profile.account}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field} htmlFor="content-url">
                <span className={styles.label}>Content link</span>
                <input className={styles.input} id="content-url" placeholder="https://" type="url" />
              </label>

              <label className={styles.field} htmlFor="content-schedule">
                <span className={styles.label}>Schedule</span>
                <input className={styles.input} id="content-schedule" type="datetime-local" />
              </label>

              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={() => setIsOpen(false)} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} onClick={() => setIsOpen(false)} type="button">
                  Save Draft
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
