import { useState } from 'react'
import { assetUrl } from '@/lib/api'
import { interactiveTileClass, staggerDelay } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { whyBentoItems, whyBentoPhotos, whyStats } from '@/content/homeMarketing'

function BentoPhoto({ src, alt, className, index = 0 }: { src: string; alt: string; className?: string; index?: number }) {
  const [broken, setBroken] = useState(false)
  return (
    <div
      className={cn('animate-slide-in-up relative min-h-[12rem] overflow-hidden rounded-2xl bg-muted ring-1 ring-border/40', interactiveTileClass, className)}
      {...staggerDelay(index, 100)}
    >
      {!broken ? (
        <img
          src={assetUrl(src)}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex size-full min-h-[12rem] items-center justify-center text-sm text-muted-foreground">Photo unavailable</div>
      )}
    </div>
  )
}

function BentoTextCard({ num, title, text, className, index = 0 }: { num: string; title: string; text: string; className?: string; index?: number }) {
  return (
    <article
      className={cn('animate-slide-in-up flex flex-col justify-between rounded-2xl bg-card p-6 ring-1 ring-border/60', interactiveTileClass, className)}
      {...staggerDelay(index, 100)}
    >
      <p className="text-4xl font-bold leading-none text-charcoal/15" aria-hidden>
        {num}
      </p>
      <div className="mt-4">
        <h3 className="text-lg font-bold text-charcoal">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </article>
  )
}

export function WhyBentoSection() {
  const items = whyBentoItems
  const photos = whyBentoPhotos

  return (
    <section className="rounded-3xl bg-muted/30 px-5 py-10 ring-1 ring-border/40 sm:px-8 sm:py-12" aria-labelledby="why-heading">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Why Tchadvoiture</p>
          <h2 id="why-heading" className="mt-2 text-2xl font-bold text-charcoal lg:text-3xl">
            A marketplace built for trust and clarity
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Reviewed listings, private enquiries, and transparent seller types—so you can focus on the car, not the noise.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground lg:text-right lg:text-base">
          We combine admin approval with enquiry-based contact, giving buyers confidence and sellers control over when they share their number.
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-12 lg:auto-rows-[minmax(140px,auto)]">
        <BentoPhoto index={0} src={photos[0].src} alt={photos[0].alt} className="lg:col-span-4 lg:row-span-2 lg:min-h-[320px]" />
        <BentoTextCard
          index={1}
          num={items[0].num}
          title={items[0].title}
          text={items[0].text}
          className="lg:col-span-4 lg:row-span-1"
        />
        <BentoPhoto index={2} src={photos[1].src} alt={photos[1].alt} className="lg:col-span-4 lg:row-span-1 lg:min-h-[160px]" />
        <BentoTextCard index={3} num={items[1].num} title={items[1].title} text={items[1].text} className="lg:col-span-3" />
        <BentoTextCard index={4} num={items[2].num} title={items[2].title} text={items[2].text} className="lg:col-span-3" />
        <BentoPhoto index={5} src={photos[2].src} alt={photos[2].alt} className="lg:col-span-6 lg:min-h-[200px]" />
        <BentoTextCard index={6} num={items[3].num} title={items[3].title} text={items[3].text} className="lg:col-span-6" />
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl bg-secondary/50 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        {whyStats.map((stat) => (
          <p key={stat.label} className="text-center text-sm font-semibold text-charcoal sm:text-left">
            {stat.label}
          </p>
        ))}
      </div>
    </section>
  )
}
