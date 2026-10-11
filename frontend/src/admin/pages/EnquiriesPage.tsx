import { useQuery } from '@tanstack/react-query'
import { Badge, Card, CardContent, Skeleton, statusBadgeClass } from '@/components/ui'
import { api } from '../lib/api'

type Enquiry = { id: string; vehicleTitle: string; buyerName: string; buyerPhone: string; buyerEmail: string; message: string; status: string; createdAt: string }
type Page = { items: Enquiry[] }

export function EnquiriesPage() {
  const enquiries = useQuery({ queryKey: ['admin-enquiries'], queryFn: () => api<Page>('/api/admin/enquiries') })
  if (enquiries.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  return (
    <div>
      <h1 className="text-2xl font-bold">Enquiries</h1>
      <div className="mt-4 space-y-3">
        {enquiries.data?.items.length === 0 ? <p className="text-slate-600">No enquiries yet.</p> : null}
        {enquiries.data?.items.map((enquiry) => (
          <Card key={enquiry.id}>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{enquiry.vehicleTitle}</h2>
                <Badge variant="outline" className={statusBadgeClass(enquiry.status)}>{enquiry.status}</Badge>
              </div>
              <p>{enquiry.message}</p>
              <p className="text-slate-600">{enquiry.buyerName} · {enquiry.buyerPhone} · {enquiry.buyerEmail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
