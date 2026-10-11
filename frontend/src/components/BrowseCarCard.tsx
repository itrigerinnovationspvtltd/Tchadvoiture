import { useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Heart } from 'lucide-react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatKm, formatPrice } from '@/lib/format'
import { useSettings } from '@/lib/hooks'
import { isRecentlyViewed } from '@/lib/recentlyViewed'
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
    <div className="min-w-0">
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
  const [photo, setPhoto] = useState(0)
  const [recent] = useState(() => isRecentlyViewed(vehicle.id))
  const images = vehicle.images
  const image = images[photo]?.url ?? images[0]?.url
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
    if (!user) {
      navigate(`/login?next=/cars/${vehicle.id}`)
      return
    }
    favourite.mutate()
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative w-full shrink-0 md:w-72">
          {recent ? (
            <span className="absolute top-3 left-3 z-10 rounded-md bg-charcoal px-2 py-1 text-[10px] font-semibold tracking-wider text-white">
              RECENTLY VIEWED
            </span>
          ) : null}
          <VehiclePhoto src={image} alt={vehicle.title} className="rounded-xl" />
          {images.length > 1 ? (
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2">
              {images.map((item, index) => (
                <button
                  key={`${item.filename}-${index}`}
                  type="button"
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === photo}
                  className="flex size-11 items-center justify-center"
                  onClick={() => setPhoto(index)}
                >
                  <span className={cn('size-2 rounded-full', index === photo ? 'bg-white' : 'bg-white/60')} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{vehicle.makeName}</p>
              <h3 className="text-xl font-bold text-charcoal">
                <Link to={`/cars/${vehicle.id}`} className="cursor-pointer hover:text-primary">
                  {heading}
                </Link>
              </h3>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-base font-bold whitespace-nowrap text-charcoal sm:text-lg">{formatPrice(vehicle.price, settings?.currencyLabel)}</p>
              <p className="text-xs text-muted-foreground">{vehicle.location}</p>
            </div>
          </div>
          <div className="mt-4 grid max-w-md grid-cols-3 gap-4">
            <Stat value={String(vehicle.manufacturingYear)} label="Year" />
            <Stat value={formatKm(vehicle.kilometers)} label="Kilometers" />
            <Stat value={vehicle.vehicleTypeName || '—'} label="Body type" />
          </div>
          {lines.length ? (
            <ul className="mt-4 space-y-2">
              {lines.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-foreground/80">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:mt-auto sm:flex-row sm:items-center sm:pt-4">
            <CompareToggle id={vehicle.id} className="sm:mr-auto" />
            <Button
              type="button"
              variant="outline"
              className="h-11 sm:min-w-36"
              aria-pressed={Boolean(vehicle.favourited)}
              disabled={favourite.isPending}
              onClick={save}
            >
              <Heart className={cn('size-4', vehicle.favourited && 'fill-primary text-primary')} />
              {vehicle.favourited ? 'Saved' : 'Save'}
            </Button>
            <Button asChild className="h-11 bg-charcoal text-white hover:bg-charcoal/90 sm:min-w-40">
              <Link to={`/cars/${vehicle.id}`}>View details</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
