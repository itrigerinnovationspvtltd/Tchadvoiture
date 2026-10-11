import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Badge,
  Button,
  Input,
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
import { adminButtonClass, adminInputClass } from '../components/adminControls'
import { AdminDataTable } from '../components/AdminDataTable'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { AdminToolbar } from '../components/AdminToolbar'
import { TableSkeletonRows } from '../components/TableSkeletonRows'

type UserRow = { id: string; name: string; email: string; phone: string; role: string; status: string; dealershipName: string }
type Page = { items: UserRow[]; total: number; page: number; pages: number }

export function UsersPage({ role = '', title }: { role?: string; title: string }) {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const users = useQuery({
    queryKey: ['admin-users', role, search],
    queryFn: () => api<Page>(`/api/admin/users?role=${role}&q=${encodeURIComponent(search)}`),
  })

  const description =
    role === 'dealer'
      ? 'Dealer accounts and dealership profiles.'
      : role === 'individual'
        ? 'Private sellers listing vehicles on the platform.'
        : 'Search and manage all marketplace accounts.'

  return (
    <div>
      <AdminPageHeader title={title} description={description} />
      <AdminToolbar
        asForm
        className="mb-4 max-w-xl"
        onSubmit={(event) => {
          event.preventDefault()
          setSearch(q)
        }}
      >
        <Input
          className={adminInputClass}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, email, or phone"
        />
        <Button type="submit" variant="secondary" className={cn(adminButtonClass, 'bg-charcoal px-4 text-white hover:bg-black')}>
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
            {!users.isPending ? users.data?.items.map((user) => (
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
                  <Badge variant="outline" className={statusBadgeClass(user.status)}>{user.status}</Badge>
                </TableCell>
              </TableRow>
            )) : null}
          </TableBody>
        </Table>
      </AdminDataTable>
      {!users.isPending && users.data && users.data.total === 0 ? <p className="py-6 text-muted-foreground">No accounts found.</p> : null}
    </div>
  )
}
