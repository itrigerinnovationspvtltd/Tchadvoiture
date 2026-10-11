import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, Car, ChevronLeft, ChevronRight, MessageSquare, Search, SearchCheck, Truck, Users, type LucideIcon } from 'lucide-react'
import { CarCard } from '../components/CarCard'
import { PageSection } from '../components/PageSection'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Card, CardContent, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/components/ui'
import { api, assetUrl } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useCatalog } from '../lib/hooks'
import type { Paged, Vehicle } from '../lib/types'

const steps = [
  { icon: Search, title: 'Search approved cars', text: 'Filter by brand, city, price, and type.' },
  { icon: MessageSquare, title: 'Send an enquiry', text: 'The seller’s phone stays off the public page.' },
  { icon: SearchCheck, title: 'The seller replies', text: 'They see your name and phone and answer in Enquiries.' },
]

const trust = [
  {
    icon: BadgeCheck,
    title: 'Approved listings',
    text: 'Every car is reviewed by an admin before it appears in search.',
  },
  {
    icon: MessageSquare,
    title: 'Private seller contact',
    text: 'Send an enquiry. The seller’s phone stays off the public page.',
  },
  {
    icon: Users,
    title: 'Dealers and individuals',
    text: 'Buy from a dealership or a private owner, with the seller type shown.',
  },
]

const faqs = [
  {
    question: 'When does my listing appear in search?',
    answer: 'A new listing stays pending until an admin approves it. Until then it is not public, and My listings shows that it is waiting for approval.',
  },
  {
    question: 'How do I contact a seller?',
    answer: 'Open the car and send an enquiry. The seller’s phone stays off the public page. They see your name and phone and reply in Enquiries.',
  },
  {
    question: 'How many cars can I list?',
    answer: 'Individual sellers have a limit on pending and active cars. That limit is shown when you list a car. Dealers are not limited.',
  },
  {
    question: 'What if my listing is rejected or I take it down?',
    answer: 'You can resubmit a rejected or inactive listing. An active listing can be deactivated or marked sold from My listings.',
  },
  {
    question: 'Who can see my plate and insurance numbers?',
    answer: 'They stay private. Buyers do not see them on the car page. Only you and an admin can.',
  },
]

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
  const { user } = useAuth()
  const catalog = useCatalog()
  const [q, setQ] = useState('')
  const [makeId, setMakeId] = useState('')
  const [location, setLocation] = useState('')
  const [sort, setSort] = useState<'newest' | 'price_asc'>('newest')
  const [pickedTypeId, setPickedTypeId] = useState('')
  const [slide, setSlide] = useState(0)
  const [brokenPhotos, setBrokenPhotos] = useState<string[]>([])
  const types = catalog.data?.vehicleTypes ?? []
  const selectedType = types.find((type) => type.id === pickedTypeId) ?? types[0]
  const listings = useQuery({
    queryKey: ['vehicles', 'featured', sort],
    queryFn: () => api<Paged<Vehicle>>(`/api/vehicles?limit=8&sort=${sort}`),
  })
  const typed = useQuery({
    queryKey: ['vehicles', 'type', selectedType?.id],
    enabled: Boolean(selectedType?.id),
    queryFn: () => api<Paged<Vehicle>>(`/api/vehicles?limit=4&vehicleTypeId=${selectedType?.id}`),
  })
  const sellHref = user && user.role !== 'buyer' ? '/my-listings/new' : '/signup'
  const featured = listings.data?.items ?? []
  const photoUrls = featured.flatMap((vehicle) => (vehicle.images[0]?.url ? [vehicle.images[0].url] : []))
  const usablePhotos = photoUrls.filter((url) => !brokenPhotos.includes(url))
  const buyPhoto = usablePhotos[0]
  const sellPhoto = usablePhotos[1]
  const benefitPhotos = photoUrls
  const filters = [
    { label: 'Under 5,000,000', to: '/cars?maxPrice=5000000' },
    { label: 'Under 10,000,000', to: '/cars?maxPrice=10000000' },
    ...(catalog.data?.makes ?? []).map((make) => ({ label: make.name, to: `/cars?makeId=${make.id}` })),
    { label: '2024 and newer', to: '/cars?minYear=2024' },
    { label: '2022 and newer', to: '/cars?minYear=2022' },
    { label: '2020 and newer', to: '/cars?minYear=2020' },
    ...(catalog.data?.fuels ?? []).map((fuel) => ({ label: fuel.name, to: `/cars?fuelTypeId=${fuel.id}` })),
    { label: 'Under 50,000 km', to: '/cars?maxKm=50000' },
    { label: 'Under 100,000 km', to: '/cars?maxKm=100000' },
    ...(catalog.data?.vehicleTypes ?? []).map((type) => ({ label: type.name, to: `/cars?vehicleTypeId=${type.id}` })),
    ...(catalog.data?.transmissions ?? []).map((item) => ({ label: item.name, to: `/cars?transmissionId=${item.id}` })),
  ]
  const benefits = [
    { title: trust[0].title, text: trust[0].text, href: '/cars', photo: benefitPhotos[2] ?? benefitPhotos[0] },
    { title: trust[1].title, text: trust[1].text, href: '/cars', photo: benefitPhotos[3] ?? benefitPhotos[1] },
    { title: trust[2].title, text: trust[2].text, href: sellHref, photo: benefitPhotos[4] ?? benefitPhotos[0] },
  ]

  useEffect(() => {
    if (window.location.hash !== '#faq') return
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % 2), 5000)
    return () => window.clearInterval(timer)
  }, [])

  function search(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (makeId) params.set('makeId', makeId)
    if (location.trim()) params.set('location', location.trim())
    navigate(`/cars?${params.toString()}`)
  }

  const brandAction = (
    <Link to="/cars" className="cursor-pointer text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover">
      View all
    </Link>
  )

  return (
    <div className="space-y-16">
      <div>
        <nav aria-label="Explore by" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {filters.map((filter) => (
            <Link
              key={`${filter.label}-${filter.to}`}
              to={filter.to}
              className="shrink-0 cursor-pointer rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-charcoal transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {filter.label}
            </Link>
          ))}
        </nav>

        <div className="relative">
          <section className="hero-gradient relative -mx-4 h-[420px] overflow-hidden text-white" aria-roledescription="carousel" aria-label="Highlights">
            {slide === 0 && buyPhoto ? (
              <img src={assetUrl(buyPhoto)} alt="" className="absolute inset-0 size-full object-cover" onError={() => setBrokenPhotos((current) => current.includes(buyPhoto) ? current : [...current, buyPhoto])} />
            ) : null}
            {slide === 1 && sellPhoto ? (
              <img src={assetUrl(sellPhoto)} alt="" className="absolute inset-0 size-full object-cover" onError={() => setBrokenPhotos((current) => current.includes(sellPhoto) ? current : [...current, sellPhoto])} />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/45 to-charcoal/10" />
            {slide === 1 && !sellPhoto ? (
              <div className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-center">
                <span className="flex size-40 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                  <Car className="size-20" aria-hidden />
                </span>
              </div>
            ) : null}
            <div className="relative flex h-full flex-col justify-start px-16 pt-10 sm:px-20 sm:pt-14">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">{slide === 0 ? 'Buy' : 'Sell'}</p>
              <h1 className="mt-2 max-w-xl text-4xl font-bold sm:text-5xl">
                {slide === 0 ? 'Approved cars, ready to enquire.' : 'List your car. It goes live after approval.'}
              </h1>
              <Button asChild className="mt-6 h-11 w-fit cursor-pointer bg-white text-primary hover:bg-white/90">
                <Link to={slide === 0 ? '/cars' : sellHref}>{slide === 0 ? 'Browse cars' : user && user.role !== 'buyer' ? 'List a car' : 'Create an account'}</Link>
              </Button>
            </div>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() => setSlide((current) => (current + 1) % 2)}
              className="absolute top-1/3 left-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-200 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={() => setSlide((current) => (current + 1) % 2)}
              className="absolute top-1/3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-200 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <div className="absolute bottom-28 left-1/2 flex -translate-x-1/2 gap-2">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={index === 0 ? 'Show buy banner' : 'Show sell banner'}
                  aria-current={slide === index ? 'true' : undefined}
                  onClick={() => setSlide(index)}
                  className={`size-2.5 cursor-pointer rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${slide === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </section>

          <div className="relative z-10 -mt-20 px-2 sm:px-4">
            <div className="rounded-2xl bg-card p-4 shadow-lg ring-1 ring-border sm:p-6">
              <div className="flex justify-center gap-2">
                <Button asChild className="h-11 cursor-pointer rounded-full px-6">
                  <Link to="/cars">Buy car</Link>
                </Button>
                <Button asChild variant="outline" className="h-11 cursor-pointer rounded-full bg-secondary px-6">
                  <Link to={sellHref}>Sell car</Link>
                </Button>
              </div>
              <form
                onSubmit={search}
                className="mt-4 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]"
              >
                <Input className="h-11 w-full min-w-0 text-sm sm:col-span-2 lg:col-span-1" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search make, model, or city" aria-label="Search" />
                <Select value={makeId || '__any__'} onValueChange={(value) => setMakeId(value === '__any__' ? '' : value)}>
                  <SelectTrigger className="h-11 w-full min-w-0 text-sm data-[size=default]:h-11" aria-label="Brand">
                    <SelectValue placeholder="Any brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any brand</SelectItem>
                    {catalog.data?.makes?.map((make) => (
                      <SelectItem key={make.id} value={make.id}>{make.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="h-11 w-full min-w-0 text-sm" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City" aria-label="City" />
                <Button type="submit" variant="cta" className="h-11 w-full cursor-pointer px-5 text-sm sm:col-span-2 lg:col-span-1 lg:w-full">
                  <Search className="size-4" /> Search
                </Button>
              </form>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {benefits.map((item) => (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="cursor-pointer overflow-hidden rounded-xl border border-border transition-colors duration-200 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {item.photo ? (
                      <img src={assetUrl(item.photo)} alt="" className="aspect-[16/10] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center bg-muted text-muted-foreground">
                        <Car className="size-8" aria-hidden />
                      </div>
                    )}
                    <div className="p-3">
                      <h2 className="font-semibold text-charcoal">{item.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {catalog.data?.makes.length ? (
        <PageSection title="Browse by brand" action={brandAction}>
          <div className="flex w-full min-w-0 gap-3 overflow-x-auto pb-1">
            {catalog.data.makes.map((make) => (
              <Link
                key={make.id}
                to={`/cars?makeId=${make.id}`}
                className="flex w-[104px] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-sm font-medium text-charcoal shadow-sm transition-colors duration-200 hover:border-primary hover:text-primary"
              >
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  <Car className="absolute h-6 w-6 text-primary/15" aria-hidden="true" />
                  <span className="relative">{make.name.slice(0, 1)}</span>
                </span>
                <span className="w-full truncate text-center">{make.name}</span>
              </Link>
            ))}
          </div>
        </PageSection>
      ) : null}

      <PageSection
        title="Featured cars"
        description="Admin-approved listings you can enquire on today."
        action={<SortPills sort={sort} onSort={setSort} />}
      >
        <ShowcaseRow vehicles={listings.data?.items} loading={listings.isLoading} />
        <div className="mt-6 flex justify-center">
          <Button variant="outline" asChild className="rounded-full">
            <Link to="/cars">View all cars</Link>
          </Button>
        </div>
      </PageSection>

      {types.length ? (
        <PageSection title="Explore by type" description="Pick a body style to see matching listings.">
          <div className="flex w-full min-w-0 justify-center gap-2 overflow-x-auto rounded-2xl bg-secondary/60 p-3 pb-2">
            {types.map((type) => {
              const Icon = typeIcon(type.name)
              const selected = type.id === selectedType?.id
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setPickedTypeId(type.id)}
                  className={`flex min-w-20 cursor-pointer flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors duration-200 ${selected ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-card hover:text-primary'}`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                  {type.name}
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            <ShowcaseRow vehicles={typed.data?.items} loading={typed.isLoading} />
          </div>
          {selectedType ? (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" asChild className="rounded-full">
                <Link to={`/cars?vehicleTypeId=${selectedType.id}`}>View all {selectedType.name}</Link>
              </Button>
            </div>
          ) : null}
        </PageSection>
      ) : null}

      <PageSection title="How it works" align="center" className="space-y-10">
        <ol className="grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">Step {index + 1}</p>
              <h3 className="mt-1 font-semibold text-charcoal">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </PageSection>

      <section className="section-tint rounded-3xl px-5 py-8 sm:px-8">
        <PageSection as="div" title="Why Tchadvoiture">
          <div className="grid gap-4 sm:grid-cols-3">
            {trust.map((item) => (
              <Card key={item.title} className="shadow-sm ring-1 ring-border/60">
                <CardContent>
                  <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-charcoal">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageSection>
      </section>

      <PageSection id="faq" title="Questions" description="How buying and selling works on Tchadvoiture." align="center">
        <Accordion type="single" collapsible className="mx-auto max-w-3xl rounded-2xl border border-border bg-card px-4 sm:px-6">
          {faqs.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </PageSection>

      <section className="hero-gradient flex flex-col gap-4 rounded-3xl px-6 py-10 text-white shadow-lg ring-1 ring-white/20 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <h2 className="text-3xl font-bold">Sell your car</h2>
          <p className="mt-2 max-w-xl text-white/90">
            List it as an individual or a dealer. It goes live after an admin approves it.
          </p>
        </div>
        <Button asChild variant="secondary" className="h-11 bg-white text-primary hover:bg-white/90">
          <Link to={sellHref}>{user && user.role !== 'buyer' ? 'List a car' : 'Create an account'}</Link>
        </Button>
      </section>
    </div>
  )
}
