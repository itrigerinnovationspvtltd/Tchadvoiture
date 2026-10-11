import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Checkbox } from '@/components/ui'
import { clearCompare, toggleCompare, useCompareIds } from '@/lib/compare'
import { cn } from '@/lib/utils'

export function CompareToggle({ id, className }: { id: string; className?: string }) {
  const ids = useCompareIds()
  const checked = ids.includes(id)
  const [message, setMessage] = useState('')

  function apply() {
    const result = toggleCompare(id)
    setMessage(result.ok ? '' : 'You can compare up to 3 cars.')
  }

  return (
    <div className={className}>
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        className="flex h-11 cursor-pointer items-center gap-2 text-sm"
        onClick={apply}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault()
            apply()
          }
        }}
      >
        <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none after:hidden" />
        Compare
      </div>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  )
}

export function CompareBar() {
  const ids = useCompareIds()
  if (!ids.length) return null
  const label = ids.length === 1 ? '1 car selected' : `${ids.length} cars selected`
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card shadow-lg">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={() => clearCompare()}>
            Clear
          </Button>
          <Button asChild className={cn('h-11 bg-charcoal text-white hover:bg-charcoal/90')}>
            <Link to="/compare">Compare</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
