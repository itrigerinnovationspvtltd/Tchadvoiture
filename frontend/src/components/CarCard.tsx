import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MapPin } from 'lucide-react'
import { Badge, Button, Card, CardContent, statusBadgeClass } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatKm, formatPrice, sellerLabel } from '@/lib/format'
import { useSettings } from '@/lib/hooks'
import { interactiveCardClass, surfaceCardClass } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/lib/types'
import { VehiclePhoto } from './VehiclePhoto'

export function CarCard({
  vehicle,
  layout = 'grid',
  variant = 'default',
}: {
  vehicle: Vehicle
  layout?: 'grid' | 'list'
  variant?: 'default' | 'showcase'
}) {
  const { data: settings } = useSettings()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const image = vehicle.images[0]?.url
  const name = sellerLabel(vehicle.sellerRole, vehicle.seller)
  const price = formatPrice(vehicle.price, settings?.currencyLabel)
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

  if (variant === 'showcase') {
    return (
      <Card className={cn('group relative h-full cursor-pointer overflow-hidden p-0 hover:outline-primary/25', surfaceCardClass, interactiveCardClass)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute top-3 right-3 z-10 bg-white"
          aria-label={vehicle.favourited ? 'Remove from wishlist' : 'Save car'}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            if (!user) {
              navigate(`/login?next=/cars/${vehicle.id}`)
              return
            }
            favourite.mutate()
          }}
        >
          <Heart className={cn('h-4 w-4', vehicle.favourited && 'fill-primary text-primary')} />
        </Button>
        <Link to={`/cars/${vehicle.id}`} className="flex h-full cursor-pointer flex-col">
          <div className="overflow-hidden">
            <VehiclePhoto src={image} alt={vehicle.title} className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]" />
          </div>
          <CardContent className="flex flex-1 flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{vehicle.manufacturingYear}</p>
                <h3 className="truncate font-semibold text-charcoal">{vehicle.title}</h3>
              </div>
              <p className="shrink-0 text-sm font-bold text-accent">{price}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatKm(vehicle.kilometers)} · {vehicle.fuelName} · {vehicle.transmissionName}
            </p>
            <p className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {vehicle.location}
            </p>
          </CardContent>
        </Link>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'group h-full cursor-pointer overflow-hidden p-0 hover:outline-primary/25',
        surfaceCardClass,
        interactiveCardClass,
        layout === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col',
      )}
    >
      <Link to={`/cars/${vehicle.id}`} className={cn('flex flex-1 cursor-pointer', layout === 'list' ? 'flex-col sm:flex-row' : 'h-full flex-col')}>
        <div className={cn('relative shrink-0 overflow-hidden', layout === 'list' ? 'w-full sm:w-72' : 'w-full')}>
          <VehiclePhoto src={image} alt={vehicle.title} className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]" />
          <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-white/95 px-2.5 py-1 text-sm font-bold text-accent shadow-sm">
            {price}
          </span>
        </div>
        <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-charcoal">{vehicle.title}</h3>
            {vehicle.status && vehicle.status !== 'active' ? <Badge variant="outline" className={statusBadgeClass(vehicle.status)}>{vehicle.status}</Badge> : null}
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {vehicle.location}
            <span aria-hidden="true">·</span>
            {formatKm(vehicle.kilometers)}
          </p>
          <p className="text-sm text-muted-foreground">
            {vehicle.fuelName} · {vehicle.transmissionName}
          </p>
          <p className="mt-auto pt-2 text-sm text-charcoal">{name}</p>
        </CardContent>
      </Link>
    </Card>
  )
}
