'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { logoutFromOs } from '@/app/os/actions'

import styles from './os-shell.module.css'

const navigation = [
  { label: 'Home', href: '/os', icon: '⌂' },
  { label: 'Today', href: '/os/today', icon: '◷' },
  { label: 'Content', href: '/os/content', icon: '▤' },
  { label: 'Products', href: '/os/products', icon: '□' },
  { label: 'Thoughts', href: '/os/thoughts', icon: '✎' },
  { label: 'Settings', href: '/os/settings', icon: '⚙' },
]

export default function OsSidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label="Agung OS navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/os' && pathname.startsWith(item.href))

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <span aria-hidden="true" className={styles.navIcon}>
                {item.icon}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <form action={logoutFromOs} className={styles.logoutForm}>
        <button className={styles.logoutButton} title="Logout" type="submit">
          <span aria-hidden="true" className={styles.navIcon}>
            ↵
          </span>
          <span className={styles.navLabel}>Logout</span>
        </button>
      </form>
    </aside>
  )
}
