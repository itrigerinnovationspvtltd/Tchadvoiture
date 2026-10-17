import { assetUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

/** Shared 16:10 listing photo frame — prevents portrait uploads from breaking grids. */
export function VehiclePhoto({
  src,
  alt,
  className,
  aspectClassName = 'aspect-[16/10]',
  fit = 'cover',
}: {
  src?: string
  alt: string
  className?: string
  aspectClassName?: string
  fit?: 'cover' | 'contain'
}) {
  return (
    <div className={cn('relative w-full shrink-0 overflow-hidden bg-muted', aspectClassName, className)}>
      {src ? (
        <img
          src={assetUrl(src)}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            'absolute inset-0 size-full object-center',
            fit === 'contain' ? 'object-contain' : 'object-cover',
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">No photo</div>
      )}
    </div>
  )
}
