import { useQuery } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { MarketingPageLayout } from '../components/marketing/MarketingPageLayout'
import { api } from '../lib/api'

export function PrivacyPage() {
  const page = useQuery({
    queryKey: ['page', 'privacy'],
    queryFn: () => api<{ title: string; body: string }>('/api/pages/privacy', { auth: false }),
  })

  const paragraphs = page.data?.body.split(/\n\n+/).filter(Boolean) ?? []

  return (
    <MarketingPageLayout
      title={page.data?.title ?? 'Privacy'}
      heroImage="/uploads/demo-crv-moundou.jpg"
      eyebrow="Your data"
      loading={page.isLoading}
      error={page.isError ? page.error : undefined}
    >
      <Card className="mb-8 ring-1 ring-border/60">
        <CardContent className="flex gap-4">
          <Shield className="size-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">
            We designed Tchadvoiture so buyers and sellers can connect without exposing private vehicle or contact details on public pages.
          </p>
        </CardContent>
      </Card>
      <div className="mx-auto max-w-3xl space-y-6">
        {paragraphs.length ? (
          paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="leading-relaxed text-muted-foreground">{page.data?.body}</p>
        )}
      </div>
    </MarketingPageLayout>
  )
}
