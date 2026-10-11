import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChevronLeft, Fuel, Settings2 } from 'lucide-react'
import { Alert, AlertDescription, Input, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { api, assetUrl } from '../lib/api'
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
  return [
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
}

function matches(row: Row, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return row.label.toLowerCase().includes(needle) || row.value.toLowerCase().includes(needle)
}

function SpecTable({ rows }: { rows: Row[] }) {
  return (
    <dl className="overflow-hidden rounded-lg border border-border">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-2 sm:items-center sm:gap-4">
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="text-sm font-semibold text-charcoal sm:text-right">{row.value}</dd>
        </div>
      ))}
    </dl>
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
  const visibleGroups = groups
    .map((group) => ({ ...group, rows: group.rows.filter((row) => matches(row, query)) }))
    .filter((group) => group.rows.length > 0)
  const features = (vehicle?.specs ?? []).filter((spec) => spec.label && spec.value && matches(spec, query))
  const heading = vehicle ? [vehicle.modelName, vehicle.variant].filter(Boolean).join(' ') || vehicle.title : ''

  if (listing.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  if (!vehicle) return <Alert variant="destructive"><AlertDescription>{errorMessage(listing.error) || 'Listing not found.'}</AlertDescription></Alert>

  const photo = vehicle.images[0]
  const facts = [
    { icon: Calendar, label: 'Year', value: String(vehicle.manufacturingYear) },
    { icon: Fuel, label: 'Fuel', value: vehicle.fuelName || '—' },
    { icon: Settings2, label: 'Transmission', value: vehicle.transmissionName || '—' },
  ]

  function showGroup(groupId: string) {
    setActive(groupId)
    document.getElementById(groupId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <Link to={`/cars/${vehicle.id}`} className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ChevronLeft className="size-4" aria-hidden />
        Back to {heading}
      </Link>

      <section className="mt-6 grid items-center gap-8 lg:grid-cols-2">
        <div className="grid gap-6">
          {facts.map((fact) => (
            <div key={fact.label}>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <fact.icon className="size-4" aria-hidden />
                {fact.label}
              </p>
              <p className="mt-1 text-3xl font-bold text-charcoal sm:text-4xl">{fact.value}</p>
            </div>
          ))}
        </div>
        {photo ? (
          <img src={assetUrl(photo.url)} alt="" className="mx-auto max-h-72 w-full object-contain" />
        ) : (
          <div className="flex h-56 items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">No photo</div>
        )}
      </section>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-charcoal">{vehicle.modelName || heading} key specifications</h1>
        {vehicle.variant ? <p className="text-sm font-medium text-muted-foreground">{vehicle.variant}</p> : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <Tabs value={tab} onValueChange={setTab} className="w-full flex-col gap-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-sky-50 px-4 py-3">
            <TabsList className="h-10 bg-transparent p-0">
              <TabsTrigger value="specifications" className="h-10 cursor-pointer rounded-full px-4 data-active:bg-charcoal data-active:text-white">Specifications</TabsTrigger>
              <TabsTrigger value="features" className="h-10 cursor-pointer rounded-full px-4 data-active:bg-charcoal data-active:text-white">Features</TabsTrigger>
            </TabsList>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tab === 'features' ? 'Search features…' : 'Search specifications…'}
              aria-label={tab === 'features' ? 'Search features' : 'Search specifications'}
              className="h-10 w-full bg-card sm:w-64"
            />
          </div>

          <TabsContent value="specifications" className="w-full">
            {visibleGroups.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No specifications match your search.</p>
            ) : (
              <div className="spec-columns grid w-full items-stretch">
                <nav className="flex h-full flex-col border-b border-border sm:border-b-0 sm:border-r" aria-label="Specification groups">
                  {visibleGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      className={cn(
                        'w-full cursor-pointer border-b border-border px-4 py-3 text-left text-sm last:border-b-0 hover:bg-sky-50',
                        active === group.id && 'bg-sky-50 font-medium text-primary',
                      )}
                      aria-current={active === group.id ? 'true' : undefined}
                      onClick={() => showGroup(group.id)}
                    >
                      {group.title}
                    </button>
                  ))}
                </nav>
                <div className="min-w-0 space-y-6 p-4">
                  {visibleGroups.map((group) => (
                    <section key={group.id} id={group.id} className="scroll-mt-24">
                      <h2 className="mb-3 text-lg font-semibold text-charcoal">{group.title}</h2>
                      <SpecTable rows={group.rows} />
                    </section>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="features" className="p-4">
            {features.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {query.trim() ? 'No features match your search.' : 'No extra features were listed.'}
              </p>
            ) : (
              <SpecTable rows={features.map((spec) => ({ label: spec.label, value: spec.value }))} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
