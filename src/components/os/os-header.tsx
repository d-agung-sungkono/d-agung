'use client'

import { IconLetterA } from '@tabler/icons-react'
import { usePathname } from 'next/navigation'

import styles from './os-shell.module.css'

const segmentLabels: Record<string, string> = {
  affiliate: 'Affiliate',
  brands: 'Brands',
  content: 'Contents',
  labs: 'Labs',
  products: 'Products',
  settings: 'Settings',
  socmeds: 'Social Media',
  thoughts: 'Thoughts',
  today: 'Today',
}

function getBreadcrumb(pathname: string) {
  const [, appSegment, ...routeSegments] = pathname.split('/')

  if (appSegment !== 'os' || routeSegments.length === 0) {
    return 'Home'
  }

  return routeSegments
    .map((segment, index) => {
      if (index > 0 && routeSegments[0] === 'brands') return 'Detail'
      return segmentLabels[segment] ?? segment.replaceAll('-', ' ')
    })
    .join(' / ')
}

export default function OsHeader() {
  const pathname = usePathname()
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header className={styles.header}>
      <div className={styles.topbarLeft}>
        <div className={styles.productMark} aria-hidden="true">
          <IconLetterA size={15} stroke={2.4} />
        </div>
        <div className={styles.workspaceName}>
          <span className={styles.headerTitle}>Agung OS</span>
          <span className={styles.headerBreadcrumb}>/ {breadcrumb}</span>
        </div>
      </div>

      <div aria-hidden="true" />
    </header>
  )
}
