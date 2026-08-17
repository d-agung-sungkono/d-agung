'use client'

import Image from 'next/image'
import { useState } from 'react'

import styles from './os-shell.module.css'

type BrandImageProps = {
  alt: string
  className?: string
  labelClassName?: string
  sizes?: string
  src: string | null
}

export default function BrandImage({ alt, className, labelClassName, sizes = '100vw', src }: BrandImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return <div aria-hidden="true" className={labelClassName ?? styles.brandImageFallback}>{alt.slice(0, 1).toUpperCase()}</div>
  }

  return (
    <Image
      alt={alt}
      className={className ?? styles.brandImage}
      height={900}
      onError={() => setFailedSrc(src)}
      sizes={sizes}
      src={src}
      unoptimized
      width={1200}
    />
  )
}
