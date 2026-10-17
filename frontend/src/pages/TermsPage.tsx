import { useQuery } from '@tanstack/react-query'
import { MarketingPageLayout } from '../components/marketing/MarketingPageLayout'
import { api } from '../lib/api'

export function TermsPage() {
  const page = useQuery({
    queryKey: ['page', 'terms'],
    queryFn: () => api<{ title: string; body: string }>('/api/pages/terms', { auth: false }),
  })

  const paragraphs = page.data?.body.split(/\n\n+/).filter(Boolean) ?? []

  return (
    <MarketingPageLayout
      title={page.data?.title ?? 'Terms'}
      heroImage="/uploads/demo-corolla-moundou.jpg"
      eyebrow="Legal"
      loading={page.isLoading}
      error={page.isError ? page.error : undefined}
    >
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
