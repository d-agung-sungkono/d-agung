import ProfilesSettings from '@/components/os/profiles-settings'
import { getSettingsData } from '@/lib/os-settings'

export default async function OsSocmedsPage() {
  const settingsData = await getSettingsData()
  return <ProfilesSettings {...settingsData} />
}
