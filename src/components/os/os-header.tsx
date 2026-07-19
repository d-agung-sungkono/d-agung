import styles from './os-shell.module.css'

export default function OsHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.topbarLeft}>
        <div className={styles.productMark} aria-hidden="true">
          A
        </div>
        <div className={styles.workspaceIcon} aria-hidden="true">
          ◈
        </div>
        <div className={styles.workspaceName}>
          <span className={styles.headerTitle}>Agung OS</span>
        </div>
      </div>

      <div aria-hidden="true" />
    </header>
  )
}
