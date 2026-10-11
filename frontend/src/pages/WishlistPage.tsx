import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CarCard } from '../components/CarCard'
import { Button, Skeleton } from '@/components/ui'
import { api } from '../lib/api'
import type { Vehicle } from '../lib/types'

export function WishlistPage() {
  const queryClient = useQueryClient()
  const wishlist = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api<{ vehicles: Vehicle[] }>('/api/me/wishlist'),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/me/wishlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })

  if (wishlist.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  const vehicles = wishlist.data?.vehicles ?? []

  return (
    <div>
      <h1 className="text-3xl font-bold">Wishlist</h1>
      <p className="mt-2 text-sm text-muted-foreground">Cars you saved for later.</p>
      {vehicles.length === 0 ? <p className="mt-8 text-muted-foreground">Your wishlist is empty.</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id}>
            <CarCard vehicle={vehicle} />
            <Button className="mt-2" variant="outline" onClick={() => remove.mutate(vehicle.id)}>Remove</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
