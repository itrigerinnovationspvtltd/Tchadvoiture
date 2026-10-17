import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageLoadingSkeleton } from '../../components/PageLoadingSkeleton'
import { Alert, AlertDescription, Button, Card, CardContent, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@/components/ui'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { adminPrimaryButtonClass } from '../components/adminControls'
import { api } from '../lib/api'

type Page = { slug: string; title: string; body: string }
type Announcement = { id: string; title: string; body: string }

export function ContentPage() {
  const queryClient = useQueryClient()
  const pages = useQuery({ queryKey: ['admin-pages'], queryFn: () => api<{ pages: Page[] }>('/api/admin/pages') })
  const announcements = useQuery({ queryKey: ['announcements'], queryFn: () => api<{ announcements: Announcement[] }>('/api/admin/announcements') })
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const post = useMutation({
    mutationFn: () => api('/api/admin/announcements', { method: 'POST', body: { title, body } }),
    onSuccess: () => {
      setTitle('')
      setBody('')
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not post.'),
  })

  const savePage = useMutation({
    mutationFn: (page: Page) => api(`/api/admin/pages/${page.slug}`, { method: 'PUT', body: page }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-pages'] }),
  })

  if (pages.isLoading) return <PageLoadingSkeleton variant="form" />

  return (
    <div className="space-y-4">
      <AdminPageHeader />

      <Tabs defaultValue="announcements">
        <TabsList className="mb-2 w-full justify-start sm:w-auto">
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-0 max-w-xl space-y-3">
          <p className="text-sm text-muted-foreground">Sent to every active user as an in-app notification.</p>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="announce-title">Title</Label>
            <Input id="announce-title" className="h-10" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="announce-body">Message</Label>
            <Textarea id="announce-body" className="min-h-28" value={body} onChange={(event) => setBody(event.target.value)} />
          </div>
          <Button className={adminPrimaryButtonClass} onClick={() => post.mutate()} disabled={post.isPending}>
            Publish
          </Button>
          <ul className="space-y-2 text-sm">
            {announcements.data?.announcements.map((item) => (
              <li key={item.id}>
                <Card className="transition-all duration-300 hover:shadow-lg">
                  <CardContent>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="pages" className="mt-0 space-y-6">
          {pages.data?.pages.map((page) => (
            <form
              key={page.slug}
              className="contents"
              onSubmit={(event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                savePage.mutate({ slug: page.slug, title: String(form.get('title') || ''), body: String(form.get('body') || '') })
              }}
            >
              <Card className="max-w-2xl transition-all duration-300 hover:shadow-lg">
                <CardContent className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{page.slug}</p>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${page.slug}-title`}>Title</Label>
                    <Input id={`${page.slug}-title`} name="title" className="h-10" defaultValue={page.title} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${page.slug}-body`}>Body</Label>
                    <Textarea id={`${page.slug}-body`} name="body" className="min-h-28" defaultValue={page.body} />
                  </div>
                  <Button type="submit" className={adminPrimaryButtonClass}>
                    Save page
                  </Button>
                </CardContent>
              </Card>
            </form>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
