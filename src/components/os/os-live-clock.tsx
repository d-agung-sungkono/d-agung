'use client'

import { useEffect, useState } from 'react'

import styles from './os-shell.module.css'

const formatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'full',
  timeStyle: 'medium',
  timeZone: 'Asia/Jakarta',
})

export default function OsLiveClock() {
  const [now, setNow] = useState(() => formatter.format(new Date()))

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(formatter.format(new Date()))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <time className={styles.liveClock} suppressHydrationWarning>
      {now} WIB
    </time>
  )
}
