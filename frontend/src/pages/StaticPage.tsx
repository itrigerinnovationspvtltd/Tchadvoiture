import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription, Skeleton } from '@/components/ui'
import { api } from '../lib/api'
import { errorMessage } from '../lib/format'

export function StaticPage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/^\//, '')
  const page = useQuery({
    queryKey: ['page', slug],
    queryFn: () => api<{ title: string; body: string }>(`/api/pages/${slug}`, { auth: false }),
  })
  if (page.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  if (!page.data) return <Alert variant="destructive"><AlertDescription>{errorMessage(page.error)}</AlertDescription></Alert>
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">{page.data.title}</h1>
      <p className="mt-4 whitespace-pre-wrap leading-7 text-neutral-700">{page.data.body}</p>
    </article>
  )
}
