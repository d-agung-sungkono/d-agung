import styles from './os-shell.module.css'

type SummaryCardProps = {
  label: string
  value: string | number
  hint: string
}

export default function SummaryCard({ label, value, hint }: SummaryCardProps) {
  return (
    <article className={styles.summaryCard}>
      <p className={styles.summaryLabel}>{label}</p>
      <p className={styles.summaryValue}>{value}</p>
      <p className={styles.summaryHint}>{hint}</p>
    </article>
  )
}
