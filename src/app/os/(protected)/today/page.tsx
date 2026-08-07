import { Button } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { connection } from 'next/server'

import DbUnavailable from '@/components/os/db-unavailable'
import styles from '@/components/os/os-shell.module.css'
import OsCalendar, { type OsCalendarEvent } from '@/components/os/os-calendar'
import { getContentData } from '@/lib/os-content'

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

function getJakartaDateKey(value: Date | string = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  }).format(new Date(value))
}

function buildScheduleEvents(targets: Awaited<ReturnType<typeof getContentData>>['targets']) {
  const today = getJakartaDateKey()

  return targets
    .filter((target) => target.status === 'active')
    .flatMap((target) =>
      Array.from({ length: 8 }, (_, index) => {
        const start = addDays(target.nextDueAt, index * target.cadenceDays)
        const overdue = getJakartaDateKey(start) < today

        return {
          id: `target-${target.id}-${index}`,
          title: target.name,
          start,
          status: index === 0 ? 'planned' : 'draft',
          source: `${target.platform} Target`,
          overdue,
        }
      })
    )
}

export default async function OsTodayPage() {
  await connection()

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
        <Button leftSection={<IconPlus size={18} stroke={1.8} />} type="button">
          Add Activity
        </Button>
      </section>
      {dbError ? <DbUnavailable message="Database connection unavailable. Calendar is showing local today data only." /> : null}

      <section className={styles.panel}>
        <OsCalendar events={calendarEvents} />
      </section>
    </>
  )
}
