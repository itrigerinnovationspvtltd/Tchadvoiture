import { Skeleton } from '@/components/ui'
import { interactiveCardClass } from '@/lib/motion'
import { cn } from '@/lib/utils'

export type PageLoadingVariant =
  | 'default'
  | 'marketing'
  | 'vehicle'
  | 'vehicle-gallery'
  | 'cards'
  | 'list'
  | 'form'
  | 'seller'
  | 'admin'

function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-3 h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function VehicleDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className={cn('rounded-2xl bg-card p-4 ring-1 ring-border/60 sm:p-6', interactiveCardClass)}>
        <div className="flex flex-col gap-6 md:flex-row">
          <Skeleton className="aspect-[16/10] w-full shrink-0 rounded-xl md:w-80 lg:w-96" />
          <div className="flex flex-1 flex-col gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className={cn('overflow-hidden rounded-2xl bg-card ring-1 ring-border/60', interactiveCardClass)}>
        <Skeleton className="h-16 w-full rounded-none" />
        <Skeleton className="m-4 h-48 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function PageLoadingSkeleton({ variant = 'default' }: { variant?: PageLoadingVariant }) {
  if (variant === 'marketing') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-64 w-full rounded-2xl sm:rounded-2xl" />
        <Skeleton className="mt-8 h-10 w-64 max-w-full" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    )
  }

  if (variant === 'vehicle' || variant === 'vehicle-gallery') {
    if (variant === 'vehicle-gallery') {
      return (
        <div className="space-y-6">
          <Skeleton className="min-h-[28rem] w-full rounded-2xl lg:min-h-[34rem]" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-5 w-40" />
              <div className="flex gap-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-16 flex-1 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-72 rounded-2xl lg:h-auto" />
          </div>
        </div>
      )
    }
    return <VehicleDetailSkeleton />
  }

  if (variant === 'cards') {
    return (
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-4 w-64 max-w-full" />
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={cn('flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-border/60 sm:flex-row', interactiveCardClass)}>
              <Skeleton className="h-28 w-full shrink-0 rounded-xl sm:w-40" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="mt-auto h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="grid grid-cols-4 gap-2 pt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-11 w-36 rounded-md" />
      </div>
    )
  }

  if (variant === 'seller') {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-card p-6 ring-1 ring-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="size-20 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
          </div>
        </div>
        <CardGridSkeleton count={3} />
      </div>
    )
  }

  if (variant === 'admin') {
    return (
      <div className="admin-shell min-h-dvh bg-background p-4 lg:ml-64 lg:p-5">
        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
    </div>
  )
}
