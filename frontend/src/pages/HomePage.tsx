import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Car, ChevronLeft, ChevronRight, Search, Truck, type LucideIcon } from 'lucide-react'
import { BrandLogoMark } from '../components/BrandLogoMark'
import { CarCard } from '../components/CarCard'
import { HomeProcessSection } from '../components/marketing/HomeProcessSection'
import { WhyBentoSection } from '../components/marketing/WhyBentoSection'
import { PageSection } from '../components/PageSection'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Input, Skeleton } from '@/components/ui'
import { api, assetUrl } from '../lib/api'
import { useCatalog } from '../lib/hooks'
import type { Paged, Vehicle } from '../lib/types'
import { faqs } from '../content/faqs'
import { btnLiftClass, interactiveCardClass, interactiveTileClass } from '@/lib/motion'
import { cn } from '@/lib/utils'

function typeIcon(name: string): LucideIcon {
  const value = name.toLowerCase()
  if (value.includes('suv') || value.includes('pickup') || value.includes('van')) return Truck
  return Car
}

function ShowcaseRow({ vehicles, loading }: { vehicles?: Vehicle[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="carousel-row flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="min-w-[280px] max-w-[320px] flex-[0_0_85%] shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-border sm:flex-[0_0_280px]">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (!vehicles?.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-muted-foreground">
        No approved cars in this view yet.
      </p>
    )
  }
  return (
    <div className="carousel-row flex w-full min-w-0 gap-4 overflow-x-auto scroll-smooth pb-2">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="min-w-[280px] max-w-[320px] flex-[0_0_85%] shrink-0 sm:flex-[0_0_280px]">
          <CarCard vehicle={vehicle} variant="showcase" />
        </div>
      ))}
    </div>
  )
}

function SortPills({ sort, onSort }: { sort: 'newest' | 'price_asc'; onSort: (value: 'newest' | 'price_asc') => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        className={`rounded-full ${sort !== 'newest' ? 'border-primary/20 hover:bg-secondary' : ''}`}
        variant={sort === 'newest' ? 'default' : 'outline'}
        onClick={() => onSort('newest')}
      >
        Newest
      </Button>
      <Button
        type="button"
        className={`rounded-full ${sort !== 'price_asc' ? 'border-primary/20 hover:bg-secondary' : ''}`}
        variant={sort === 'price_asc' ? 'default' : 'outline'}
        onClick={() => onSort('price_asc')}
      >
        Lowest price
      </Button>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const catalog = useCatalog()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'newest' | 'price_asc'>('newest')
  const [slide, setSlide] = useState(0)
  const [brokenPhotos, setBrokenPhotos] = useState<string[]>([])
  const types = catalog.data?.vehicleTypes ?? []
  const quickTypes = types.slice(0, 6)
  const listings = useQuery({
    queryKey: ['vehicles', 'featured', sort],
    queryFn: () => api<Paged<Vehicle>>(`/api/vehicles?limit=8&sort=${sort}`),
  })
  const featured = listings.data?.items ?? []
  const photoUrls = featured.flatMap((vehicle) => (vehicle.images[0]?.url ? [vehicle.images[0].url] : []))
  const usablePhotos = photoUrls.filter((url) => !brokenPhotos.includes(url))
  const slideCount = Math.max(usablePhotos.length, 2)
  const heroPhoto = usablePhotos.length ? usablePhotos[slide % usablePhotos.length] : undefined

  useEffect(() => {
    if (window.location.hash !== '#faq') return
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slideCount), 5000)
    return () => window.clearInterval(timer)
  }, [slideCount])

  function search(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    navigate(`/cars?${params.toString()}`)
  }

  function markPhotoBroken(url: string) {
    setBrokenPhotos((current) => (current.includes(url) ? current : [...current, url]))
  }

  return (
    <div>
      <section
        className="home-hero-overlay relative flex min-h-[520px] w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-24 text-center text-white lg:min-h-[600px]"
        aria-roledescription="carousel"
        aria-label="Highlights"
      >
        {heroPhoto ? (
          <img
            src={assetUrl(heroPhoto)}
            alt=""
            className="absolute inset-0 size-full object-cover"
            onError={() => markPhotoBroken(heroPhoto)}
          />
        ) : (
          <div className="hero-gradient absolute inset-0" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/75 via-charcoal/55 to-charcoal/80" aria-hidden />
        <div className="animate-slide-in-up relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center">
          <p className="text-sm font-medium text-white/90 sm:text-base">
            Explore admin-approved cars from dealers and individuals
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Online car buying made simple
          </h1>
          <form
            onSubmit={search}
            className="mt-8 flex w-full max-w-2xl items-center gap-1 rounded-full bg-white p-1.5 pl-4 shadow-lg ring-1 ring-white/20 sm:pl-5"
          >
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              className="h-11 min-w-0 flex-1 border-0 bg-transparent px-2 text-base text-charcoal shadow-none focus-visible:ring-0 md:text-sm"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="What are you looking for?"
              aria-label="Search cars"
            />
            <Button type="submit" className={cn('h-11 shrink-0 cursor-pointer rounded-full px-6', btnLiftClass)}>
              Search
            </Button>
          </form>
          {quickTypes.length ? (
            <div className="mt-6 flex w-full max-w-2xl flex-wrap justify-center gap-2">
              {quickTypes.map((type) => {
                const Icon = typeIcon(type.name)
                return (
                  <Link
                    key={type.id}
                    to={`/cars?vehicleTypeId=${type.id}`}
                    className="interactive-tile inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    <Icon className="size-4" aria-hidden />
                    {type.name}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Previous banner"
          onClick={() => setSlide((current) => (current - 1 + slideCount) % slideCount)}
          className="absolute top-1/2 left-3 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-200 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:left-6"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next banner"
          onClick={() => setSlide((current) => (current + 1) % slideCount)}
          className="absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-200 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:right-6"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {Array.from({ length: slideCount }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show banner slide ${index + 1}`}
              aria-current={slide === index ? 'true' : undefined}
              onClick={() => setSlide(index)}
              className={`h-1.5 cursor-pointer rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${slide === index ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
      {catalog.data?.makes.length ? (
        <PageSection title="Explore our brands" align="center">
          <div className="flex w-full min-w-0 justify-center gap-4 overflow-x-auto pb-2 sm:flex-wrap">
            {catalog.data.makes.map((make) => (
              <Link
                key={make.id}
                to={`/cars?makeId=${make.id}`}
                className={cn(
                  'flex w-[148px] shrink-0 cursor-pointer flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-6 text-sm font-semibold text-charcoal transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  interactiveTileClass,
                )}
              >
                <BrandLogoMark makeName={make.name} />
                <span className="w-full truncate text-center">{make.name}</span>
              </Link>
            ))}
          </div>
        </PageSection>
      ) : null}

      <PageSection
        title="Explore all cars"
        description="Admin-approved listings you can enquire on today."
        align="center"
        action={<SortPills sort={sort} onSort={setSort} />}
      >
        <ShowcaseRow vehicles={listings.data?.items} loading={listings.isLoading} />
        <div className="mt-6 flex justify-center">
          <Button variant="outline" asChild className={cn('rounded-full', btnLiftClass)}>
            <Link to="/cars">View all cars</Link>
          </Button>
        </div>
      </PageSection>

      <HomeProcessSection />

      <WhyBentoSection />

      <section id="faq" className="scroll-mt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">FAQ</p>
          <h2 className="mt-2 text-2xl font-bold text-charcoal lg:text-3xl">Questions</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">How buying and selling works on Tchadvoiture.</p>
        </div>
        <Accordion type="single" collapsible className={cn('animate-slide-in-up mx-auto mt-8 max-w-3xl rounded-2xl bg-card px-4 ring-1 ring-border/60 sm:px-6', interactiveCardClass)}>
          {faqs.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger className="py-4 text-left text-base hover:no-underline sm:py-5">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      </div>
    </div>
  )
}
