import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CarCard } from '../components/CarCard'
import { PageLoadingSkeleton } from '../components/PageLoadingSkeleton'
import { Alert, AlertDescription, Card, CardContent } from '@/components/ui'
import { api, assetUrl } from '../lib/api'
import { errorMessage, sellerLabel } from '../lib/format'
import type { PublicSeller, Vehicle } from '../lib/types'

export function SellerPage() {
  const { id = '' } = useParams()
  const profile = useQuery({
    queryKey: ['seller', id],
    queryFn: () => api<{ seller: PublicSeller; vehicles: Vehicle[] }>(`/api/sellers/${id}`),
  })

  if (profile.isLoading) return <PageLoadingSkeleton variant="seller" />
  if (!profile.data) return <Alert variant="destructive"><AlertDescription>{errorMessage(profile.error)}</AlertDescription></Alert>
  const { seller, vehicles } = profile.data
  const title = sellerLabel(seller.role || '', seller)
  const photo = seller.role === 'dealer' ? seller.logoUrl || seller.avatarUrl : seller.avatarUrl

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {photo ? <img src={assetUrl(photo)} alt="" className="h-20 w-20 rounded-full object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{title.slice(0, 1)}</div>}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{seller.role === 'dealer' ? 'Dealer' : 'Individual seller'}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
          {seller.location ? <p className="text-neutral-600">{seller.location}</p> : null}
          {seller.address ? <p className="text-sm text-neutral-600">{seller.address}</p> : null}
          {seller.description ? <p className="mt-2 max-w-2xl text-sm text-neutral-700">{seller.description}</p> : null}
          {seller.businessDetails ? <p className="mt-2 max-w-2xl text-sm text-neutral-700">{seller.businessDetails}</p> : null}
        </div>
        </CardContent>
      </Card>
      <section>
        <h2 className="mb-4 text-xl font-bold">Active cars</h2>
        {vehicles.length === 0 ? <p className="text-neutral-600">No public listings right now.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => <CarCard key={vehicle.id} vehicle={vehicle} />)}
        </div>
        <Link to="/cars" className="mt-6 inline-block text-sm font-semibold text-primary">Back to browse</Link>
      </section>
    </div>
  )
}
