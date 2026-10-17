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
import { adminInputClass, adminPrimaryButtonClass, adminSelectTriggerClass } from '../components/adminControls'
import { AdminDataTable } from '../components/AdminDataTable'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { AdminPagination } from '../components/AdminPagination'
import { AdminToolbar } from '../components/AdminToolbar'
import { TableSkeletonRows } from '../components/TableSkeletonRows'

type UserRow = { id: string; name: string; email: string; phone: string; role: string; status: string; dealershipName: string }
type Page = { items: UserRow[]; total: number; page: number; pages: number }

export function UsersPage({ role = '', title }: { role?: string; title: string }) {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const status = params.get('status') ?? ''
  const query = params.toString()

  const users = useQuery({
    queryKey: ['admin-users', role, query],
    queryFn: () => api<Page>(`/api/admin/users?role=${encodeURIComponent(role)}&${query}`),
  })

  const description =
    role === 'dealer'
      ? 'Dealer accounts and dealership profiles.'
      : role === 'individual'
        ? 'Private sellers listing vehicles on the platform.'
        : 'Search and manage all marketplace accounts.'

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value && value !== '__any__') next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  return (
    <div>
      <AdminPageHeader title={title} description={description} />
      <AdminToolbar
        asForm
        className="mb-4 max-w-3xl"
        onSubmit={(event) => {
          event.preventDefault()
          update('q', q)
        }}
      >
        <Select value={status || '__any__'} onValueChange={(value) => update('status', value === '__any__' ? '' : value)}>
          <SelectTrigger className={cn(adminSelectTriggerClass, 'w-36')} aria-label="Account status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">All statuses</SelectItem>
            {['active', 'inactive', 'blocked'].map((item) => (
              <SelectItem key={item} value={item} className="capitalize">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className={cn(adminInputClass, 'min-w-48 flex-1')}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, email, or phone"
        />
        <Button type="submit" className={cn(adminPrimaryButtonClass, 'px-4')}>
          Search
        </Button>
      </AdminToolbar>
      <AdminDataTable className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isPending ? <TableSkeletonRows columns={5} /> : null}
            {!users.isPending
              ? users.data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link className="font-semibold text-primary" to={`/admin/users/${user.id}`}>
                        {user.dealershipName || user.name}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </AdminDataTable>
      {!users.isPending && users.data && users.data.total === 0 ? <p className="py-6 text-muted-foreground">No accounts found.</p> : null}
      {users.data ? <AdminPagination page={users.data.page} pages={users.data.pages} total={users.data.total} /> : null}
    </div>
  )
}
