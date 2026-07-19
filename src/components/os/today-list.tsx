'use client'

import { useState } from 'react'
import { Badge, Box, Checkbox, Stack, Text } from '@mantine/core'

import styles from './os-shell.module.css'

type TodayItem = {
  id: string
  time: string
  title: string
  status: string
  completed?: boolean
}

type TodayListProps = {
  items: TodayItem[]
}

function formatStatus(status: string) {
  return status.replace('-', ' ')
}

export default function TodayList({ items }: TodayListProps) {
  const [checkedItems, setCheckedItems] = useState(
    () => new Set(items.filter((item) => item.completed).map((item) => item.id))
  )

  return (
    <Stack component="ul" gap="xs" className={styles.todayList}>
      {items.map((item) => (
        <Box component="li" className={styles.todayItem} key={item.id}>
          <Box className={styles.todayTopLine}>
            <Checkbox
              checked={checkedItems.has(item.id)}
              className={styles.checkLabel}
              label={<Text className={styles.todayTitle}>{item.title}</Text>}
              onChange={(event) => {
                  setCheckedItems((currentItems) => {
                    const nextItems = new Set(currentItems)

                    if (event.currentTarget.checked) {
                      nextItems.add(item.id)
                    } else {
                      nextItems.delete(item.id)
                    }

                    return nextItems
                  })
              }}
            />
            <Badge className={styles.badge} data-status={item.status} variant="light">
              {formatStatus(item.status)}
            </Badge>
          </Box>
          <Text component="time" className={styles.time}>{item.time}</Text>
        </Box>
      ))}
    </Stack>
  )
}
