import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, CardContent, Skeleton, statusBadgeClass } from '@/components/ui'
import { api } from '../lib/api'

type Report = { id: string; vehicleId: string; vehicleTitle: string; reason: string; status: string; reporterName: string; sellerId: string }
type Page = { items: Report[] }

export function ReportsPage() {
  const queryClient = useQueryClient()
  const reports = useQuery({ queryKey: ['reports'], queryFn: () => api<Page>('/api/admin/reports?status=open') })
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api(`/api/admin/reports/${id}`, { method: 'POST', body: { action } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['reports'] }),
  })
  if (reports.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  return (
    <div>
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="mt-4 space-y-3">
        {reports.data?.items.length === 0 ? <p className="text-neutral-600">No open reports.</p> : null}
        {reports.data?.items.map((report) => (
          <Card key={report.id}>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link className="font-semibold text-primary" to={`/admin/vehicles/${report.vehicleId}`}>{report.vehicleTitle}</Link>
                <Badge variant="outline" className={statusBadgeClass(report.status)}>{report.status}</Badge>
              </div>
              <p className="text-sm">{report.reason}</p>
              <p className="text-xs text-slate-600">Reported by {report.reporterName}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => act.mutate({ id: report.id, action: 'dismiss' })}>Dismiss</Button>
                <Button variant="destructive" onClick={() => act.mutate({ id: report.id, action: 'takedown' })}>Take down</Button>
                <Button variant="destructive" onClick={() => act.mutate({ id: report.id, action: 'block' })}>Block seller</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
