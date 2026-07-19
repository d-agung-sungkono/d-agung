import ProfilesSettings from '@/components/os/profiles-settings'
import profiles from '@/data/os/profiles.json'

export default function OsSettingsPage() {
  return <ProfilesSettings profiles={profiles} />
}
