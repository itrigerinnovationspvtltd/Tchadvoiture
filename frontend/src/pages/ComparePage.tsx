import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { Button, Skeleton } from '@/components/ui'
import { api } from '@/lib/api'
import { removeCompare, useCompareIds } from '@/lib/compare'
import { formatKm, formatPrice } from '@/lib/format'
import { useSettings } from '@/lib/hooks'
import type { Vehicle } from '@/lib/types'
import { VehiclePhoto } from '@/components/VehiclePhoto'

const rows: { label: string; value: (vehicle: Vehicle) => string }[] = [
  { label: 'Year', value: (vehicle) => String(vehicle.manufacturingYear) },
  { label: 'Kilometers', value: (vehicle) => formatKm(vehicle.kilometers) },
  { label: 'Fuel', value: (vehicle) => vehicle.fuelName },
  { label: 'Transmission', value: (vehicle) => vehicle.transmissionName },
  { label: 'Body type', value: (vehicle) => vehicle.vehicleTypeName },
  { label: 'Owners', value: (vehicle) => (vehicle.owners === 1 ? '1 owner' : `${vehicle.owners} owners`) },
  { label: 'Condition', value: (vehicle) => vehicle.condition },
  { label: 'City', value: (vehicle) => vehicle.location },
]

export function ComparePage() {
  const ids = useCompareIds()
  const { data: settings } = useSettings()
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['vehicle', id],
      queryFn: () => api<{ vehicle: Vehicle }>(`/api/vehicles/${id}`),
    })),
  })

  if (!ids.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-charcoal">Compare cars</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pick up to three cars from the list, then compare them here.</p>
        <Button asChild className="mt-6 h-11">
          <Link to="/cars">Browse cars</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <h1 className="text-3xl font-bold text-charcoal">Compare cars</h1>
      <p className="mt-2 text-sm text-muted-foreground">Up to three listings, side by side.</p>
      <div className="mt-6 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ids.map((id, index) => {
          const query = queries[index]
          const vehicle = query?.data?.vehicle
          return (
            <article key={id} className="overflow-hidden rounded-xl border border-border bg-card">
              {query?.isLoading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : vehicle ? (
                <>
                  <VehiclePhoto src={vehicle.images[0]?.url} alt={vehicle.title} />
                  <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">{vehicle.makeName}</p>
                        <h2 className="text-lg font-bold text-charcoal">
                          <Link to={`/cars/${vehicle.id}`} className="hover:text-primary">
                            {[vehicle.modelName, vehicle.variant].filter(Boolean).join(' ') || vehicle.title}
                          </Link>
                        </h2>
                      </div>
                      <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => removeCompare(id)}>
                        Remove
                      </Button>
                    </div>
                    <p className="text-lg font-bold text-charcoal">{formatPrice(vehicle.price, settings?.currencyLabel)}</p>
                    <dl className="divide-y divide-border">
                      {rows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <dt className="text-muted-foreground">{row.label}</dt>
                          <dd className="text-right font-medium text-charcoal">{row.value(vehicle)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </>
              ) : (
                <div className="space-y-3 p-4">
                  <p className="text-sm text-muted-foreground">This listing is no longer available.</p>
                  <Button type="button" variant="outline" className="h-11" onClick={() => removeCompare(id)}>
                    Remove
                  </Button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
