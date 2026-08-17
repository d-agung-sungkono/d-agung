import Link from 'next/link'
import { Button, Card, Text } from '@mantine/core'

import styles from '@/components/os/os-shell.module.css'

export default function OsBrandNotFound() {
  return (
    <Card className={styles.emptyState} padding="lg" radius="sm" withBorder>
      <Text className={styles.compactTitle}>Brand tidak ditemukan.</Text>
      <Text className={styles.muted}>ID brand ini tidak ada atau tidak bisa diakses dari workspace Agung OS saat ini.</Text>
      <Button component={Link} className={styles.accentAction} href="/os/brands" mt="md" variant="default">
        Back to Brands
      </Button>
    </Card>
  )
}
