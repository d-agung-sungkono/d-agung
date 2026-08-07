import Link from 'next/link'
import { IconPlus } from '@tabler/icons-react'
import { connection } from 'next/server'

import DbUnavailable from '@/components/os/db-unavailable'
import OsLiveClock from '@/components/os/os-live-clock'
import styles from '@/components/os/os-shell.module.css'
import SummaryCard from '@/components/os/summary-card'
import thoughts from '@/data/os/thoughts.json'
import { getContentData } from '@/lib/os-content'
import { getProductsData } from '@/lib/os-products'

function getGreeting() {
  const hour = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
  const currentHour = Number(hour)

  if (currentHour < 12) {
    return 'Good morning'
  }

  if (currentHour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

function getJakartaDateKey(value: string | Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  }).format(value instanceof Date ? value : new Date(value))
}

async function getHomeContentState() {
  try {
    const [{ posts, targets }, productsData] = await Promise.all([getContentData(), getProductsData()])
    const today = getJakartaDateKey()
    const targetsDueToday = targets
      .filter((target) => target.status === 'active' && getJakartaDateKey(target.nextDueAt) <= today)
      .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt) || a.name.localeCompare(b.name))

    return { dbError: false, posts, products: productsData.products, targetsDueToday }
  } catch (error) {
    console.error('Failed to load Agung OS home content data', error)
    return { dbError: true, posts: [], products: [], targetsDueToday: [] }
  }
}

export default async function OsHomePage() {
  await connection()

  const { dbError, posts, products, targetsDueToday } = await getHomeContentState()
  const readyContentToday = posts.filter((item) => item.status === 'ready').length
  const openThoughts = thoughts.filter((item) => item.status === 'open').length

  return (
    <>
      <section className={styles.welcome}>
        <div>
          <p className={styles.eyebrow}>Home</p>
          <h2 className={styles.welcomeTitle}>{getGreeting()}, Agung.</h2>
          <p className={styles.welcomeText}>Here is what is happening today.</p>
        </div>
        <OsLiveClock />
      </section>
      {dbError ? <DbUnavailable message="Database connection unavailable. Contents and targets could not be loaded." /> : null}

      <section className={styles.summaryGrid} aria-label="Agung OS summary">
        <SummaryCard hint="Ready or scheduled" label="Contents Today" value={readyContentToday} />
        <SummaryCard hint="Across commerce channels" label="Products Monitored" value={products.length} />
        <SummaryCard hint="Systems in motion" label="Active Projects" value={3} />
        <SummaryCard hint="Ideas waiting for review" label="Open Thoughts" value={openThoughts} />
      </section>

      <section className={styles.dashboardGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Today</h3>
              <p className={styles.muted}>Planned work for this evening.</p>
            </div>
            <Link className={styles.secondaryButton} href="/os/today">
              View
            </Link>
          </div>
          <div className={styles.targetTodayList}>
            {targetsDueToday.length > 0 ? (
              targetsDueToday.map((target) => (
                <div className={styles.targetTodayItem} key={target.id}>
                  <div>
                    <p className={styles.compactTitle}>{target.name}</p>
                    <p className={styles.muted}>
                      {target.platform} · @{target.account}
                      {target.preferredTime ? ` · ${target.preferredTime.slice(0, 5)} WIB` : ''} · every{' '}
                      {target.cadenceDays} days
                    </p>
                  </div>
                  <span className={styles.badge}>Target</span>
                </div>
              ))
            ) : (
              <div className={styles.targetTodayItem}>
                <div>
                  <p className={styles.compactTitle}>No publishing target today.</p>
                  <p className={styles.muted}>Cadence is clear for now.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Quick Actions</h3>
              <p className={styles.muted}>Start from the right workspace.</p>
            </div>
          </div>
          <div className={styles.quickActions}>
            <Link className={styles.actionLink} href="/os/content">
              <IconPlus size={18} stroke={1.8} />
              Add Contents
            </Link>
            <Link className={styles.actionLink} href="/os/products">
              <IconPlus size={18} stroke={1.8} />
              Add Product
            </Link>
            <Link className={styles.actionLink} href="/os/thoughts">
              <IconPlus size={18} stroke={1.8} />
              Capture Thought
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
