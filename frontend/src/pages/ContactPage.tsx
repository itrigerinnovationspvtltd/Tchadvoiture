import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MessageSquare } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import { btnLiftClass, interactiveCardClass, staggerDelay } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { MarketingPageLayout } from '../components/marketing/MarketingPageLayout'
import { PLATFORM_SUPPORT_EMAIL } from '../content/faqs'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

export function ContactPage() {
  const { user } = useAuth()
  const sellHref = user && user.role !== 'buyer' ? '/my-listings/new' : '/signup'
  const page = useQuery({
    queryKey: ['page', 'contact'],
    queryFn: () => api<{ title: string; body: string }>('/api/pages/contact', { auth: false }),
  })

  return (
    <MarketingPageLayout
      title={page.data?.title ?? 'Contact'}
      heroImage="/uploads/demo-camry-ndjamena.jpg"
      eyebrow="Get in touch"
      loading={page.isLoading}
      error={page.isError ? page.error : undefined}
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="leading-relaxed text-muted-foreground">{page.data?.body}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className={cn('cursor-pointer rounded-full', btnLiftClass)}>
              <Link to="/cars">Browse cars</Link>
            </Button>
            <Button asChild variant="outline" className={cn('cursor-pointer rounded-full', btnLiftClass)}>
              <Link to={sellHref}>{user && user.role !== 'buyer' ? 'List a car' : 'Sign up to sell'}</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          <Card className={cn('animate-slide-in-up ring-1 ring-border/60', interactiveCardClass)} {...staggerDelay(0, 100)}>
            <CardContent className="flex gap-4">
              <MessageSquare className="size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="font-semibold text-charcoal">Ask about a specific car</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open the listing and send an enquiry. The seller replies in Enquiries; their phone is not public.
                </p>
                <Link to="/cars" className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover">
                  Find a car <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className={cn('animate-slide-in-up ring-1 ring-border/60', interactiveCardClass)} {...staggerDelay(1, 100)}>
            <CardContent className="flex gap-4">
              <Mail className="size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="font-semibold text-charcoal">Platform help</h2>
                <p className="mt-1 text-sm text-muted-foreground">Accounts, listings, and general questions about Tchadvoiture.</p>
                <a
                  href={`mailto:${PLATFORM_SUPPORT_EMAIL}`}
                  className="mt-2 inline-block cursor-pointer text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  {PLATFORM_SUPPORT_EMAIL}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketingPageLayout>
  )
}
