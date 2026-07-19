import Link from 'next/link'

import OsLiveClock from '@/components/os/os-live-clock'
import styles from '@/components/os/os-shell.module.css'
import SummaryCard from '@/components/os/summary-card'
import TodayList from '@/components/os/today-list'
import content from '@/data/os/content.json'
import products from '@/data/os/products.json'
import thoughts from '@/data/os/thoughts.json'
import today from '@/data/os/today.json'

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

export default function OsHomePage() {
  const readyContentToday = content.filter((item) => item.status === 'ready').length
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

      <section className={styles.summaryGrid} aria-label="Agung OS summary">
        <SummaryCard hint="Ready or scheduled" label="Content Today" value={readyContentToday} />
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
          <TodayList items={today} />
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
              Add Content
            </Link>
            <Link className={styles.actionLink} href="/os/products">
              Add Product
            </Link>
            <Link className={styles.actionLink} href="/os/thoughts">
              Capture Thought
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
