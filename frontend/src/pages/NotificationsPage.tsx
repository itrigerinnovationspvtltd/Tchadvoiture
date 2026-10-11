import type { LucideIcon } from 'lucide-react'
import { Bell, Car, CheckCheck, Inbox, Megaphone, MessageSquare, Shield } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Skeleton, Tabs, TabsList, TabsTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { api } from '../lib/api'
import { errorMessage, formatWhen } from '../lib/format'
import type { Notice } from '../lib/types'

const GROUPS = ['Today', 'Yesterday', 'This week', 'Earlier'] as const

const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  enquiry: { label: 'Enquiry', icon: MessageSquare },
  enquiry_update: { label: 'Enquiry update', icon: MessageSquare },
  listing: { label: 'Listing', icon: Car },
  account: { label: 'Account', icon: Shield },
  announcement: { label: 'Announcement', icon: Megaphone },
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') === 'unread' ? 'unread' : 'all'
  const notices = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<{ items: Notice[]; unreadCount: number }>('/api/me/notifications'),
  })
  const readAll = useMutation({
    mutationFn: () => api('/api/me/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'summary'] })
    },
  })
  const readOne = useMutation({
    mutationFn: (id: string) => api(`/api/me/notifications/${id}`, { method: 'PATCH' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'summary'] })
    },
  })

  const items = notices.data?.items ?? []
  const unread = notices.data?.unreadCount ?? items.filter((item) => !item.read).length
  const visible = filter === 'unread' ? items.filter((item) => !item.read) : items
  const groups = groupNotices(visible)

  function setFilter(value: string) {
    if (value === 'unread') setParams({ filter: 'unread' })
    else setParams({})
  }

  function markIfUnread(item: Notice) {
    if (!item.read) readOne.mutate(item.id)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-charcoal">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {notices.isSuccess
              ? unread === 0
                ? 'You are all caught up.'
                : `${unread} unread ${unread === 1 ? 'notification' : 'notifications'}.`
              : 'Updates about listings, enquiries, and your account.'}
          </p>
        </div>
        <Button
          variant="outline"
          className="cursor-pointer self-start sm:self-auto"
          disabled={unread === 0 || readAll.isPending || !notices.isSuccess}
          onClick={() => readAll.mutate()}
        >
          <CheckCheck />
          {readAll.isPending ? 'Marking…' : 'Mark all read'}
        </Button>
      </div>

      <Tabs className="mt-6" value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all" className="cursor-pointer px-3">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="cursor-pointer px-3">
            Unread
            {unread > 0 ? <span className="tabular-nums text-primary">{unread}</span> : null}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {notices.isLoading ? <NoticeSkeleton /> : null}

      {notices.isError ? (
        <Alert variant="destructive" className="mt-6 px-4 py-3">
          <AlertTitle>Could not load notifications</AlertTitle>
          <AlertDescription>{errorMessage(notices.error)}</AlertDescription>
          <Button variant="outline" className="mt-3 cursor-pointer" type="button" onClick={() => notices.refetch()}>
            Try again
          </Button>
        </Alert>
      ) : null}

      {notices.isSuccess && visible.length === 0 ? (
        <EmptyState
          filter={filter}
          hasRead={items.some((item) => item.read)}
          onShowAll={() => setFilter('all')}
        />
      ) : null}

      {notices.isSuccess && groups.length > 0 ? (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.label} aria-labelledby={`notices-${group.label.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2 id={`notices-${group.label.replace(/\s+/g, '-').toLowerCase()}`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h2>
              <ul className="mt-3 space-y-3">
                {group.items.map((item, index) => (
                  <NoticeRow
                    key={item.id}
                    item={item}
                    pending={readOne.isPending && readOne.variables === item.id}
                    delay={index}
                    onOpen={() => markIfUnread(item)}
                    onRead={() => readOne.mutate(item.id)}
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

function NoticeRow({
  item,
  pending,
  delay,
  onOpen,
  onRead,
}: {
  item: Notice
  pending: boolean
  delay: number
  onOpen: () => void
  onRead: () => void
}) {
  const meta = noticeMeta(item)
  const Icon = meta.icon
  return (
    <li
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:fill-mode-both"
      style={{ animationDelay: `${Math.min(delay, 6) * 40}ms` }}
    >
      <article
        className={cn(
          'relative flex gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors duration-200 sm:gap-4',
          item.read
            ? 'hover:bg-muted/50'
            : 'bg-primary/[0.04] ring-primary/25 hover:bg-primary/[0.07] before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-primary',
          item.link && 'focus-within:ring-2 focus-within:ring-ring',
        )}
      >
        {item.link ? (
          <Link
            to={item.link}
            onClick={onOpen}
            aria-label={`Open ${item.title}`}
            className="absolute inset-0 z-0 cursor-pointer rounded-xl focus-visible:outline-none"
          />
        ) : null}
        <div className={cn('pointer-events-none relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full', meta.wrap)} aria-hidden>
          <Icon className="size-5" />
        </div>
        <div className="pointer-events-none relative z-10 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-charcoal">{item.title}</h3>
                {item.read ? null : <Badge>New</Badge>}
              </div>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {meta.label}
                <span className="sm:hidden">
                  <span aria-hidden> · </span>
                  <time dateTime={item.createdAt} title={formatWhen(item.createdAt)}>{relativeWhen(item.createdAt)}</time>
                </span>
              </p>
            </div>
            <time dateTime={item.createdAt} title={formatWhen(item.createdAt)} className="hidden shrink-0 pt-0.5 text-xs text-muted-foreground sm:inline">
              {relativeWhen(item.createdAt)}
            </time>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item.body}</p>
          <div className="relative z-20 mt-3 flex flex-wrap items-center gap-2">
            {item.link ? (
              <span className="text-sm font-medium text-primary">View</span>
            ) : null}
            {item.read ? null : (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="pointer-events-auto cursor-pointer"
                disabled={pending}
                onClick={onRead}
              >
                {pending ? 'Saving…' : 'Mark read'}
              </Button>
            )}
          </div>
        </div>
      </article>
    </li>
  )
}

function EmptyState({
  filter,
  hasRead,
  onShowAll,
}: {
  filter: 'all' | 'unread'
  hasRead: boolean
  onShowAll: () => void
}) {
  const unreadOnly = filter === 'unread'
  return (
    <div className="mt-6 flex flex-col items-center rounded-xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        {unreadOnly ? <CheckCheck className="size-6" aria-hidden /> : <Inbox className="size-6" aria-hidden />}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-charcoal">
        {unreadOnly ? 'No unread notifications' : 'You are all caught up'}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {unreadOnly
          ? 'Everything in your inbox has been read.'
          : 'Listing updates, enquiries, and account messages will show up here.'}
      </p>
      {unreadOnly && hasRead ? (
        <Button variant="outline" className="mt-5 cursor-pointer" type="button" onClick={onShowAll}>
          Show all
        </Button>
      ) : (
        <Button className="mt-5 cursor-pointer" asChild>
          <Link to="/cars">Browse cars</Link>
        </Button>
      )}
    </div>
  )
}

function NoticeSkeleton() {
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

function noticeMeta(item: Notice) {
  const known = TYPE_META[item.type] ?? { label: 'Update', icon: Bell }
  const text = `${item.type} ${item.title}`.toLowerCase()
  if (/reject|remov|block|deactivat/.test(text)) {
    return { ...known, wrap: 'bg-destructive/10 text-destructive' }
  }
  if (/approv|activat|sold/.test(text)) {
    return { ...known, wrap: 'bg-primary/10 text-primary' }
  }
  return { ...known, wrap: 'bg-secondary text-secondary-foreground' }
}

function groupNotices(items: Notice[]) {
  const buckets = new Map<string, Notice[]>()
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
