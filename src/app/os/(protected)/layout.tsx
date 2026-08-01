import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import OsHeader from '@/components/os/os-header'
import OsSidebar from '@/components/os/os-sidebar'
import styles from '@/components/os/os-shell.module.css'
import { getOsSession } from '@/lib/os-auth'

export const metadata: Metadata = {
  title: 'Agung OS',
}

type OsLayoutProps = {
  children: ReactNode
}

export default async function OsLayout({ children }: OsLayoutProps) {
  const session = await getOsSession()

  if (!session) {
    redirect('/os/login')
  }

  return (
    <div className={styles.shell}>
      <OsHeader />
      <OsSidebar />
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  )
}
