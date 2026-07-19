import { Button } from '@mantine/core'

import DbUnavailable from '@/components/os/db-unavailable'
import styles from '@/components/os/os-shell.module.css'
import OsCalendar, { type OsCalendarEvent } from '@/components/os/os-calendar'
import { getContentData } from '@/lib/os-content'

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

function buildScheduleEvents(targets: Awaited<ReturnType<typeof getContentData>>['targets']) {
  return targets
    .filter((target) => target.status === 'active')
    .flatMap((target) =>
      Array.from({ length: 8 }, (_, index) => {
        const start = addDays(target.nextDueAt, index * target.cadenceDays)
        return {
          id: `target-${target.id}-${index}`,
          title: target.name,
          start,
          status: index === 0 ? 'planned' : 'draft',
          source: `${target.platform} Target`,
        }
      })
    )
}

export default async function OsTodayPage() {
  let posts: Awaited<ReturnType<typeof getContentData>>['posts'] = []
  let targets: Awaited<ReturnType<typeof getContentData>>['targets'] = []
  let dbError = false

  try {
    const contentData = await getContentData()
    posts = contentData.posts
    targets = contentData.targets
  } catch (error) {
    dbError = true
    console.error('Failed to load Agung OS calendar content data', error)
  }

  const calendarEvents: OsCalendarEvent[] = [
    ...buildScheduleEvents(targets),
    ...posts.map((item) => ({
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
        <Button type="button">
          Add Activity
        </Button>
      </section>
      {dbError ? <DbUnavailable message="Database connection unavailable. Calendar is showing local today data only." /> : null}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Calendar</h3>
            <p className={styles.muted}>Monthly by default. Switch view, click a day, or drag events to arrange.</p>
          </div>
        </div>
        <OsCalendar events={calendarEvents} />
      </section>
    </>
  )
}
