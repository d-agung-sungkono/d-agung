import LabsManager from '@/components/os/labs-manager'
import labs from '@/data/os/labs.json'

export default function OsLabsPage() {
  return <LabsManager labs={labs} />
}
