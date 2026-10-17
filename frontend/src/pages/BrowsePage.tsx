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
  X,
} from 'lucide-react'
import { BrowseCarCard } from '../components/BrowseCarCard'
import { Button, Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/components/ui'
import { api } from '../lib/api'
import { useCatalog } from '../lib/hooks'
import { interactiveCardClass } from '@/lib/motion'
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
  const [open, setOpen] = useState(active)
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={cn('group rounded-xl', active && 'bg-primary/5 ring-1 ring-primary/15')}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal transition-colors duration-200 hover:bg-secondary/60 [&::-webkit-details-marker]:hidden">
        <span className={cn('text-muted-foreground', active && 'text-primary')}>{icon}</span>
        <span className="flex-1">{title}</span>
        {active ? <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">On</span> : null}
        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-3 pt-1">{children}</div>
    </details>
  )
}

type FilterChip = { id: string; label: string; clear: () => void }

function FilterChipButton({ chip }: { chip: FilterChip }) {
  return (
    <button
      type="button"
      onClick={chip.clear}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {chip.label}
      <X className="size-3.5" aria-hidden />
    </button>
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
  const hasFilters = [...params.keys()].some((key) => key !== 'page' && key !== 'sort')

  const filterChips = useMemo(() => {
    const chips: FilterChip[] = []
    const q = params.get('q')
    if (q?.trim()) {
      chips.push({ id: 'q', label: `“${q.trim()}”`, clear: () => setParam('q', '') })
    }
    const make = catalog.data?.makes.find((item) => item.id === makeId)
    if (make) {
      chips.push({ id: 'makeId', label: make.name, clear: () => setParam('makeId', '') })
    }
    const modelId = params.get('modelId')
    if (modelId && make) {
      const model = make.models.find((item) => item.id === modelId)
      if (model) chips.push({ id: 'modelId', label: model.name, clear: () => setParam('modelId', '') })
    }
    const typeId = params.get('vehicleTypeId')
    if (typeId) {
      const name = catalog.data?.vehicleTypes.find((item) => item.id === typeId)?.name
      if (name) chips.push({ id: 'vehicleTypeId', label: name, clear: () => setParam('vehicleTypeId', '') })
    }
    const fuelId = params.get('fuelTypeId')
    if (fuelId) {
      const name = catalog.data?.fuels.find((item) => item.id === fuelId)?.name
      if (name) chips.push({ id: 'fuelTypeId', label: name, clear: () => setParam('fuelTypeId', '') })
    }
    const transmissionId = params.get('transmissionId')
    if (transmissionId) {
      const name = catalog.data?.transmissions.find((item) => item.id === transmissionId)?.name
      if (name) chips.push({ id: 'transmissionId', label: name, clear: () => setParam('transmissionId', '') })
    }
    const minPrice = params.get('minPrice') ?? ''
    const maxPrice = params.get('maxPrice') ?? ''
    if (minPrice || maxPrice) {
      const preset = priceRanges.find((item) => item.min === minPrice && item.max === maxPrice)
      chips.push({
        id: 'price',
        label: preset?.label ?? `Price ${minPrice || '0'}–${maxPrice || '∞'}`,
        clear: () => setRange('minPrice', 'maxPrice', '', ''),
      })
    }
    const minKm = params.get('minKm') ?? ''
    const maxKm = params.get('maxKm') ?? ''
    if (minKm || maxKm) {
      const preset = kilometerRanges.find((item) => item.min === minKm && item.max === maxKm)
      chips.push({
        id: 'km',
        label: preset?.label ?? `Km ${minKm || '0'}–${maxKm || '∞'}`,
        clear: () => setRange('minKm', 'maxKm', '', ''),
      })
    }
    const minYear = params.get('minYear') ?? ''
    const maxYear = params.get('maxYear') ?? ''
    if (minYear || maxYear) {
      const preset = yearRanges.find((item) => item.min === minYear && item.max === maxYear)
      chips.push({
        id: 'year',
        label: preset?.label ?? `Year ${minYear || '…'}–${maxYear || '…'}`,
        clear: () => setRange('minYear', 'maxYear', '', ''),
      })
    }
    const location = params.get('location')
    if (location?.trim()) {
      chips.push({ id: 'location', label: location.trim(), clear: () => setParam('location', '') })
    }
    const condition = params.get('condition')
    if (condition) chips.push({ id: 'condition', label: condition, clear: () => setParam('condition', '') })
    const sellerType = params.get('sellerType')
    if (sellerType) {
      chips.push({
        id: 'sellerType',
        label: sellerType === 'dealer' ? 'Dealer' : 'Individual',
        clear: () => setParam('sellerType', ''),
      })
    }
    const owners = params.get('owners')
    if (owners) chips.push({ id: 'owners', label: `${owners} owner${owners === '1' ? '' : 's'}`, clear: () => setParam('owners', '') })
    const color = params.get('color')
    if (color?.trim()) chips.push({ id: 'color', label: color.trim(), clear: () => setParam('color', '') })
    return chips
  }, [params, catalog.data, makeId])

  function renderFilters() {
    return (
    <div className="space-y-2">
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
          options={catalog.data?.vehicleTypes?.map((item) => ({ value: item.id, label: item.name })) ?? []}
        />
      </FilterSection>
      <FilterSection title="Brand" icon={<Tag className="size-4" />} active={Boolean(makeId || params.get('modelId'))}>
        <OptionList
          value={makeId}
          onChange={(value) => setParam('makeId', value)}
          options={catalog.data?.makes?.map((make) => ({ value: make.id, label: make.name })) ?? []}
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
          options={catalog.data?.fuels?.map((item) => ({ value: item.id, label: item.name })) ?? []}
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
          options={catalog.data?.transmissions?.map((item) => ({ value: item.id, label: item.name })) ?? []}
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
          options={catalog.data?.conditions?.map((condition) => ({ value: condition, label: condition })) ?? []}
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
        <Button variant="link" type="button" className="mt-2 h-11 w-full justify-start rounded-lg px-3 text-primary hover:bg-primary/5" onClick={() => setParams(new URLSearchParams())}>
          Clear all filters
        </Button>
      ) : null}
    </div>
    )
  }

  const totalLabel = listings.data ? `${listings.data.total} approved car${listings.data.total === 1 ? '' : 's'}` : 'Approved listings'

  return (
    <div className="-mx-4 flex min-h-0 flex-1 flex-col bg-secondary/30 px-4 lg:-mx-0 lg:flex lg:h-full lg:min-h-0 lg:px-0 lg:bg-transparent">
      <header className="shrink-0 pb-2 lg:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">Cars for sale</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{totalLabel}</p>
      </header>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_1fr] lg:overflow-hidden">
        <aside className="hidden min-h-0 lg:block lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          <div className={cn('sticky top-0 rounded-2xl bg-card p-4 ring-1 ring-border/60', interactiveCardClass)}>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
              <SlidersHorizontal className="size-4 text-primary" aria-hidden />
              Filters
            </p>
            {renderFilters()}
          </div>
        </aside>
        <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
          <div
            data-scroll-root
            className={cn(
              'min-h-0 flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1',
              compareIds.length ? 'pb-24' : 'lg:pb-4',
            )}
          >
            <div className={cn('sticky top-16 z-20 shrink-0 rounded-2xl bg-card p-3 ring-1 ring-border/60 backdrop-blur-sm lg:top-0 lg:mb-1', interactiveCardClass)}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="hidden min-w-0 shrink-0 lg:block lg:pr-4">
                  <h1 className="text-xl font-bold tracking-tight text-charcoal">Cars for sale</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">{totalLabel}</p>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:max-w-2xl lg:flex-initial lg:justify-end">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-11 rounded-full border-border bg-secondary/40 pl-11 pr-4"
                      value={params.get('q') ?? ''}
                      placeholder="Search make, model, or city"
                      aria-label="Search cars"
                      onChange={(event) => setParam('q', event.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-11 shrink-0 rounded-full lg:hidden"
                      type="button"
                      onClick={() => setShowFilters((value) => !value)}
                      aria-expanded={showFilters}
                    >
                      <SlidersHorizontal className="size-4" /> Filters
                    </Button>
                    <Select value={params.get('sort') ?? 'newest'} onValueChange={(value) => setParam('sort', value === 'newest' ? '' : value)}>
                      <SelectTrigger className="h-11 w-full min-w-[11rem] rounded-full border-border bg-secondary/40 px-4 data-[size=default]:h-11 sm:w-auto" aria-label="Sort">
                        <ArrowUpDown className="size-4 shrink-0 text-primary" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sorts.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {filterChips.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {filterChips.map((chip) => (
                    <FilterChipButton key={chip.id} chip={chip} />
                  ))}
                  <button
                    type="button"
                    onClick={() => setParams(new URLSearchParams())}
                    className="shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
            </div>
            {showFilters ? (
              <div className={cn('mt-3 max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl bg-card p-4 ring-1 ring-border lg:hidden', interactiveCardClass)}>
                {renderFilters()}
              </div>
            ) : null}
            <div className="pt-4">
          {listings.isLoading ? (
            <div className="space-y-5">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
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
            <div className="rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-border">
              <p className="text-muted-foreground">No cars match these filters.</p>
              {hasFilters ? (
                <Button type="button" className="mt-4 cursor-pointer rounded-full" onClick={() => setParams(new URLSearchParams())}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-5">
            {listings.data?.items?.map((vehicle) => <BrowseCarCard key={vehicle.id} vehicle={vehicle} />)}
          </div>
          {listings.data && listings.data.pages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" className="h-11 rounded-full" disabled={page <= 1} type="button" onClick={() => setParam('page', String(page - 1))}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {listings.data.pages}</span>
              <Button variant="outline" className="h-11 rounded-full" disabled={page >= listings.data.pages} type="button" onClick={() => setParam('page', String(page + 1))}>Next</Button>
            </div>
          ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
