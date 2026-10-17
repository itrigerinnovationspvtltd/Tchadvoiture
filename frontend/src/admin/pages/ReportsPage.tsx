import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageLoadingSkeleton } from '../../components/PageLoadingSkeleton'
import { Badge, Button, Card, CardContent, Tabs, TabsList, TabsTrigger, statusBadgeClass } from '@/components/ui'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { AdminPagination } from '../components/AdminPagination'
import { api } from '../lib/api'

type Report = { id: string; vehicleId: string; vehicleTitle: string; reason: string; status: string; reporterName: string; sellerId: string }
type Page = { items: Report[]; total: number; page: number; pages: number }

const STATUS_TABS = [
  { value: 'open', label: 'Open' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'actioned', label: 'Actioned' },
] as const

export function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'open'
  const query = params.toString()
  const queryClient = useQueryClient()

  const reports = useQuery({
    queryKey: ['reports', query],
    queryFn: () => api<Page>(`/api/admin/reports?${query}`),
  })

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api(`/api/admin/reports/${id}`, { method: 'POST', body: { action } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['reports'] }),
  })

  function setStatus(next: string) {
    const merged = new URLSearchParams(params)
    merged.set('status', next)
    merged.delete('page')
    setParams(merged)
  }

  if (reports.isLoading) return <PageLoadingSkeleton variant="list" />

  const data = reports.data

  return (
    <div>
      <AdminPageHeader />
      <Tabs value={status} onValueChange={setStatus} className="mb-4">
        <TabsList>
          {STATUS_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="space-y-3">
        {data?.items.length === 0 ? <p className="text-muted-foreground">No {status} reports.</p> : null}
        {data?.items.map((report) => (
          <Card key={report.id} className="transition-all duration-300 hover:shadow-lg">
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link className="font-semibold text-primary" to={`/admin/vehicles/${report.vehicleId}`}>
                  {report.vehicleTitle}
                </Link>
                <Badge variant="outline" className={statusBadgeClass(report.status)}>
                  {report.status}
                </Badge>
              </div>
              <p className="text-sm">{report.reason}</p>
              <p className="text-xs text-muted-foreground">Reported by {report.reporterName}</p>
              {status === 'open' ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="transition-all duration-300 hover:scale-105" onClick={() => act.mutate({ id: report.id, action: 'dismiss' })}>
                    Dismiss
                  </Button>
                  <Button variant="destructive" onClick={() => act.mutate({ id: report.id, action: 'takedown' })}>
                    Take down
                  </Button>
                  <Button variant="destructive" onClick={() => act.mutate({ id: report.id, action: 'block' })}>
                    Block seller
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {data ? <AdminPagination page={data.page} pages={data.pages} total={data.total} /> : null}
    </div>
  )
}
