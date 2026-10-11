import { Inbox, MessageSquare, Send } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Tabs, TabsList, TabsTrigger, statusBadgeClass } from '@/components/ui'
import { cn } from '@/lib/utils'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, formatWhen } from '../lib/format'
import type { Enquiry } from '../lib/types'

const GROUPS = ['Today', 'Yesterday', 'This week', 'Earlier'] as const

export function EnquiriesPage() {
  const { user } = useAuth()
  const seller = user?.role !== 'buyer'
  const [params, setParams] = useSearchParams()
  const box: 'inbox' | 'sent' = seller && params.get('box') !== 'sent' ? 'inbox' : 'sent'
  const queryClient = useQueryClient()
  const enquiries = useQuery({
    queryKey: ['enquiries', box],
    queryFn: () => api<{ enquiries: Enquiry[] }>(`/api/me/enquiries?box=${box}`),
  })
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/api/me/enquiries/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enquiries', box] }),
  })

  const items = enquiries.data?.enquiries ?? []
  const groups = groupEnquiries(items)
  const fresh = items.filter((enquiry) => enquiry.status === 'new').length

  function setBox(value: string) {
    if (value === 'sent') setParams({ box: 'sent' })
    else setParams({})
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-charcoal">Enquiries</h1>
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {summary(box, items, enquiries.isSuccess, fresh)}
        </p>
      </div>

      {seller ? (
        <Tabs className="mt-6" value={box} onValueChange={setBox}>
          <TabsList>
            <TabsTrigger value="inbox" className="cursor-pointer px-3">
              Received
              {box === 'inbox' && fresh > 0 ? <span className="tabular-nums text-primary">{fresh}</span> : null}
            </TabsTrigger>
            <TabsTrigger value="sent" className="cursor-pointer px-3">
              Sent
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Enquiries you have sent.</p>
      )}

      {enquiries.isLoading ? <EnquirySkeleton /> : null}

      {enquiries.isError ? (
        <Alert variant="destructive" className="mt-6 px-4 py-3">
          <AlertTitle>Could not load enquiries</AlertTitle>
          <AlertDescription>{errorMessage(enquiries.error)}</AlertDescription>
          <Button variant="outline" className="mt-3 cursor-pointer" type="button" onClick={() => enquiries.refetch()}>
            Try again
          </Button>
        </Alert>
      ) : null}

      {enquiries.isSuccess && items.length === 0 ? <EmptyState box={box} /> : null}

      {enquiries.isSuccess && groups.length > 0 ? (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.label} aria-labelledby={`enquiries-${group.label.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2
                id={`enquiries-${group.label.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {group.label}
              </h2>
              <ul className="mt-3 space-y-3">
                {group.items.map((enquiry) => (
                  <EnquiryRow
                    key={enquiry.id}
                    enquiry={enquiry}
                    received={box === 'inbox'}
                    pending={update.isPending && update.variables?.id === enquiry.id}
                    onStatus={(status) => update.mutate({ id: enquiry.id, status })}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function EnquiryRow({
  enquiry,
  received,
  pending,
  onStatus,
}: {
  enquiry: Enquiry
  received: boolean
  pending: boolean
  onStatus: (status: string) => void
}) {
  const isNew = received && enquiry.status === 'new'
  return (
    <li>
      <article
        className={cn(
          'relative flex gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors duration-200 sm:gap-4',
          isNew && 'bg-primary/[0.04] ring-primary/25 before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-primary',
        )}
      >
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            isNew ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground',
          )}
          aria-hidden
        >
          <MessageSquare className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/cars/${enquiry.vehicleId}`}
                  className="cursor-pointer text-base font-semibold text-charcoal transition-colors duration-200 hover:text-primary"
                >
                  {enquiry.vehicleTitle}
                </Link>
                <Badge variant="outline" className={statusBadgeClass(enquiry.status)}>
                  {enquiry.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {received ? 'Received' : 'Sent'}
                <span className="sm:hidden">
                  <span aria-hidden> · </span>
                  <time dateTime={enquiry.createdAt} title={formatWhen(enquiry.createdAt)}>
                    {relativeWhen(enquiry.createdAt)}
                  </time>
                </span>
              </p>
            </div>
            <time
              dateTime={enquiry.createdAt}
              title={formatWhen(enquiry.createdAt)}
              className="hidden shrink-0 pt-0.5 text-xs text-muted-foreground sm:inline"
            >
              {relativeWhen(enquiry.createdAt)}
            </time>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{enquiry.message}</p>
          {received ? (
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium text-charcoal">{enquiry.buyerName}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <a
                  href={`tel:${enquiry.buyerPhone.replace(/\s/g, '')}`}
                  className="cursor-pointer text-primary transition-colors duration-200 hover:underline"
                >
                  {enquiry.buyerPhone}
                </a>
                <a
                  href={`mailto:${enquiry.buyerEmail}`}
                  className="cursor-pointer text-primary transition-colors duration-200 hover:underline"
                >
                  {enquiry.buyerEmail}
                </a>
              </div>
            </div>
          ) : null}
          {received ? (
            <Select value={enquiry.status} disabled={pending} onValueChange={onStatus}>
              <SelectTrigger className="mt-3 h-10 w-full max-w-xs cursor-pointer" aria-label="Enquiry status">
                {pending ? <span>Saving…</span> : <SelectValue />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </article>
    </li>
  )
}

function EmptyState({ box }: { box: 'inbox' | 'sent' }) {
  const received = box === 'inbox'
  return (
    <div className="mt-6 flex flex-col items-center rounded-xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        {received ? <Inbox className="size-6" aria-hidden /> : <Send className="size-6" aria-hidden />}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-charcoal">
        {received ? 'No received enquiries' : 'No sent enquiries'}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {received
          ? 'When a buyer asks about a listing, it will show up here.'
          : 'Ask a seller about a car and the message will show up here.'}
      </p>
      {received ? null : (
        <Button className="mt-5 cursor-pointer" asChild>
          <Link to="/cars">Browse cars</Link>
        </Button>
      )}
    </div>
  )
}

function EnquirySkeleton() {
  return (
    <div className="mt-6 space-y-3" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function summary(box: 'inbox' | 'sent', items: Enquiry[], ready: boolean, fresh: number) {
  if (!ready) {
    return box === 'inbox' ? 'Messages buyers sent about your listings.' : 'Messages you sent to sellers.'
  }
  const count = items.length
  if (box === 'inbox') {
    if (count === 0) return 'No received enquiries.'
    const noun = count === 1 ? 'enquiry' : 'enquiries'
    if (fresh === 0) return `${count} received ${noun}.`
    return `${count} received ${noun}, ${fresh} still new.`
  }
  if (count === 0) return 'No sent enquiries.'
  return `${count} sent ${count === 1 ? 'enquiry' : 'enquiries'}.`
}

function groupEnquiries(items: Enquiry[]) {
  const buckets = new Map<string, Enquiry[]>()
  for (const item of items) {
    const label = groupLabel(item.createdAt)
    const bucket = buckets.get(label)
    if (bucket) bucket.push(item)
    else buckets.set(label, [item])
  }
  return GROUPS.filter((label) => buckets.has(label)).map((label) => ({
    label,
    items: buckets.get(label) ?? [],
  }))
}

function groupLabel(value: string) {
  const date = new Date(value)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((start.getTime() - dayStart.getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'This week'
  return 'Earlier'
}

function relativeWhen(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'Just now'
  if (diff < hour) {
    const count = Math.floor(diff / minute)
    return `${count} min ago`
  }
  if (diff < day) {
    const count = Math.floor(diff / hour)
    return `${count} hr ago`
  }
  if (diff < 2 * day) return 'Yesterday'
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`
  return formatWhen(value)
}
