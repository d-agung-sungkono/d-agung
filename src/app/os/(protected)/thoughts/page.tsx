import ThoughtsManager from '@/components/os/thoughts-manager'
import thoughts from '@/data/os/thoughts.json'

export default function OsThoughtsPage() {
  return <ThoughtsManager thoughts={thoughts} />
}
