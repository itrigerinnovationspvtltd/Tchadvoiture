import { cn } from '@/lib/utils'

/** Shared 16:10 listing photo frame — prevents portrait uploads from breaking grids. */
export function VehiclePhoto({
  src,
  alt,
  className,
  aspectClassName = 'aspect-[16/10]',
}: {
  src?: string
  alt: string
  className?: string
  aspectClassName?: string
}) {
  return (
    <div className={cn('relative w-full shrink-0 overflow-hidden bg-muted', aspectClassName, className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">No photo</div>
      )}
    </div>
  )
}
