import Hero from '@/components/home/Hero'
import { systems } from '@/data/systems'

export default function SiteHomePage() {
  const featuredSystem = systems.find((system) => system.featured)
  const selectedSystem =
    systems.find((system) => system.slug === 'fasih-form-gear') ??
    systems.find((system) => !system.featured) ??
    systems[0] ??
    null
  const upcomingSystems = systems.filter(
    (system) =>
      system.slug !== featuredSystem?.slug &&
      system.slug !== selectedSystem?.slug &&
      (system.status === 'idea' || system.status === 'exploring' || system.status === 'in-progress')
  )

  return (
    <Hero
      featuredSystem={featuredSystem ?? null}
      selectedSystem={selectedSystem}
      upcomingSystems={upcomingSystems}
    />
  )
}
