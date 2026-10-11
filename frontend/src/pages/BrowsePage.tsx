import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpDown,
  BadgeCheck,
  Calendar,
  Car,
  ChevronDown,
  CircleDollarSign,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Search,
  SlidersHorizontal,
  Tag,
  User,
  Users,
  Settings2,
} from 'lucide-react'
import { BrowseCarCard } from '../components/BrowseCarCard'
import { Button, Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/components/ui'
import { api } from '../lib/api'
import { useCatalog } from '../lib/hooks'
import { cn } from '@/lib/utils'
import { useCompareIds } from '../lib/compare'
import type { Paged, Vehicle } from '../lib/types'

const sorts = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['km_asc', 'Lowest kilometers'],
  ['year_desc', 'Newest year'],
]

const INTRO = 'Approved cars from dealers and private sellers across Chad. Compare compact cars for city driving, family SUVs, and pickups for longer trips, with price, mileage, and condition listed up front.'
const INTRO_MORE = ' Every listing is reviewed before it appears here. Seller phone numbers stay private until you send an enquiry.'

const priceRanges = [
  { label: 'Under 4,000,000', min: '', max: '4000000' },
  { label: '4,000,000 – 6,000,000', min: '4000000', max: '6000000' },
  { label: '6,000,000 – 8,000,000', min: '6000000', max: '8000000' },
  { label: 'Above 8,000,000', min: '8000000', max: '' },
]

const kilometerRanges = [
  { label: 'Under 30,000', min: '', max: '30000' },
  { label: '30,000 – 60,000', min: '30000', max: '60000' },
  { label: '60,000 – 100,000', min: '60000', max: '100000' },
  { label: 'Above 100,000', min: '100000', max: '' },
]

const yearRanges = [
  { label: '2020 and newer', min: '2020', max: '' },
  { label: '2016 – 2019', min: '2016', max: '2019' },
  { label: '2012 – 2015', min: '2012', max: '2015' },
  { label: 'Before 2012', min: '', max: '2011' },
]

function FilterSection({
  title,
  icon,
  active,
  children,
}: {
  title: string
  icon: ReactNode
  active?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group border-b border-border"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 py-3 text-sm font-medium text-charcoal [&::-webkit-details-marker]:hidden">
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1">{title}</span>
        {active ? <span className="size-1.5 rounded-full bg-primary" aria-hidden /> : null}
        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  )
}

function CheckRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="after:hidden"
      />
      <span
        className="flex-1 py-2"
        onClick={(event) => {
          event.preventDefault()
          onCheckedChange(!checked)
        }}
      >
        {label}
      </span>
    </label>
  )
}

function OptionList({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  if (!options.length) return <p className="text-sm text-muted-foreground">No options yet.</p>
  return (
    <div className="grid">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <CheckRow
            key={option.value}
            label={option.label}
            checked={selected}
            onCheckedChange={(checked) => onChange(checked ? option.value : '')}
          />
        )
      })}
    </div>
  )
}

function RangeChecks({
  presets,
  minValue,
  maxValue,
  onChange,
}: {
  presets: { label: string; min: string; max: string }[]
  minValue: string
  maxValue: string
  onChange: (min: string, max: string) => void
}) {
  return (
    <div className="grid">
      {presets.map((preset) => {
        const selected = minValue === preset.min && maxValue === preset.max
        return (
          <CheckRow
            key={preset.label}
            label={preset.label}
            checked={selected}
            onCheckedChange={(checked) => onChange(checked ? preset.min : '', checked ? preset.max : '')}
          />
        )
      })}
    </div>
  )
}

export function BrowsePage() {
  const catalog = useCatalog()
  const [params, setParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [more, setMore] = useState(false)
  const compareIds = useCompareIds()
  const query = params.toString()
  const listings = useQuery({
    queryKey: ['vehicles', query],
    queryFn: () => api<Paged<Vehicle>>(`/api/vehicles?${query}`),
  })

  const makeId = params.get('makeId') ?? ''
  const models = useMemo(
    () => catalog.data?.makes.find((make) => make.id === makeId)?.models ?? [],
    [catalog.data, makeId],
  )

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'makeId') next.delete('modelId')
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  function setRange(minKey: string, maxKey: string, min: string, max: string) {
    const next = new URLSearchParams(params)
    if (min) next.set(minKey, min)
    else next.delete(minKey)
    if (max) next.set(maxKey, max)
    else next.delete(maxKey)
    next.delete('page')
    setParams(next)
  }

  const page = Number(params.get('page') || 1)
  const hasFilters = [...params.keys()].some((key) => key !== 'page')

  function renderFilters() {
    return (
    <div>
      <FilterSection title="Price" icon={<CircleDollarSign className="size-4" />} active={Boolean(params.get('minPrice') || params.get('maxPrice'))}>
        <RangeChecks
          presets={priceRanges}
          minValue={params.get('minPrice') ?? ''}
          maxValue={params.get('maxPrice') ?? ''}
          onChange={(min, max) => setRange('minPrice', 'maxPrice', min, max)}
        />
      </FilterSection>
      <FilterSection title="Body type" icon={<Car className="size-4" />} active={Boolean(params.get('vehicleTypeId'))}>
        <OptionList
          value={params.get('vehicleTypeId') ?? ''}
          onChange={(value) => setParam('vehicleTypeId', value)}
          options={catalog.data?.vehicleTypes.map((item) => ({ value: item.id, label: item.name })) ?? []}
        />
      </FilterSection>
      <FilterSection title="Brand" icon={<Tag className="size-4" />} active={Boolean(makeId || params.get('modelId'))}>
        <OptionList
          value={makeId}
          onChange={(value) => setParam('makeId', value)}
          options={catalog.data?.makes.map((make) => ({ value: make.id, label: make.name })) ?? []}
        />
        {makeId ? (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Model</p>
            <OptionList
              value={params.get('modelId') ?? ''}
              onChange={(value) => setParam('modelId', value)}
              options={models.map((model) => ({ value: model.id, label: model.name }))}
            />
          </div>
        ) : null}
      </FilterSection>
      <FilterSection title="Fuel" icon={<Fuel className="size-4" />} active={Boolean(params.get('fuelTypeId'))}>
        <OptionList
          value={params.get('fuelTypeId') ?? ''}
          onChange={(value) => setParam('fuelTypeId', value)}
          options={catalog.data?.fuels.map((item) => ({ value: item.id, label: item.name })) ?? []}
        />
      </FilterSection>
      <FilterSection title="Mileage" icon={<Gauge className="size-4" />} active={Boolean(params.get('minKm') || params.get('maxKm'))}>
        <RangeChecks
          presets={kilometerRanges}
          minValue={params.get('minKm') ?? ''}
          maxValue={params.get('maxKm') ?? ''}
          onChange={(min, max) => setRange('minKm', 'maxKm', min, max)}
        />
      </FilterSection>
      <FilterSection title="Transmission" icon={<Settings2 className="size-4" />} active={Boolean(params.get('transmissionId'))}>
        <OptionList
          value={params.get('transmissionId') ?? ''}
          onChange={(value) => setParam('transmissionId', value)}
          options={catalog.data?.transmissions.map((item) => ({ value: item.id, label: item.name })) ?? []}
        />
      </FilterSection>
      <FilterSection title="Year" icon={<Calendar className="size-4" />} active={Boolean(params.get('minYear') || params.get('maxYear'))}>
        <RangeChecks
          presets={yearRanges}
          minValue={params.get('minYear') ?? ''}
          maxValue={params.get('maxYear') ?? ''}
          onChange={(min, max) => setRange('minYear', 'maxYear', min, max)}
        />
      </FilterSection>
      <FilterSection title="Location" icon={<MapPin className="size-4" />} active={Boolean(params.get('location'))}>
        <Input
          className="h-10"
          value={params.get('location') ?? ''}
          placeholder="City"
          aria-label="Location"
          onChange={(event) => setParam('location', event.target.value)}
        />
      </FilterSection>
      <FilterSection title="Condition" icon={<BadgeCheck className="size-4" />} active={Boolean(params.get('condition'))}>
        <OptionList
          value={params.get('condition') ?? ''}
          onChange={(value) => setParam('condition', value)}
          options={catalog.data?.conditions.map((condition) => ({ value: condition, label: condition })) ?? []}
        />
      </FilterSection>
      <FilterSection title="Seller type" icon={<User className="size-4" />} active={Boolean(params.get('sellerType'))}>
        <OptionList
          value={params.get('sellerType') ?? ''}
          onChange={(value) => setParam('sellerType', value)}
          options={[
            { value: 'individual', label: 'Individual seller' },
            { value: 'dealer', label: 'Dealer' },
          ]}
        />
      </FilterSection>
      <FilterSection title="Owners" icon={<Users className="size-4" />} active={Boolean(params.get('owners'))}>
        <OptionList
          value={params.get('owners') ?? ''}
          onChange={(value) => setParam('owners', value)}
          options={[1, 2, 3, 4, 5].map((count) => ({ value: String(count), label: String(count) }))}
        />
      </FilterSection>
      <FilterSection title="Color" icon={<Palette className="size-4" />} active={Boolean(params.get('color'))}>
        <Input
          className="h-10"
          value={params.get('color') ?? ''}
          aria-label="Color"
          onChange={(event) => setParam('color', event.target.value)}
        />
      </FilterSection>
      {hasFilters ? (
        <Button variant="link" type="button" className="mt-2 h-11 justify-start px-0" onClick={() => setParams(new URLSearchParams())}>
          Clear filters
        </Button>
      ) : null}
    </div>
    )
  }

  return (
    <div className="lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <header className="max-w-3xl shrink-0">
        <h1 className="text-3xl font-bold text-charcoal">Cars for sale</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {INTRO}
          {more ? INTRO_MORE : null}
          {' '}
          <button
            type="button"
            className="cursor-pointer font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={more}
            onClick={() => setMore((value) => !value)}
          >
            {more ? 'less' : 'more'}
          </button>
        </p>
      </header>
      <div className="mt-6 grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[240px_1fr] lg:overflow-hidden">
        <aside className="hidden min-h-0 overflow-y-auto overscroll-contain lg:block">{renderFilters()}</aside>
        <section className="lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-11 lg:hidden" type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters}>
                <SlidersHorizontal className="size-4" /> Filters
              </Button>
              <Select value={params.get('sort') ?? 'newest'} onValueChange={(value) => setParam('sort', value)}>
                <SelectTrigger className="h-11 rounded-full px-4 data-[size=default]:h-11" aria-label="Sort">
                  <ArrowUpDown className="size-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sorts.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="relative sm:ml-auto sm:w-72">
              <Input
                className="h-11 rounded-full pr-10 pl-4"
                value={params.get('q') ?? ''}
                placeholder="Search cars"
                aria-label="Search cars"
                onChange={(event) => setParam('q', event.target.value)}
              />
              <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <p className="mb-3 shrink-0 text-sm text-muted-foreground">{listings.data ? `${listings.data.total} cars` : 'Approved listings'}</p>
          {showFilters ? <div className="mb-4 rounded-xl border border-border bg-card px-4 lg:hidden">{renderFilters()}</div> : null}
          <div className={cn('lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1', compareIds.length ? 'pb-24' : 'lg:pb-4')}>
          {listings.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <Skeleton className="aspect-[16/10] w-full shrink-0 rounded-xl md:w-72" />
                    <div className="flex flex-1 flex-col gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="mt-auto h-11 w-40 self-end" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {listings.data && listings.data.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">No cars match these filters.</p>
          ) : null}
          <div className="space-y-4">
            {listings.data?.items.map((vehicle) => <BrowseCarCard key={vehicle.id} vehicle={vehicle} />)}
          </div>
          {listings.data && listings.data.pages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" className="h-11" disabled={page <= 1} type="button" onClick={() => setParam('page', String(page - 1))}>Previous</Button>
              <span className="text-sm">Page {page} of {listings.data.pages}</span>
              <Button variant="outline" className="h-11" disabled={page >= listings.data.pages} type="button" onClick={() => setParam('page', String(page + 1))}>Next</Button>
            </div>
          ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
