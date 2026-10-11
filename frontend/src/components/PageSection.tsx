import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageSection({
  title,
  description,
  action,
  align = 'left',
  as = 'section',
  className,
  id,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  align?: 'left' | 'center'
  as?: 'section' | 'div'
  className?: string
  id?: string
  children?: ReactNode
}) {
  const centered = align === 'center'
  const Comp = as
  return (
    <Comp id={id} className={cn(id && 'scroll-mt-24', className)}>
      <div
        className={cn(
          'mb-4 flex flex-col gap-3 sm:mb-5',
          action ? 'sm:flex-row sm:items-end sm:justify-between' : centered && 'items-center text-center',
        )}
      >
        <div className={cn(centered && !action && 'mx-auto max-w-xl')}>
          <h2 className={cn('text-2xl font-bold text-charcoal lg:text-3xl', centered && !action && 'text-center')}>
            {title}
          </h2>
          {description ? (
            <p className={cn('mt-1 text-sm text-muted-foreground', centered && !action && 'text-center')}>{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </Comp>
  )
}
