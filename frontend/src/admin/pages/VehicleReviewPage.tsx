import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription, Badge, Button, Card, CardContent, Input, Label, Skeleton, Textarea, statusBadgeClass } from '@/components/ui'
import { assetUrl } from '@/lib/api'
import { api } from '../lib/api'

type Vehicle = {
  id: string
  title: string
  status: string
  price: number
  location: string
  description: string
  color: string
  kilometers: number
  registrationNumber?: string
  insurancePolicyNumber?: string
  insured: boolean
  insuranceExpiry: string
  rejectionReason?: string
  makeName: string
  modelName: string
  fuelName: string
  transmissionName: string
  vehicleTypeName: string
  owners: number
  condition: string
  images: { url: string }[]
  seller: { id: string; name?: string; email?: string; phone?: string; dealershipName?: string }
}

export function VehicleReviewPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const detail = useQuery({
    queryKey: ['admin-vehicle', id],
    queryFn: () => api<{ vehicle: Vehicle; reports: { id: string; reason: string; status: string; reporterName: string }[] }>(`/api/admin/vehicles/${id}`),
  })

  const moderate = useMutation({
    mutationFn: (body: { action: string; reason?: string }) => api(`/api/admin/vehicles/${id}/moderate`, { method: 'POST', body }),
    onSuccess: () => {
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['admin-vehicle', id] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Action failed.'),
  })

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/api/admin/vehicles/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['admin-vehicle', id] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not save.'),
  })

  if (detail.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  const vehicle = detail.data?.vehicle
  if (!vehicle) return <Alert variant="destructive"><AlertDescription>Listing not found.</AlertDescription></Alert>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{vehicle.title}</h1>
        <Badge variant="outline" className={statusBadgeClass(vehicle.status)}>{vehicle.status}</Badge>
      </div>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {vehicle.rejectionReason ? <p className="text-sm text-red-700">Rejection reason: {vehicle.rejectionReason}</p> : null}
      <div className="flex gap-2 overflow-x-auto">
        {vehicle.images.map((image) => <img key={image.url} src={assetUrl(image.url)} alt="" className="h-28 w-40 rounded-xl object-cover" />)}
      </div>
      <p className="text-sm text-neutral-700">
        {vehicle.makeName} {vehicle.modelName} · {vehicle.fuelName} · {vehicle.transmissionName} · {vehicle.vehicleTypeName} · {vehicle.owners} owners · {vehicle.condition}
      </p>
      <p className="text-sm">
        Seller: <Link className="text-primary" to={`/admin/users/${vehicle.seller.id}`}>{vehicle.seller.dealershipName || vehicle.seller.name}</Link>
        {' '}· {vehicle.seller.email} · {vehicle.seller.phone}
      </p>
      <p className="text-sm">Plate: {vehicle.registrationNumber || '—'} · Policy: {vehicle.insurancePolicyNumber || '—'}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => moderate.mutate({ action: 'approve' })}>Approve</Button>
        <Button variant="outline" onClick={() => moderate.mutate({ action: 'activate' })}>Activate</Button>
        <Button variant="outline" onClick={() => moderate.mutate({ action: 'deactivate' })}>Deactivate</Button>
        <Button variant="outline" onClick={() => moderate.mutate({ action: 'sold' })}>Mark sold</Button>
        <Button variant="destructive" onClick={() => moderate.mutate({ action: 'remove' })}>Remove</Button>
      </div>
      <form className="flex max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); moderate.mutate({ action: 'reject', reason }) }}>
        <Input className="h-10" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Rejection reason" />
        <Button type="submit" variant="destructive">Reject</Button>
      </form>
      <form
        className="grid max-w-3xl gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          save.mutate({
            price: Number(form.get('price')),
            location: form.get('location'),
            color: form.get('color'),
            kilometers: Number(form.get('kilometers')),
            description: form.get('description'),
            registrationNumber: form.get('registrationNumber'),
            insurancePolicyNumber: form.get('insurancePolicyNumber'),
            insured: vehicle.insured,
            insuranceExpiry: form.get('insuranceExpiry'),
          })
        }}
      >
        <div className="grid gap-1.5"><Label htmlFor="price">Price</Label><Input id="price" name="price" className="h-10" defaultValue={vehicle.price} /></div>
        <div className="grid gap-1.5"><Label htmlFor="location">Location</Label><Input id="location" name="location" className="h-10" defaultValue={vehicle.location} /></div>
        <div className="grid gap-1.5"><Label htmlFor="color">Color</Label><Input id="color" name="color" className="h-10" defaultValue={vehicle.color} /></div>
        <div className="grid gap-1.5"><Label htmlFor="kilometers">Kilometers</Label><Input id="kilometers" name="kilometers" className="h-10" defaultValue={vehicle.kilometers} /></div>
        <div className="grid gap-1.5"><Label htmlFor="plate">Registration number</Label><Input id="plate" name="registrationNumber" className="h-10" defaultValue={vehicle.registrationNumber} /></div>
        <div className="grid gap-1.5"><Label htmlFor="policy">Policy number</Label><Input id="policy" name="insurancePolicyNumber" className="h-10" defaultValue={vehicle.insurancePolicyNumber} /></div>
        <div className="grid gap-1.5"><Label htmlFor="expiry">Insurance expiry</Label><Input id="expiry" name="insuranceExpiry" className="h-10" defaultValue={vehicle.insuranceExpiry} /></div>
        <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" className="min-h-28" defaultValue={vehicle.description} /></div>
        <Button type="submit">Save listing</Button>
      </form>
      <section>
        <h2 className="font-semibold">Reports</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {detail.data?.reports.length === 0 ? <li className="text-neutral-600">No reports.</li> : null}
          {detail.data?.reports.map((report) => (
            <li key={report.id}><Card><CardContent>{report.reporterName}: {report.reason} ({report.status})</CardContent></Card></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
