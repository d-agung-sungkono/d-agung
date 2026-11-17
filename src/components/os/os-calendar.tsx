'use client'

import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Badge, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { IconBrandInstagram, IconBrandTiktok, IconCalendarPlus, IconShoppingBag } from '@tabler/icons-react'
import { type CSSProperties, useMemo, useState } from 'react'

import styles from './os-shell.module.css'

export type OsCalendarEvent = {
  account?: string | null
  brandColor?: string | null
  id: string
  title: string
  start: string
  end?: string
  status: string
  source: string
  label?: string | null
  notes?: string | null
  url?: string | null
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

function getColorChannels(color: string) {
  return {
    blue: Number.parseInt(color.slice(5, 7), 16),
    green: Number.parseInt(color.slice(3, 5), 16),
    red: Number.parseInt(color.slice(1, 3), 16),
  }
}

function getBrandCalendarColors(brandColor?: string | null) {
  if (!brandColor || !/^#[0-9A-Fa-f]{6}$/.test(brandColor)) {
    return {}
  }

  return {
    backgroundColor: 'transparent',
    borderColor: brandColor,
    textColor: '#17201b',
  }
}

function getBrandCalendarStyle(brandColor?: string | null) {
  if (!brandColor || !/^#[0-9A-Fa-f]{6}$/.test(brandColor)) {
    return undefined
  }

  const { blue, green, red } = getColorChannels(brandColor)

  return {
    '--calendar-brand-bg': `rgba(${red}, ${green}, ${blue}, 0.14)`,
    '--calendar-brand-border': brandColor,
    '--calendar-brand-text': brandColor,
  } as CSSProperties
}

function getStatusClassName(status: string) {
  return `status-${status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function getSourceInfo(source: string) {
  const normalizedSource = source.toLowerCase()

  if (normalizedSource.includes('tiktok')) {
    return { icon: IconBrandTiktok, label: 'TikTok' }
  }

  if (normalizedSource.includes('instagram')) {
    return { icon: IconBrandInstagram, label: 'Instagram' }
  }

  if (normalizedSource.includes('shopee')) {
    return { icon: IconShoppingBag, label: 'Shopee' }
  }

  return { icon: IconCalendarPlus, label: source }
}

export default function OsCalendar({ events }: OsCalendarProps) {
  const [activeEvent, setActiveEvent] = useState<OsCalendarEvent | null>(null)
  const [localEvents, setLocalEvents] = useState<OsCalendarEvent[]>([])
  const [eventOverrides, setEventOverrides] = useState<Record<string, Partial<OsCalendarEvent>>>({})

  const calendarEvents = useMemo(
    () => [
      ...events.map((event) => ({ ...event, ...eventOverrides[event.id] })),
      ...localEvents.map((event) => ({ ...event, ...eventOverrides[event.id] })),
    ],
    [eventOverrides, events, localEvents]
  )

  const normalizedEvents = useMemo(
    () =>
      calendarEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end ?? addOneHour(event.start),
        classNames: event.brandColor
          ? ['os-calendar-has-brand-color']
          : [`os-calendar-event-${event.status}`, getSourceClassName(event.source)],
        ...getBrandCalendarColors(event.brandColor),
        extendedProps: {
          account: event.account,
          brandColor: event.brandColor,
          completed: event.completed ?? false,
          label: event.label,
          notes: event.notes,
          overdue: event.overdue ?? false,
          source: event.source,
          status: event.status,
          url: event.url,
        },
      })),
    [calendarEvents]
  )

  function handleDateClick(info: DateClickArg) {
    const start = info.dateStr.includes('T') ? info.dateStr : `${info.dateStr}T09:00:00+07:00`

    setLocalEvents((currentEvents) => [
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
          setEventOverrides((currentOverrides) => ({
            ...currentOverrides,
            [info.event.id]: {
              ...currentOverrides[info.event.id],
              end: info.event.end?.toISOString(),
              start: info.event.start?.toISOString(),
            },
          }))
        }}
        eventClick={(info) => {
          const currentEvent = calendarEvents.find((event) => event.id === info.event.id)
          setActiveEvent(currentEvent ?? null)
        }}
        eventContent={(eventInfo) => (
          <CalendarEventContent
            brandColor={eventInfo.event.extendedProps.brandColor}
            completed={eventInfo.event.extendedProps.completed}
            overdue={eventInfo.event.extendedProps.overdue}
            source={String(eventInfo.event.extendedProps.source)}
            status={String(eventInfo.event.extendedProps.status)}
            title={eventInfo.event.title}
          />
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
      <CalendarEventModal event={activeEvent} onClose={() => setActiveEvent(null)} />
    </div>
  )
}

function formatEventDateTime(value?: string) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

function CalendarEventModal({ event, onClose }: { event: OsCalendarEvent | null; onClose: () => void }) {
  const sourceInfo = getSourceInfo(event?.source ?? 'Manual')
  const SourceIcon = sourceInfo.icon

  return (
    <Modal
      centered
      classNames={{
        body: styles.osModalBody,
        content: styles.osModalContent,
        header: styles.osModalHeader,
        title: styles.osModalTitle,
      }}
      opened={Boolean(event)}
      onClose={onClose}
      size="lg"
      title="Content Detail"
    >
      {event ? (
        <Stack gap="md">
          <div className={styles.calendarDetailHeader} style={getBrandCalendarStyle(event.brandColor)}>
            <Group className={styles.calendarDetailHeaderRow} justify="space-between" align="flex-start" gap="md" wrap="nowrap">
              <div className={styles.calendarDetailHeaderCopy}>
                <Text component="h3" className={styles.modalSectionTitle}>{event.title}</Text>
                <Text className={styles.modalSectionHint}>{formatEventDateTime(event.start)}</Text>
              </div>
              <Group className={styles.calendarDetailHeaderMeta} gap="xs" wrap="nowrap">
                <Badge className={styles.badge} data-status={event.status} variant="light">
                  {event.status}
                </Badge>
                <span aria-label={sourceInfo.label} className={styles.calendarSourceMark} data-source={sourceInfo.label.toLowerCase()} role="img">
                  <SourceIcon size={14} stroke={2} />
                </span>
              </Group>
            </Group>
          </div>
          <div className={styles.calendarDetailGrid}>
            <div>
              <Text className={styles.modalSectionTitle}>Source</Text>
              <Text className={styles.muted}>
                {sourceInfo.label}{event.account ? ` · @${event.account}` : ''}
              </Text>
            </div>
            <div>
              <Text className={styles.modalSectionTitle}>Status</Text>
              <Text className={styles.muted}>
                {event.overdue ? 'Overdue' : event.completed ? 'Completed' : event.status}
              </Text>
            </div>
          </div>
          {event.label ? (
            <div>
              <Text className={styles.modalSectionTitle}>Label</Text>
              <Text className={styles.muted}>{event.label}</Text>
            </div>
          ) : null}
          {event.notes ? (
            <div>
              <Text className={styles.modalSectionTitle}>Notes</Text>
              <Text className={styles.brandSectionText}>{event.notes}</Text>
            </div>
          ) : null}
          {event.url ? (
            <Button className={styles.accentAction} component="a" href={event.url} rel="noreferrer noopener" target="_blank" variant="default">
              Open Content
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Modal>
  )
}

function CalendarEventContent({
  brandColor,
  completed,
  overdue,
  source,
  status,
  title,
}: {
  brandColor?: string | null
  completed?: boolean
  overdue?: boolean
  source: string
  status: string
  title: string
}) {
  const sourceInfo = getSourceInfo(source)
  const SourceIcon = sourceInfo.icon

  return (
    <div className={styles.calendarEvent} style={getBrandCalendarStyle(brandColor)}>
      <span className={styles.calendarEventTitle}>
        <span aria-hidden="true" className={styles.calendarStatusDot} data-status={getStatusClassName(status)} />
        {completed ? (
          <span className={styles.calendarCheck}>✓</span>
        ) : overdue ? (
          <span className={styles.calendarAlert}>!</span>
        ) : null}
        <span className={styles.calendarEventTitleText}>{title}</span>
      </span>
      <span className={styles.calendarEventMeta}>
        <span aria-label={sourceInfo.label} className={styles.calendarSourceMark} data-source={sourceInfo.label.toLowerCase()} role="img">
          <SourceIcon size={12} stroke={2} />
        </span>
      </span>
    </div>
  )
}
