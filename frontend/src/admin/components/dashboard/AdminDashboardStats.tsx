import { ArrowUpRight, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'

export type AdminStatItem = {
  title: string
  value: number | string
  hint?: string
  href?: string
  featured?: boolean
  delay?: string
}

export function AdminDashboardStats({ stats }: { stats: AdminStatItem[] }) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const featured = stat.featured
        const inner = (
          <Card
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ animationDelay: stat.delay }}
            className={`cursor-pointer gap-0 p-4 transition-all duration-500 ease-out animate-slide-in-up ${
              featured ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground'
            } ${hoveredCard === index ? 'scale-105 shadow-2xl' : 'shadow-lg'}`}
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className={`text-xs font-medium ${featured ? 'opacity-90' : 'text-muted-foreground'}`}>{stat.title}</h3>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300 ${
                  featured ? 'bg-primary-foreground/20' : 'bg-primary'
                } ${hoveredCard === index ? 'rotate-45' : ''}`}
              >
                <ArrowUpRight className={`h-3 w-3 ${featured ? 'text-primary-foreground' : 'text-primary-foreground'}`} />
              </div>
            </div>
            <p className="mb-2 text-3xl font-bold tabular-nums">{stat.value}</p>
            <div className={`flex items-center gap-1.5 text-xs ${featured ? 'opacity-80' : 'text-muted-foreground'}`}>
              {stat.hint ? (
                <>
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  <span>{stat.hint}</span>
                </>
              ) : null}
            </div>
          </Card>
        )

        if (stat.href) {
          return (
            <Link key={stat.title} to={stat.href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {inner}
            </Link>
          )
        }
        return <div key={stat.title}>{inner}</div>
      })}
    </div>
  )
}
