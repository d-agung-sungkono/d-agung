import { IconDiamond, IconLetterA } from '@tabler/icons-react'

import styles from './os-shell.module.css'

export default function OsHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.topbarLeft}>
        <div className={styles.productMark} aria-hidden="true">
          <IconLetterA size={15} stroke={2.4} />
        </div>
        <div className={styles.workspaceIcon} aria-hidden="true">
          <IconDiamond size={15} stroke={1.8} />
        </div>
        <div className={styles.workspaceName}>
          <span className={styles.headerTitle}>Agung OS</span>
        </div>
      </div>

      <div aria-hidden="true" />
    </header>
  )
}
