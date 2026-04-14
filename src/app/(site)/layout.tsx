import type { ReactNode } from 'react'

type SiteLayoutProps = {
  children: ReactNode
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <>
      <header>
        Public Header
      </header>
      <main>
        {children}
      </main>
    </>
  )
}
