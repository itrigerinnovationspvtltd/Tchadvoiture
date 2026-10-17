import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { assetUrl } from '@/lib/api'
import { buySteps, sellSteps, type ProcessStep } from '@/content/homeMarketing'
import { interactiveCardClass, staggerDelay } from '@/lib/motion'
import { cn } from '@/lib/utils'

function ProcessCard({ step, index }: { step: ProcessStep; index: number }) {
  const [broken, setBroken] = useState(false)

  return (
    <li className="group relative flex flex-col">
      {index < 2 ? (
        <span
          className="pointer-events-none absolute top-[38%] -right-3 z-10 hidden h-px w-6 bg-border md:block lg:-right-4 lg:w-8"
          aria-hidden
        />
      ) : null}
      <article
        className={cn('animate-slide-in-up flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 hover:ring-primary/20', interactiveCardClass)}
        {...staggerDelay(index, 120)}
      >
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-charcoal/5 sm:aspect-[4/3]">
          {!broken ? (
            <img
              src={assetUrl(step.image)}
              alt={step.imageAlt}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground">Photo unavailable</div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent" aria-hidden />
          <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold tracking-wide text-charcoal shadow-sm ring-1 ring-black/5">
            Step {step.step}
          </span>
        </div>
        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <span className="absolute top-3 right-4 text-5xl font-bold leading-none text-charcoal/[0.06]" aria-hidden>
            {step.step}
          </span>
          <h3 className="relative text-lg font-bold text-charcoal sm:text-xl">{step.title}</h3>
          <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          {step.link ? (
            <Button variant="outline" className="relative mt-5 h-10 w-full rounded-full sm:w-auto" asChild>
              <Link to={step.link.href}>
                {step.link.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </article>
    </li>
  )
}

function ProcessGrid({ steps, label }: { steps: ProcessStep[]; label: string }) {
  return (
    <ol className="grid gap-6 md:grid-cols-3 md:gap-5 lg:gap-6" aria-label={label}>
      {steps.map((step, index) => (
        <ProcessCard key={step.step} step={step} index={index} />
      ))}
    </ol>
  )
}

export function HomeProcessSection() {
  return (
    <section className="scroll-mt-24" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How it works</p>
        <h2 id="how-it-works-heading" className="mt-2 text-2xl font-bold text-charcoal lg:text-3xl">
          Buy and sell with a clear, simple process
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Whether you are looking for your next car or listing one for sale, Tchadvoiture guides you from search to conversation—with admin-approved listings at the center.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-3xl bg-muted/30 p-5 ring-1 ring-border/40 sm:mt-12 sm:p-8">
        <Tabs defaultValue="buy" className="w-full gap-0">
          <div className="flex justify-center">
            <TabsList className="h-12 w-full max-w-md rounded-full bg-secondary/60 p-1 sm:max-w-sm">
              <TabsTrigger
                value="buy"
                className="h-10 flex-1 cursor-pointer rounded-full px-4 text-sm font-semibold data-active:bg-primary data-active:text-white"
              >
                Buy a car
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className="h-10 flex-1 cursor-pointer rounded-full px-4 text-sm font-semibold data-active:bg-primary data-active:text-white"
              >
                Sell a car
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="buy" className="mt-8 outline-none sm:mt-10">
            <p className="mb-6 text-center text-sm text-muted-foreground sm:mb-8">
              Find an approved listing, enquire safely, and take the conversation forward with the seller.
            </p>
            <ProcessGrid steps={buySteps} label="Steps to buy a car" />
          </TabsContent>

          <TabsContent value="sell" className="mt-8 outline-none sm:mt-10">
            <p className="mb-6 text-center text-sm text-muted-foreground sm:mb-8">
              Create your account, submit a listing, and start receiving enquiries once an admin approves it.
            </p>
            <ProcessGrid steps={sellSteps} label="Steps to sell a car" />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
