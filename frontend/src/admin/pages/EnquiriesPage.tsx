import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageLoadingSkeleton } from '../../components/PageLoadingSkeleton'
import { Badge, Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, statusBadgeClass } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { AdminPagination } from '../components/AdminPagination'
import { AdminToolbar } from '../components/AdminToolbar'
import { adminSelectTriggerClass } from '../components/adminControls'
import { api } from '../lib/api'

type Enquiry = {
  id: string
  vehicleTitle: string
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  message: string
  status: string
  createdAt: string
}
type Page = { items: Enquiry[]; total: number; page: number; pages: number }

export function EnquiriesPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const query = params.toString()

  const enquiries = useQuery({
    queryKey: ['admin-enquiries', query],
    queryFn: () => api<Page>(`/api/admin/enquiries?${query}`),
  })

  function updateStatus(value: string) {
    const next = new URLSearchParams(params)
    if (value && value !== '__any__') next.set('status', value)
    else next.delete('status')
    next.delete('page')
    setParams(next)
  }

  if (enquiries.isLoading) return <PageLoadingSkeleton variant="list" />

  const data = enquiries.data

  return (
    <div>
      <AdminPageHeader />
      <AdminToolbar className="mb-4">
        <Select value={status || '__any__'} onValueChange={updateStatus}>
          <SelectTrigger className={cn(adminSelectTriggerClass, 'w-40')} aria-label="Enquiry status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">All statuses</SelectItem>
            {['new', 'read', 'closed'].map((item) => (
              <SelectItem key={item} value={item} className="capitalize">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminToolbar>
      <div className="space-y-3">
        {data?.items.length === 0 ? <p className="text-muted-foreground">No enquiries yet.</p> : null}
        {data?.items.map((enquiry) => (
          <Card key={enquiry.id} className="transition-all duration-300 hover:shadow-lg">
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{enquiry.vehicleTitle}</h2>
                <Badge variant="outline" className={statusBadgeClass(enquiry.status)}>
                  {enquiry.status}
                </Badge>
              </div>
              <p>{enquiry.message}</p>
              <p className="text-muted-foreground">
                {enquiry.buyerName} · {enquiry.buyerPhone} · {enquiry.buyerEmail}
              </p>
              {enquiry.createdAt ? (
                <p className="text-xs text-muted-foreground">{new Date(enquiry.createdAt).toLocaleString()}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {data ? <AdminPagination page={data.page} pages={data.pages} total={data.total} /> : null}
    </div>
  )
}
