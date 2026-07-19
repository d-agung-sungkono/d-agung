'use client'

import { useState } from 'react'

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
    <ul className={styles.todayList}>
      {items.map((item) => (
        <li className={styles.todayItem} key={item.id}>
          <div className={styles.todayTopLine}>
            <label className={styles.checkLabel}>
              <input
                checked={checkedItems.has(item.id)}
                className={styles.checkbox}
                onChange={(event) => {
                  setCheckedItems((currentItems) => {
                    const nextItems = new Set(currentItems)

                    if (event.target.checked) {
                      nextItems.add(item.id)
                    } else {
                      nextItems.delete(item.id)
                    }

                    return nextItems
                  })
                }}
                type="checkbox"
              />
              <span className={styles.todayTitle}>{item.title}</span>
            </label>
            <span className={styles.badge} data-status={item.status}>
              {formatStatus(item.status)}
            </span>
          </div>
          <time className={styles.time}>{item.time}</time>
        </li>
      ))}
    </ul>
  )
}
