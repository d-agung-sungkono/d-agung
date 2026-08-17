'use client'

import { useLinkStatus } from 'next/link'

import styles from './os-shell.module.css'

export default function OsNavPending() {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden="true"
      className={`${styles.navPendingDot} ${pending ? styles.navPendingDotVisible : ''}`}
    />
  )
}
