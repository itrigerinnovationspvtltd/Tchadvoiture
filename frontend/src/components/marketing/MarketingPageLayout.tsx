import type { ReactNode } from 'react'
import { PageLoadingSkeleton } from '../PageLoadingSkeleton'
import { Alert, AlertDescription } from '@/components/ui'
import { assetUrl } from '../../lib/api'
import { errorMessage } from '../../lib/format'

export function MarketingPageLayout({
  title,
  heroImage,
  eyebrow,
  loading,
  error,
  children,
}: {
  title: string
  heroImage: string
  eyebrow?: string
  loading?: boolean
  error?: unknown
  children: ReactNode
}) {
  if (loading) {
    return <PageLoadingSkeleton variant="marketing" />
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="pb-4">
      <div className="relative mx-auto min-h-[280px] max-w-6xl overflow-hidden rounded-none sm:mx-4 sm:rounded-2xl lg:min-h-[320px]">
        <img src={assetUrl(heroImage)} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/55 to-charcoal/30" aria-hidden />
        <div className="relative flex h-full min-h-[280px] flex-col justify-end px-6 pb-10 pt-16 lg:min-h-[320px] lg:px-10">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-white/80">{eyebrow}</p> : null}
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        </div>
      </div>
      <div className="animate-slide-in-up mx-auto max-w-6xl px-4 py-10 sm:py-12">{children}</div>
    </div>
  )
}
