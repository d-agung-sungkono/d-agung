'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ActionIcon, Tooltip } from '@mantine/core'
import {
  IconArticle,
  IconBrain,
  IconCalendar,
  IconHome,
  IconLogout,
  IconPackage,
  IconShare2,
  type Icon,
} from '@tabler/icons-react'

import { logoutFromOs } from '@/app/os/actions'

import OsNavPending from './os-nav-pending'
import styles from './os-shell.module.css'

const navigation = [
  { label: 'Home', href: '/os', icon: IconHome },
  { label: 'Today', href: '/os/today', icon: IconCalendar },
  { label: 'Contents', href: '/os/content', icon: IconArticle },
  { label: 'Products', href: '/os/products', icon: IconPackage },
  { label: 'Thoughts', href: '/os/thoughts', icon: IconBrain },
  { label: 'Social Medias', href: '/os/socmeds', icon: IconShare2 },
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
              <OsNavPending />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <form action={logoutFromOs} className={styles.logoutForm}>
        <Tooltip label="Logout" position="right">
          <ActionIcon aria-label="Logout" className={styles.logoutButton} title="Logout" type="submit" variant="subtle">
            <IconLogout size={17} stroke={1.8} />
          </ActionIcon>
        </Tooltip>
      </form>
    </aside>
  )
}
