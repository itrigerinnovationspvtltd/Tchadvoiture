import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { PageLoadingSkeleton } from '../components/PageLoadingSkeleton'
import { Alert, AlertDescription, Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { VehiclePhoto } from '@/components/VehiclePhoto'
import { interactiveCardClass } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, formatKm, formatPrice } from '../lib/format'
import { useSettings } from '../lib/hooks'
import type { Vehicle } from '../lib/types'

type Row = { label: string; value: string }
type Group = { id: string; title: string; rows: Row[] }

function insuranceValue(vehicle: Vehicle) {
  if (!vehicle.insured) return 'No'
  return vehicle.insuranceExpiry ? `Yes, until ${vehicle.insuranceExpiry}` : 'Yes'
}

function specGroups(vehicle: Vehicle, currency?: string): Group[] {
  const groups: Group[] = [
    {
      id: 'listing',
      title: 'Listing',
      rows: [
        { label: 'Price', value: formatPrice(vehicle.price, currency) },
        { label: 'Location', value: vehicle.location || '—' },
        { label: 'Year', value: String(vehicle.manufacturingYear) },
        { label: 'Color', value: vehicle.color || '—' },
        { label: 'Condition', value: vehicle.condition || '—' },
      ],
    },
    {
      id: 'engine',
      title: 'Engine and transmission',
      rows: [
        { label: 'Fuel', value: vehicle.fuelName || '—' },
        { label: 'Transmission', value: vehicle.transmissionName || '—' },
      ],
    },
    {
      id: 'ownership',
      title: 'Ownership',
      rows: [
        { label: 'Kilometers', value: formatKm(vehicle.kilometers) },
        { label: 'Owners', value: vehicle.owners === 1 ? '1 owner' : `${vehicle.owners} owners` },
        { label: 'Registration year', value: vehicle.registrationYear ? String(vehicle.registrationYear) : '—' },
        { label: 'Insurance', value: insuranceValue(vehicle) },
      ],
    },
    {
      id: 'body',
      title: 'Body',
      rows: [{ label: 'Vehicle type', value: vehicle.vehicleTypeName || '—' }],
    },
  ]

  const extra = vehicle.specs.filter((spec) => spec.label && spec.value)
  if (extra.length) {
    groups.push({
      id: 'additional',
      title: 'Additional details',
      rows: extra.map((spec) => ({ label: spec.label, value: spec.value })),
    })
  }

  return groups
}

function matches(row: Row, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return row.label.toLowerCase().includes(needle) || row.value.toLowerCase().includes(needle)
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-secondary/50 px-3 py-2">
      <p className="truncate text-sm font-semibold text-charcoal">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function SpecRows({ rows }: { rows: Row[] }) {
  return (
    <dl className="overflow-hidden rounded-xl bg-secondary/30 ring-1 ring-border/60">
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className={cn(
            'flex flex-col gap-0.5 border-b border-border/60 px-4 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between',
            index % 2 === 1 && 'bg-card/50',
          )}
        >
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="text-sm font-semibold text-charcoal sm:text-right">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function GroupNavButton({
  title,
  selected,
  onClick,
  className,
}: {
  title: string
  selected: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        'shrink-0 cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-200 hover:bg-secondary/60',
        selected && 'bg-primary/10 font-medium text-primary ring-1 ring-primary/15',
        className,
      )}
      aria-current={selected ? 'true' : undefined}
      onClick={onClick}
    >
      {title}
    </button>
  )
}

export function VehicleSpecsPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const settings = useSettings()
  const [tab, setTab] = useState('specifications')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('listing')

  const listing = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, { auth: Boolean(user) }),
  })
  const vehicle = listing.data?.vehicle

  const groups = useMemo(
    () => (vehicle ? specGroups(vehicle, settings.data?.currencyLabel) : []),
    [vehicle, settings.data?.currencyLabel],
  )
  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({ ...group, rows: group.rows.filter((row) => matches(row, query)) }))
        .filter((group) => group.rows.length > 0),
    [groups, query],
  )
  // Features tab lists seller-entered specs; Specifications may also include them under "Additional details".
  const features = (vehicle?.specs ?? []).filter((spec) => spec.label && spec.value && matches(spec, query))
  const heading = vehicle ? [vehicle.modelName, vehicle.variant].filter(Boolean).join(' ') || vehicle.title : ''

  const activeGroup = visibleGroups.find((group) => group.id === active) ?? visibleGroups[0]

  useEffect(() => {
    if (visibleGroups.length === 0) return
    if (!visibleGroups.some((group) => group.id === active)) {
      setActive(visibleGroups[0].id)
    }
  }, [visibleGroups, active])

  if (listing.isLoading) return <PageLoadingSkeleton variant="vehicle" />
  if (!vehicle) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(listing.error) || 'Listing not found.'}</AlertDescription>
        </Alert>
        <Button variant="outline" className="rounded-full" asChild>
          <Link to="/cars">Browse all cars</Link>
        </Button>
      </div>
    )
  }

  const image = vehicle.images[0]?.url
  const subtitle = [vehicle.makeName, vehicle.vehicleTypeName].filter(Boolean).join(' · ')
  const highlightStats = [
    { value: String(vehicle.manufacturingYear), label: 'Year' },
    { value: formatKm(vehicle.kilometers), label: 'Kilometers' },
    { value: vehicle.fuelName || '—', label: 'Fuel' },
    { value: vehicle.transmissionName || '—', label: 'Transmission' },
    { value: vehicle.vehicleTypeName || '—', label: 'Body type' },
    { value: vehicle.owners === 1 ? '1 owner' : `${vehicle.owners} owners`, label: 'Owners' },
  ]

  return (
    <div className="space-y-6">
      <section className={cn('rounded-2xl bg-card p-4 ring-1 ring-border/60 sm:p-6', interactiveCardClass)}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="w-full shrink-0 overflow-hidden rounded-xl ring-1 ring-border/60 md:w-80 lg:w-96">
            <VehiclePhoto src={image} alt={vehicle.title} className="rounded-none" fit="cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{vehicle.makeName}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">{heading}</h1>
            {vehicle.variant ? <p className="mt-1 text-sm text-muted-foreground">{vehicle.variant}</p> : null}
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            <p className="mt-4 text-2xl font-bold text-primary">{formatPrice(vehicle.price, settings.data?.currencyLabel)}</p>
            <p className="text-sm text-muted-foreground">{vehicle.location}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {highlightStats.map((stat) => (
                <StatTile key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button variant="outline" className="h-11 rounded-full" asChild>
                <Link to={`/cars/${vehicle.id}`}>Back to listing</Link>
              </Button>
              <Button className="h-11 rounded-full" asChild>
                <Link to={`/cars/${vehicle.id}#enquiry`}>Send enquiry</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className={cn('overflow-hidden rounded-2xl bg-card ring-1 ring-border/60', interactiveCardClass)} aria-labelledby="specs-workspace-heading">
        <h2 id="specs-workspace-heading" className="sr-only">
          Specifications and features
        </h2>
        <Tabs value={tab} onValueChange={setTab} className="w-full flex-col gap-0">
          <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-11 bg-secondary/40 p-1">
              <TabsTrigger
                value="specifications"
                className="h-9 cursor-pointer rounded-full px-4 data-active:bg-primary data-active:text-white"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="h-9 cursor-pointer rounded-full px-4 data-active:bg-primary data-active:text-white"
              >
                Features
              </TabsTrigger>
            </TabsList>
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tab === 'features' ? 'Search features…' : 'Search specifications…'}
                aria-label={tab === 'features' ? 'Search features' : 'Search specifications'}
                className="h-11 rounded-full border-border bg-secondary/40 pl-11"
              />
            </div>
          </div>

          <TabsContent value="specifications" className="w-full">
            {visibleGroups.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No specifications match your search.</p>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto border-b border-border/60 px-4 py-3 sm:hidden">
                  {visibleGroups.map((group) => (
                    <GroupNavButton
                      key={group.id}
                      title={group.title}
                      selected={activeGroup?.id === group.id}
                      onClick={() => setActive(group.id)}
                      className="whitespace-nowrap"
                    />
                  ))}
                </div>
                <div className="grid w-full items-start sm:grid-cols-[220px_minmax(0,1fr)]">
                  <nav
                    className="hidden flex-col gap-1 border-b border-border/60 p-3 sm:flex sm:border-b-0 sm:border-r"
                    aria-label="Specification groups"
                  >
                    {visibleGroups.map((group) => (
                      <GroupNavButton
                        key={group.id}
                        title={group.title}
                        selected={activeGroup?.id === group.id}
                        onClick={() => setActive(group.id)}
                        className="w-full"
                      />
                    ))}
                  </nav>
                  <div className="min-w-0 p-4">
                    {activeGroup ? (
                      <>
                        <h3 className="mb-3 text-lg font-semibold text-charcoal">{activeGroup.title}</h3>
                        <SpecRows rows={activeGroup.rows} />
                      </>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="features" className="p-4">
            {features.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {query.trim() ? 'No features match your search.' : 'No extra features were listed.'}
              </p>
            ) : (
              <SpecRows rows={features.map((spec) => ({ label: spec.label, value: spec.value }))} />
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
