import styles from '@/components/os/os-shell.module.css'
import OsCalendar, { type OsCalendarEvent } from '@/components/os/os-calendar'
import TodayList from '@/components/os/today-list'
import content from '@/data/os/content.json'
import today from '@/data/os/today.json'

export default function OsTodayPage() {
  const calendarEvents: OsCalendarEvent[] = [
    ...today.map((item) => ({
      id: item.id,
      title: item.title,
      start: `2026-07-17T${item.time}:00+07:00`,
      status: item.status,
      completed: item.completed,
      source: 'Today',
    })),
    ...content.map((item) => ({
      id: item.id,
      title: item.title,
      start: item.scheduledAt,
      status: item.status,
      source: item.platform,
    })),
  ]

  return (
    <>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Agung OS / Today</p>
          <h2 className={styles.pageTitle}>Today</h2>
          <p className={styles.pageDescription}>
            A calendar view for the daily operating plan, publishing queue, and review blocks.
          </p>
        </div>
        <button className={styles.primaryButton} type="button">
          Add Activity
        </button>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Calendar</h3>
            <p className={styles.muted}>Monthly by default. Switch view, click a day, or drag events to arrange.</p>
          </div>
        </div>
        <OsCalendar events={calendarEvents} />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Today List</h3>
            <p className={styles.muted}>The same operating plan in a compact list.</p>
          </div>
        </div>
        <TodayList items={today} />
      </section>
    </>
  )
}
