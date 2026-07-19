'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconArticle,
  IconCalendar,
  IconHome,
  IconLogout,
  IconPackage,
  IconPencil,
  IconShare2,
  type Icon,
} from '@tabler/icons-react'

import { logoutFromOs } from '@/app/os/actions'

import styles from './os-shell.module.css'

const navigation = [
  { label: 'Home', href: '/os', icon: IconHome },
  { label: 'Today', href: '/os/today', icon: IconCalendar },
  { label: 'Content', href: '/os/content', icon: IconArticle },
  { label: 'Products', href: '/os/products', icon: IconPackage },
  { label: 'Thoughts', href: '/os/thoughts', icon: IconPencil },
  { label: 'Socmeds', href: '/os/socmeds', icon: IconShare2 },
] satisfies Array<{ href: string; icon: Icon; label: string }>

export default function OsSidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label="Agung OS navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/os' && pathname.startsWith(item.href))
          const NavIcon = item.icon

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <span aria-hidden="true" className={styles.navIcon}>
                <NavIcon size={17} stroke={1.8} />
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <form action={logoutFromOs} className={styles.logoutForm}>
        <button className={styles.logoutButton} title="Logout" type="submit">
          <span aria-hidden="true" className={styles.navIcon}>
            <IconLogout size={17} stroke={1.8} />
          </span>
          <span className={styles.navLabel}>Logout</span>
        </button>
      </form>
    </aside>
  )
}
