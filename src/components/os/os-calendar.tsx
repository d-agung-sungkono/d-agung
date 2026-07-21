'use client'

import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useMemo, useState } from 'react'

import styles from './os-shell.module.css'

export type OsCalendarEvent = {
  id: string
  title: string
  start: string
  end?: string
  status: string
  source: string
  completed?: boolean
  overdue?: boolean
}

type OsCalendarProps = {
  events: OsCalendarEvent[]
}

function addOneHour(value: string) {
  const date = new Date(value)
  date.setHours(date.getHours() + 1)
  return date.toISOString()
}

function getSourceClassName(source: string) {
  return `os-calendar-source-${source.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export default function OsCalendar({ events }: OsCalendarProps) {
  const [calendarEvents, setCalendarEvents] = useState(events)

  const normalizedEvents = useMemo(
    () =>
      calendarEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end ?? addOneHour(event.start),
        classNames: [`os-calendar-event-${event.status}`, getSourceClassName(event.source)],
        extendedProps: {
          completed: event.completed ?? false,
          overdue: event.overdue ?? false,
          source: event.source,
          status: event.status,
        },
      })),
    [calendarEvents]
  )

  function handleDateClick(info: DateClickArg) {
    const start = info.dateStr.includes('T') ? info.dateStr : `${info.dateStr}T09:00:00+07:00`

    setCalendarEvents((currentEvents) => [
      ...currentEvents,
      {
        id: `calendar-draft-${Date.now()}`,
        title: 'New plan',
        start,
        end: addOneHour(start),
        source: 'Manual',
        status: 'planned',
      },
    ])
  }

  return (
    <div className={styles.calendar}>
      <FullCalendar
        allDaySlot={false}
        buttonText={{
          day: 'Day',
          month: 'Month',
          today: 'Today',
          week: 'Week',
        }}
        dateClick={handleDateClick}
        dayMaxEvents={3}
        editable
        eventChange={(info) => {
          setCalendarEvents((currentEvents) =>
            currentEvents.map((event) =>
              event.id === info.event.id
                ? {
                    ...event,
                    start: info.event.start?.toISOString() ?? event.start,
                    end: info.event.end?.toISOString(),
                  }
                : event
            )
          )
        }}
        eventClick={(info) => {
          setCalendarEvents((currentEvents) =>
            currentEvents.map((event) =>
              event.id === info.event.id ? { ...event, completed: !event.completed } : event
            )
          )
        }}
        eventContent={(eventInfo) => (
          <div className={styles.calendarEvent}>
            <span className={styles.calendarEventTitle}>
              {eventInfo.event.extendedProps.completed ? (
                <span className={styles.calendarCheck}>✓</span>
              ) : eventInfo.event.extendedProps.overdue ? (
                <span className={styles.calendarAlert}>!</span>
              ) : null}
              {eventInfo.event.title}
            </span>
            <span className={styles.calendarEventMeta}>
              {String(eventInfo.event.extendedProps.source)}
            </span>
          </div>
        )}
        events={normalizedEvents}
        firstDay={1}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        height="auto"
        initialView="dayGridMonth"
        nowIndicator
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        selectable
        selectMirror
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        timeZone="Asia/Jakarta"
      />
    </div>
  )
}
