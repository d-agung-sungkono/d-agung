import type { ReactNode } from 'react'

import ClosingPane from '@/components/common/ClosingPane'

type SiteLayoutProps = {
  children: ReactNode
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <>
      {children}
      <ClosingPane />
    </>
  )
}
