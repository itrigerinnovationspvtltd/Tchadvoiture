import { type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Heart } from 'lucide-react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatKm, formatPrice } from '@/lib/format'
import { useSettings } from '@/lib/hooks'
import { isRecentlyViewed } from '@/lib/recentlyViewed'
import { btnLiftClass, interactiveCardClass } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/lib/types'
import { VehiclePhoto } from './VehiclePhoto'
import { CompareToggle } from './CompareControls'

function highlights(vehicle: Vehicle) {
  const fromSpecs = vehicle.specs
    .filter((spec) => spec.label && spec.value)
    .slice(0, 3)
    .map((spec) => `${spec.label}: ${spec.value}`)
  const owners = vehicle.owners === 1 ? '1 owner' : `${vehicle.owners} owners`
  const fallbacks = [
    vehicle.condition ? `${vehicle.condition} condition` : '',
    vehicle.owners ? owners : '',
    vehicle.transmissionName,
    vehicle.fuelName,
  ].filter(Boolean)
  const lines = [...fromSpecs]
  for (const line of fallbacks) {
    if (lines.length >= 3) break
    if (!lines.includes(line)) lines.push(line)
  }
  return lines.slice(0, 3)
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-secondary/50 px-3 py-2">
      <p className="truncate text-sm font-semibold text-charcoal">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function BrowseCarCard({ vehicle }: { vehicle: Vehicle }) {
  const { data: settings } = useSettings()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const recent = isRecentlyViewed(vehicle.id)
  const image = vehicle.images[0]?.url
  const heading = [vehicle.modelName, vehicle.variant].filter(Boolean).join(' ') || vehicle.title
  const lines = highlights(vehicle)
  const favourite = useMutation({
    mutationFn: async () => {
      if (vehicle.favourited) await api(`/api/me/wishlist/${vehicle.id}`, { method: 'DELETE' })
      else await api('/api/me/wishlist', { method: 'POST', body: { vehicleId: vehicle.id } })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      void queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  function save(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (!user) {
      navigate(`/login?next=/cars/${vehicle.id}`)
      return
    }
    favourite.mutate()
  }

  return (
    <article className={cn('group rounded-2xl bg-card p-4 ring-1 ring-border/60 hover:ring-primary/25', interactiveCardClass)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <div className="relative flex w-full shrink-0 flex-col overflow-hidden rounded-xl ring-1 ring-border/60 md:w-72">
          <Link
            to={`/cars/${vehicle.id}`}
            className="block min-h-0 flex-1 overflow-hidden"
          >
            <VehiclePhoto
              src={image}
              alt={vehicle.title}
              className="h-full rounded-none motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03] md:h-full"
              aspectClassName="aspect-[16/10] md:aspect-auto md:h-full md:min-h-[11rem]"
              fit="cover"
            />
          </Link>
          <div className="absolute top-3 right-3 z-10 flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 border-0 bg-white/95 shadow-sm hover:bg-white"
              aria-label={vehicle.favourited ? 'Remove from wishlist' : 'Save car'}
              disabled={favourite.isPending}
              onClick={save}
            >
              <Heart className={cn('size-4', vehicle.favourited && 'fill-primary text-primary')} />
            </Button>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{vehicle.makeName}</p>
                {recent ? (
                  <span className="rounded-full border border-charcoal/15 bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-charcoal">
                    Recently viewed
                  </span>
                ) : null}
              </div>
              <h3 className="text-xl font-bold text-charcoal">
                <Link to={`/cars/${vehicle.id}`} className="cursor-pointer transition-colors duration-200 hover:text-primary">
                  {heading}
                </Link>
              </h3>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold whitespace-nowrap text-primary sm:text-xl">{formatPrice(vehicle.price, settings?.currencyLabel)}</p>
              <p className="text-xs text-muted-foreground">{vehicle.location}</p>
            </div>
          </div>
          <div className="mt-4 grid max-w-md grid-cols-3 gap-2">
            <Stat value={String(vehicle.manufacturingYear)} label="Year" />
            <Stat value={formatKm(vehicle.kilometers)} label="Kilometers" />
            <Stat value={vehicle.vehicleTypeName || '—'} label="Body type" />
          </div>
          {lines.length ? (
            <ul className="mt-4 space-y-1.5">
              {lines.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-foreground/85">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:mt-auto sm:flex-row sm:items-center sm:pt-4">
            <CompareToggle id={vehicle.id} className="sm:mr-auto" />
            <Button asChild className={cn('h-11 cursor-pointer rounded-full sm:min-w-40', btnLiftClass)}>
              <Link to={`/cars/${vehicle.id}`}>View details</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
