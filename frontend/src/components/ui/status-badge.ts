import { cn } from '@/lib/utils'

const badgeColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  active: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  inactive: 'bg-neutral-200 text-neutral-700 border-neutral-300',
  sold: 'bg-charcoal text-white border-charcoal',
  new: 'bg-primary/10 text-primary border-primary/20',
  read: 'bg-neutral-200 text-neutral-700 border-neutral-300',
  closed: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  blocked: 'bg-red-100 text-red-800 border-red-200',
  open: 'bg-amber-100 text-amber-900 border-amber-200',
}

export function statusBadgeClass(value: string) {
  return cn('capitalize', badgeColors[value] ?? 'bg-neutral-100 text-neutral-700')
}
