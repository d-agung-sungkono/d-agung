import styles from '@/components/os/os-shell.module.css'

type DbUnavailableProps = {
  message?: string
}

export default function DbUnavailable({
  message = 'Database connection unavailable. Please check the DB service and reload this page.',
}: DbUnavailableProps) {
  return (
    <div className={styles.error} role="status">
      {message}
    </div>
  )
}
