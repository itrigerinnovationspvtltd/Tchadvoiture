import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { assetUrl } from '../lib/api'
import { MARKETING_HERO_IMAGE } from '../content/faqs'
import { btnLiftClass } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '../lib/auth'

export function FooterCta() {
  const { user } = useAuth()
  const sellHref = user && user.role !== 'buyer' ? '/my-listings/new' : '/signup'
  const sellLabel = user && user.role !== 'buyer' ? 'List your car' : 'Create an account to sell'

  return (
    <section className="relative overflow-hidden bg-charcoal text-white">
      <img src={assetUrl(MARKETING_HERO_IMAGE)} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/90 to-charcoal/70" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Tchadvoiture</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Ready to buy or sell?</h2>
          <p className="mt-3 max-w-lg text-white/85">
            Find admin-approved cars from dealers and individuals, or list your vehicle and go live after review.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-start">
          <Button
            asChild
            className={cn('h-12 w-full cursor-pointer justify-between rounded-full bg-white px-2 pl-6 text-base text-charcoal hover:bg-white/90 sm:max-w-md', btnLiftClass)}
          >
            <Link to="/cars" className="flex w-full items-center justify-between gap-2">
              Browse cars
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-charcoal text-white">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={cn('h-12 w-full cursor-pointer justify-between rounded-full border-white/30 bg-white/10 px-2 pl-6 text-base text-white hover:bg-white/15 sm:max-w-md', btnLiftClass)}
          >
            <Link to={sellHref} className="flex w-full items-center justify-between gap-2">
              {sellLabel}
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
