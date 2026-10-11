import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Badge,
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
  statusBadgeClass,
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

export function VehiclesPage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const status = params.get('status') ?? ''
  const query = params.toString()
  const vehicles = useQuery({
    queryKey: ['admin-vehicles', query],
    queryFn: () => api<Page>(`/api/admin/vehicles?${query}`),
  })

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
                <Badge variant="outline" className={statusBadgeClass(vehicle.status)}>{vehicle.status}</Badge>
              </TableCell>
            </TableRow>
          )) : null}
        </TableBody>
      </Table>
      </AdminDataTable>
    </div>
  )
}
