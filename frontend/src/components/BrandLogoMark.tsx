import { useState } from 'react'
import { cn } from '@/lib/utils'
import { brandLogoUrl } from '@/lib/brandLogos'

export function BrandLogoMark({ makeName, className }: { makeName: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const url = brandLogoUrl(makeName)
  const showLogo = Boolean(url) && !failed

  return (
    <span
      className={cn(
        'relative flex h-16 w-16 items-center justify-center rounded-full bg-white ring-1 ring-border/60',
        className,
      )}
    >
      {showLogo ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-9 w-9 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-2xl font-bold text-primary">{makeName.slice(0, 1)}</span>
      )}
    </span>
  )
}
