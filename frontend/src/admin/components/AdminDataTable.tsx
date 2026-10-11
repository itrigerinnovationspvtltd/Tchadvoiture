import type { ReactNode } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

export function AdminDataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden p-0',
        '[&_[data-slot=table-header]_[data-slot=table-row]]:border-border [&_[data-slot=table-header]_[data-slot=table-row]]:bg-muted/50 [&_[data-slot=table-header]_[data-slot=table-row]]:border-b',
        '[&_[data-slot=table-head]]:h-11 [&_[data-slot=table-head]]:px-4 [&_[data-slot=table-head]]:text-left [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-head]]:font-semibold [&_[data-slot=table-head]]:tracking-wide [&_[data-slot=table-head]]:text-muted-foreground [&_[data-slot=table-head]]:uppercase',
        '[&_[data-slot=table-cell]]:px-4 [&_[data-slot=table-cell]]:py-3.5',
        '[&_[data-slot=table-row]]:transition-colors [&_[data-slot=table-row]]:hover:bg-muted/40',
        '[&_[data-slot=table-body]_[data-slot=table-row]:last-child]:border-0',
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </Card>
  )
}
