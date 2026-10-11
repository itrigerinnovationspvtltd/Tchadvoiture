import type { FormHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AdminToolbar({
  children,
  className,
  asForm,
  ...formProps
}: {
  children: ReactNode
  className?: string
  asForm?: boolean
} & FormHTMLAttributes<HTMLFormElement>) {
  const layoutClass = cn('flex flex-wrap items-center gap-2', className)
  if (asForm) {
    return (
      <form className={layoutClass} {...formProps}>
        {children}
      </form>
    )
  }
  return <div className={layoutClass}>{children}</div>
}
