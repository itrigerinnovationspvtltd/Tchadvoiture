import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Input,
  Label,
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
import { adminInputClass, adminPrimaryButtonClass, adminSelectTriggerClass } from '../components/adminControls'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { AdminDataTable } from '../components/AdminDataTable'
import { AdminToolbar } from '../components/AdminToolbar'
import { TableSkeletonRows } from '../components/TableSkeletonRows'

type Catalog = {
  makes: { id: string; name: string; models: { id: string; name: string }[] }[]
  fuels: { id: string; name: string }[]
  transmissions: { id: string; name: string }[]
  vehicleTypes: { id: string; name: string }[]
}

export function CatalogPage() {
  const queryClient = useQueryClient()
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: () => api<Catalog>('/api/catalog') })
  const [makeName, setMakeName] = useState('')
  const [modelName, setModelName] = useState('')
  const [makeId, setMakeId] = useState('')
  const [lookupKind, setLookupKind] = useState('vehicleType')
  const [lookupName, setLookupName] = useState('')
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['catalog'] })

  const addMake = useMutation({ mutationFn: () => api('/api/admin/catalog/makes', { method: 'POST', body: { name: makeName } }), onSuccess: () => { setMakeName(''); refresh() } })
  const addModel = useMutation({ mutationFn: () => api('/api/admin/catalog/models', { method: 'POST', body: { makeId, name: modelName } }), onSuccess: () => { setModelName(''); refresh() } })
  const addLookup = useMutation({ mutationFn: () => api('/api/admin/catalog/lookups', { method: 'POST', body: { kind: lookupKind, name: lookupName } }), onSuccess: () => { setLookupName(''); refresh() } })
  const remove = useMutation({
    mutationFn: ({ path }: { path: string }) => api(path, { method: 'DELETE' }),
    onSuccess: refresh,
  })

  const pending = catalog.isPending
  const makes = catalog.data?.makes ?? []
  const modelRows = makes.flatMap((make) => make.models.map((model) => ({ ...model, make: make.name })))

  return (
    <div className="space-y-8">
      <AdminPageHeader />
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-semibold">Makes and models</h2>
          <AdminToolbar
            asForm
            className="mt-3"
            onSubmit={(event) => {
              event.preventDefault()
              addMake.mutate()
            }}
          >
            <Input className={adminInputClass} value={makeName} onChange={(event) => setMakeName(event.target.value)} placeholder="New brand" />
            <Button type="submit" className={cn(adminPrimaryButtonClass, 'px-4')}>
              Add
            </Button>
          </AdminToolbar>
          <AdminToolbar
            asForm
            className="mt-2"
            onSubmit={(event) => {
              event.preventDefault()
              addModel.mutate()
            }}
          >
            <Select value={makeId || '__any__'} onValueChange={(value) => setMakeId(value === '__any__' ? '' : value)}>
              <SelectTrigger className={cn(adminSelectTriggerClass, 'min-w-[8rem] flex-1 sm:max-w-[12rem]')} aria-label="Brand">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any__">Brand</SelectItem>
                {makes.map((make) => <SelectItem key={make.id} value={make.id}>{make.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className={adminInputClass} value={modelName} onChange={(event) => setModelName(event.target.value)} placeholder="New model" />
            <Button type="submit" className={cn(adminPrimaryButtonClass, 'px-4')}>
              Add
            </Button>
          </AdminToolbar>
          <AdminDataTable className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending ? <TableSkeletonRows columns={2} rows={4} /> : null}
                {!pending ? makes.map((make) => (
                  <TableRow key={make.id}>
                    <TableCell className="font-semibold">{make.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" type="button" onClick={() => remove.mutate({ path: `/api/admin/catalog/makes/${make.id}` })}>Delete</Button>
                    </TableCell>
                  </TableRow>
                )) : null}
              </TableBody>
            </Table>
          </AdminDataTable>
          <AdminDataTable className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending ? <TableSkeletonRows columns={3} rows={5} /> : null}
                {!pending ? modelRows.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>{model.name}</TableCell>
                    <TableCell>{model.make}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" type="button" onClick={() => remove.mutate({ path: `/api/admin/catalog/models/${model.id}` })}>Delete</Button>
                    </TableCell>
                  </TableRow>
                )) : null}
              </TableBody>
            </Table>
          </AdminDataTable>
        </div>
        <div>
          <h2 className="font-semibold">Types, fuel, and transmission</h2>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              addLookup.mutate()
            }}
          >
            <div className="grid gap-1.5">
              <Label>Kind</Label>
              <Select value={lookupKind} onValueChange={setLookupKind}>
                <SelectTrigger className={cn(adminSelectTriggerClass, 'w-full')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicleType">Vehicle type</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="transmission">Transmission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AdminToolbar>
              <Input className={adminInputClass} value={lookupName} onChange={(event) => setLookupName(event.target.value)} placeholder="Name" />
              <Button type="submit" className={cn(adminPrimaryButtonClass, 'px-4')}>
                Add
              </Button>
            </AdminToolbar>
          </form>
          {(['vehicleTypes', 'fuels', 'transmissions'] as const).map((key) => (
            <div key={key} className="mt-4">
              <p className="text-sm font-medium capitalize">{key}</p>
              <AdminDataTable className="mt-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending ? <TableSkeletonRows columns={2} rows={3} /> : null}
                    {!pending ? (catalog.data?.[key] ?? []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="destructive" size="sm" type="button" onClick={() => remove.mutate({ path: `/api/admin/catalog/lookups/${item.id}` })}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    )) : null}
                  </TableBody>
                </Table>
              </AdminDataTable>
            </div>
          ))}
          {addMake.error instanceof Error ? <p className="mt-3 text-sm text-red-700">{addMake.error.message}</p> : null}
          {remove.error instanceof Error ? <p className="mt-3 text-sm text-red-700">{remove.error.message}</p> : null}
        </div>
      </section>
    </div>
  )
}
