import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui'
import { interactiveCardClass } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { MarketingPageLayout } from '../components/marketing/MarketingPageLayout'
import { faqs, MARKETING_HERO_IMAGE } from '../content/faqs'

export function FaqPage() {
  return (
    <MarketingPageLayout title="Questions" heroImage={MARKETING_HERO_IMAGE} eyebrow="FAQ">
      <p className="mx-auto max-w-2xl text-center text-muted-foreground">
        How buying and selling works on Tchadvoiture.
      </p>
      <Accordion type="single" collapsible className={cn('animate-slide-in-up mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-card px-4 sm:px-6', interactiveCardClass)}>
        {faqs.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </MarketingPageLayout>
  )
}
