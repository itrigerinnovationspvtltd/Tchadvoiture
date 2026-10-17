import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Car, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { interactiveCardClass, staggerDelay } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { MarketingPageLayout } from '../components/marketing/MarketingPageLayout'
import { MARKETING_HERO_IMAGE } from '../content/faqs'
import { api } from '../lib/api'

export function AboutPage() {
  const page = useQuery({
    queryKey: ['page', 'about'],
    queryFn: () => api<{ title: string; body: string }>('/api/pages/about', { auth: false }),
  })

  return (
    <MarketingPageLayout
      title={page.data?.title ?? 'About Tchadvoiture'}
      heroImage={MARKETING_HERO_IMAGE}
      eyebrow="Our marketplace"
      loading={page.isLoading}
      error={page.isError ? page.error : undefined}
    >
      <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{page.data?.body}</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: BadgeCheck, title: 'Admin-approved listings', text: 'Every car is reviewed before it appears in search.' },
          { icon: Users, title: 'Dealers and individuals', text: 'Buy from a dealership or a private seller with clear seller type.' },
          { icon: Car, title: 'Built for Chad', text: 'Search by brand, city, price, and body type in one place.' },
        ].map((item, index) => (
          <Card
            key={item.title}
            className={cn('animate-slide-in-up ring-1 ring-border/60', interactiveCardClass)}
            {...staggerDelay(index, 100)}
          >
            <CardContent>
              <item.icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-semibold text-charcoal">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingPageLayout>
  )
}
