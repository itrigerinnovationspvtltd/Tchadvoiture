import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { api } from '../lib/api'
import { adminButtonClass, adminInputClass, adminSelectTriggerClass } from '../components/adminControls'
import { AdminDataTable } from '../components/AdminDataTable'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { AdminToolbar } from '../components/AdminToolbar'
import { TableSkeletonRows } from '../components/TableSkeletonRows'

type Vehicle = { id: string; title: string; status: string; price: number; location: string; seller: { name?: string; dealershipName?: string; email?: string } }
type Page = { items: Vehicle[]; total: number; page: number; pages: number }
const STATUSES = ['pending', 'active', 'rejected', 'inactive', 'sold']

export function VehiclesPage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const status = params.get('status') ?? ''
  const query = params.toString()
  const vehicles = useQuery({
    queryKey: ['admin-vehicles', query],
    queryFn: () => api<Page>(`/api/admin/vehicles?${query}`),
  })
  const moderate = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason?: string }) =>
      api(`/api/admin/vehicles/${id}/moderate`, { method: 'POST', body: { action, reason } }),
    onSuccess: () => {
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not update the status.'),
  })

  function changeStatus(vehicle: Vehicle, next: string) {
    if (next === vehicle.status) return
    if (next === 'pending') {
      setError('The seller resubmits a rejected or inactive listing.')
      return
    }
    if (next === 'rejected') {
      const reason = window.prompt('Rejection reason')?.trim()
      if (!reason) {
        setError('A rejection reason is required.')
        return
      }
      moderate.mutate({ id: vehicle.id, action: 'reject', reason })
      return
    }
    const action = next === 'active' ? (vehicle.status === 'pending' ? 'approve' : 'activate') : next === 'inactive' ? 'deactivate' : 'sold'
    moderate.mutate({ id: vehicle.id, action })
  }

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <div>
      <AdminPageHeader
        title="Vehicles"
        description="Review listings, filter by status, and handle reported vehicles."
        actions={
          <Link to="/admin/vehicles?status=pending" className="text-sm font-semibold text-primary hover:underline">
            Pending only
          </Link>
        }
      />
      <AdminToolbar
        asForm
        className="mb-4"
        onSubmit={(event) => {
          event.preventDefault()
          update('q', q)
        }}
      >
        <Select value={status || '__any__'} onValueChange={(value) => update('status', value === '__any__' ? '' : value)}>
          <SelectTrigger className={adminSelectTriggerClass} aria-label="Status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">All statuses</SelectItem>
            {['pending', 'active', 'rejected', 'inactive', 'sold'].map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className={cn(adminInputClass, 'w-48 sm:w-56')}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search"
        />
        <Button type="submit" variant="secondary" className={cn(adminButtonClass, 'bg-charcoal px-4 text-white hover:bg-black')}>
          Search
        </Button>
        <Button
          variant="outline"
          type="button"
          className={cn(adminButtonClass, 'px-4')}
          onClick={() => update('reported', params.get('reported') === 'true' ? '' : 'true')}
        >
          {params.get('reported') === 'true' ? 'Show all' : 'Reported only'}
        </Button>
      </AdminToolbar>
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <AdminDataTable className="mt-4">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Listing</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.isPending ? <TableSkeletonRows columns={4} /> : null}
          {!vehicles.isPending ? vehicles.data?.items.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <Link className="font-semibold text-primary" to={`/admin/vehicles/${vehicle.id}`}>{vehicle.title}</Link>
                <div className="text-muted-foreground">{vehicle.location}</div>
              </TableCell>
              <TableCell>{vehicle.seller.dealershipName || vehicle.seller.name}</TableCell>
              <TableCell>{vehicle.price}</TableCell>
              <TableCell>
                <Select
                  value={vehicle.status}
                  disabled={moderate.isPending && moderate.variables?.id === vehicle.id}
                  onValueChange={(next) => changeStatus(vehicle, next)}
                >
                  <SelectTrigger className={cn(adminSelectTriggerClass, 'w-36 capitalize')} aria-label={`Status for ${vehicle.title}`}>
                    {moderate.isPending && moderate.variables?.id === vehicle.id ? <span>Saving…</span> : <SelectValue />}
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((item) => (
                      <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          )) : null}
        </TableBody>
      </Table>
      </AdminDataTable>
    </div>
  )
}
