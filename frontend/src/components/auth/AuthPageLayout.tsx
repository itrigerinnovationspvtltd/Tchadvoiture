import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Car, CheckCircle2 } from 'lucide-react'
import { assetUrl } from '@/lib/api'
import { MARKETING_HERO_IMAGE } from '@/content/faqs'
import { surfacePanelClass } from '@/lib/motion'
import { cn } from '@/lib/utils'

const highlights = [
  'Browse admin-approved listings',
  'Enquire without exposing seller numbers',
  'List as an individual or dealer',
] as const

type AuthPageLayoutProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  /** Wider form column for signup */
  wideForm?: boolean
}

export function AuthPageLayout({ eyebrow, title, description, children, footer, wideForm }: AuthPageLayoutProps) {
  return (
    <div className={cn('mx-auto w-full animate-slide-in-up', wideForm ? 'max-w-6xl' : 'max-w-5xl')}>
      <div className={cn('grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]', surfacePanelClass)}>
        <aside className="relative min-h-[220px] overflow-hidden bg-charcoal lg:min-h-[32rem]">
          <img
            src={assetUrl(MARKETING_HERO_IMAGE)}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-charcoal/85 to-charcoal/95" aria-hidden />
          <div className="relative flex h-full flex-col justify-between p-8 text-white lg:p-10">
            <div>
              <Link to="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                  <Car className="size-5" aria-hidden />
                </span>
                <span className="text-xl font-bold tracking-tight">
                  Tchad<span className="text-accent">voiture</span>
                </span>
              </Link>
              <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-white/70">{eyebrow}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">{description}</p>
            </div>
            <ul className="mt-8 hidden space-y-3 lg:block">
              {highlights.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-white/90">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex flex-col justify-center bg-card px-6 py-10 sm:px-10 sm:py-12">
          <div className={cn('mx-auto w-full', wideForm ? 'max-w-xl' : 'max-w-md')}>{children}</div>
          <div className={cn('mx-auto mt-8 w-full text-center text-sm text-muted-foreground', wideForm ? 'max-w-xl' : 'max-w-md')}>
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}

export const authFieldClass =
  'h-11 rounded-xl border-border bg-secondary/30 px-4 transition-colors focus-visible:bg-card'

export const authPrimaryButtonClass = 'h-11 w-full rounded-full text-base font-semibold'
