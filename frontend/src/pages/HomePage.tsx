import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, Car, MessageSquare, Search, SearchCheck, Truck, Users, type LucideIcon } from 'lucide-react'
import { CarCard } from '../components/CarCard'
import { PageSection } from '../components/PageSection'
import { Button, Card, CardContent, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/components/ui'
import { api } from '../lib/api'
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
      <section className="hero-gradient rounded-3xl px-6 py-12 text-white shadow-xl ring-1 ring-white/20 sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Used cars</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold sm:text-5xl">Find a car you can enquire about today</h1>
        <p className="mt-3 max-w-xl text-white/90">
          Search approved listings from dealers and individual sellers, then send a private enquiry.
        </p>
        <form
          onSubmit={search}
          className="mt-8 grid grid-cols-1 items-center gap-3 rounded-2xl bg-white p-4 text-charcoal shadow-lg sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]"
        >
          <Input className="h-11 min-w-0 sm:col-span-2 lg:col-span-1" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search make, model, or city" aria-label="Search" />
          <Select value={makeId || '__any__'} onValueChange={(value) => setMakeId(value === '__any__' ? '' : value)}>
            <SelectTrigger className="h-11 w-full min-w-0" aria-label="Brand">
              <SelectValue placeholder="Any brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any brand</SelectItem>
              {catalog.data?.makes?.map((make) => (
                <SelectItem key={make.id} value={make.id}>{make.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input className="h-11 min-w-0" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City" aria-label="City" />
          <Button type="submit" variant="cta" className="h-11 w-full px-4 sm:col-span-2 lg:col-span-1 lg:w-auto">
            <Search className="h-5 w-5" /> Search
          </Button>
        </form>
      </section>

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
