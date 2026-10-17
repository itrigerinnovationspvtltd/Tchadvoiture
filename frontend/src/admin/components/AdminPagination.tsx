import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui'
import { adminButtonClass } from './adminControls'

type AdminPaginationProps = {
  page: number
  pages: number
  total: number
  className?: string
}

export function AdminPagination({ page, pages, total, className }: AdminPaginationProps) {
  const [params, setParams] = useSearchParams()

  if (pages <= 1 && total === 0) return null

  function go(nextPage: number) {
    const merged = new URLSearchParams(params)
    if (nextPage <= 1) merged.delete('page')
    else merged.set('page', String(nextPage))
    setParams(merged)
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 pt-4 ${className ?? ''}`}>
      <p className="text-sm text-muted-foreground">
        Page {page} of {pages}
        {total > 0 ? ` · ${total} total` : ''}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className={adminButtonClass} disabled={page <= 1} onClick={() => go(page - 1)}>
          Previous
        </Button>
        <Button type="button" variant="outline" className={adminButtonClass} disabled={page >= pages} onClick={() => go(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
