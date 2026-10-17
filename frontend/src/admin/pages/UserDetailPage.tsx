import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageLoadingSkeleton } from '../../components/PageLoadingSkeleton'
import { Alert, AlertDescription, Badge, Button, Card, CardContent, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, statusBadgeClass } from '@/components/ui'
import { useEffect, useState } from 'react'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { adminPrimaryButtonClass } from '../components/adminControls'
import { api } from '../lib/api'

type Detail = {
  user: {
    id: string
    name: string
    email: string
    phone: string
    role: string
    status: string
    location: string
    dealershipName: string
    description: string
    address: string
    businessDetails: string
  }
  vehicles: { id: string; title: string; status: string; price: number }[]
  enquiries: { id: string; vehicleTitle: string; buyerName: string; message: string; status: string }[]
}

export function UserDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [role, setRole] = useState('buyer')
  const detail = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api<Detail>(`/api/admin/users/${id}`),
  })

  const save = useMutation({
    mutationFn: (body: Record<string, string>) => api(`/api/admin/users/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not save.'),
  })
  const status = useMutation({
    mutationFn: (next: string) => api(`/api/admin/users/${id}/status`, { method: 'POST', body: { status: next } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-user', id] }),
  })

  useEffect(() => {
    if (detail.data) setRole(detail.data.user.role)
  }, [detail.data])

  if (detail.isLoading) return <PageLoadingSkeleton variant="form" />
  if (!detail.data) return <Alert variant="destructive"><AlertDescription>User not found.</AlertDescription></Alert>
  const user = detail.data.user

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={user.name}
        description="Account profile, listings, and enquiries."
        actions={
          <>
            <Badge variant="outline" className={statusBadgeClass(user.status)}>{user.status}</Badge>
            <Badge variant="outline" className={statusBadgeClass(user.role)}>{user.role}</Badge>
          </>
        }
      />
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <form
        className="grid max-w-3xl gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          save.mutate(Object.fromEntries(form.entries()) as Record<string, string>)
        }}
      >
        <div className="grid gap-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" className="h-10" defaultValue={user.name} /></div>
        <div className="grid gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" className="h-10" defaultValue={user.email} /></div>
        <div className="grid gap-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" className="h-10" defaultValue={user.phone} /></div>
        <div className="grid gap-1.5"><Label htmlFor="location">Location</Label><Input id="location" name="location" className="h-10" defaultValue={user.location} /></div>
        <div className="grid gap-1.5">
          <Label>Role</Label>
          <input type="hidden" name="role" value={role} />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="individual">Individual seller</SelectItem>
              <SelectItem value="dealer">Dealer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5"><Label htmlFor="dealership">Dealership name</Label><Input id="dealership" name="dealershipName" className="h-10" defaultValue={user.dealershipName} /></div>
        <div className="grid gap-1.5"><Label htmlFor="address">Address</Label><Input id="address" name="address" className="h-10" defaultValue={user.address} /></div>
        <div className="grid gap-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" className="min-h-28" defaultValue={user.description} /></div>
        <div className="grid gap-1.5"><Label htmlFor="business">Business details</Label><Textarea id="business" name="businessDetails" className="min-h-28" defaultValue={user.businessDetails} /></div>
        <div className="sm:col-span-2"><Button type="submit" className={adminPrimaryButtonClass}>Save user</Button></div>
      </form>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => status.mutate('active')}>Activate</Button>
        <Button variant="outline" onClick={() => status.mutate('inactive')}>Deactivate</Button>
        <Button variant="destructive" onClick={() => status.mutate('blocked')}>Block</Button>
      </div>
      <section>
        <h2 className="mb-2 font-semibold">Listings</h2>
        <ul className="space-y-1 text-sm">
          {detail.data.vehicles.length === 0 ? <li className="text-muted-foreground">No listings.</li> : null}
          {detail.data.vehicles.map((vehicle) => (
            <li key={vehicle.id}><Link className="text-primary" to={`/admin/vehicles/${vehicle.id}`}>{vehicle.title}</Link> · {vehicle.status}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Enquiries</h2>
        <ul className="space-y-2 text-sm">
          {detail.data.enquiries.length === 0 ? <li className="text-muted-foreground">No enquiries.</li> : null}
          {detail.data.enquiries.map((enquiry) => (
            <li key={enquiry.id}>
              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardContent>
                  <p className="font-medium">{enquiry.vehicleTitle} · {enquiry.buyerName}</p>
                  <p>{enquiry.message}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
