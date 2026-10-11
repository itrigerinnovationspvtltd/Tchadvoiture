import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, CardContent, Skeleton, statusBadgeClass } from '@/components/ui'
import { api, assetUrl } from '../lib/api'
import { formatPrice } from '../lib/format'
import { useSettings } from '../lib/hooks'
import type { Vehicle } from '../lib/types'

export function MyListingsPage() {
  const settings = useSettings()
  const queryClient = useQueryClient()
  const listings = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => api<{ vehicles: Vehicle[] }>('/api/me/vehicles'),
  })
  const action = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api(`/api/me/vehicles/${id}/status`, { method: 'POST', body: { action: name } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-vehicles'] }),
  })

  function run(id: string, name: string, label: string) {
    if (!window.confirm(`${label}?`)) return
    action.mutate({ id, name })
  }

  if (listings.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  const vehicles = listings.data?.vehicles ?? []
  const counted = vehicles.filter((vehicle) => vehicle.status === 'pending' || vehicle.status === 'active').length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {settings.data ? `${counted} pending or active. Limit for individual sellers: ${settings.data.individualListingLimit}. Dealers are unlimited.` : null}
          </p>
        </div>
        <Button asChild className="h-10"><Link to="/my-listings/new">Add a car</Link></Button>
      </div>
      {action.error instanceof Error ? <p className="mt-4 text-sm text-red-700">{action.error.message}</p> : null}
      <div className="mt-6 space-y-4">
        {vehicles.length === 0 ? <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">You have not listed a car yet.</p> : null}
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="sm:flex-row">
            {vehicle.images[0] ? <img src={assetUrl(vehicle.images[0].url)} alt={vehicle.title} className="h-28 w-full object-cover sm:w-40" /> : <div className="h-28 bg-muted sm:w-40" />}
            <CardContent className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{vehicle.title}</h2>
                <Badge variant="outline" className={statusBadgeClass(vehicle.status)}>{vehicle.status}</Badge>
              </div>
              <p className="text-primary font-bold">{formatPrice(vehicle.price, settings.data?.currencyLabel)}</p>
              <p className="text-sm text-muted-foreground">{vehicle.location}</p>
              {vehicle.status === 'pending' ? <p className="mt-2 text-sm text-muted-foreground">Waiting for admin approval.</p> : null}
              {vehicle.rejectionReason ? <p className="mt-2 text-sm text-red-700">Rejected: {vehicle.rejectionReason}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {vehicle.status !== 'sold' ? <Button variant="outline" asChild><Link to={`/my-listings/${vehicle.id}/edit`}>Edit</Link></Button> : null}
                {vehicle.status === 'active' ? <Button variant="outline" onClick={() => run(vehicle.id, 'deactivate', 'Deactivate this listing')}>Deactivate</Button> : null}
                {vehicle.status === 'active' ? <Button variant="outline" onClick={() => run(vehicle.id, 'sold', 'Mark this listing sold')}>Mark sold</Button> : null}
                {vehicle.status === 'rejected' || vehicle.status === 'inactive' ? <Button onClick={() => run(vehicle.id, 'resubmit', 'Resubmit for approval')}>Resubmit</Button> : null}
                <Button variant="destructive" onClick={() => run(vehicle.id, 'remove', 'Remove this listing')}>Remove</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
