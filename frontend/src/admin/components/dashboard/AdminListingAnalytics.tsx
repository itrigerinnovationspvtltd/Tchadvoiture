import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui'

const barColors = ['#059669', '#047857', '#10b981', '#065f46']

type Segment = { label: string; value: number; key: string }

export function AdminListingAnalytics({ segments }: { segments: Segment[] }) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const chartData = segments.map((s) => ({ name: s.label, value: s.value, key: s.key }))
  const total = segments.reduce((acc, s) => acc + s.value, 0)

  return (
    <Card
      className="interactive-card animate-slide-in-up gap-0 bg-gradient-to-br from-background to-muted/20 p-6 transition-all duration-500"
      style={{ animationDelay: '400ms' }}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Listing mix</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span>{total} total listings</span>
        </div>
      </div>

      <div className="relative mb-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="adminBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="text-muted/20" stroke="currentColor" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-muted-foreground" />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-muted-foreground" allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0]?.payload as { name: string; value: number }
                return (
                  <div className="rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background shadow-lg">
                    <p className="font-bold">{row.value}</p>
                    <p className="text-[10px] opacity-80">{row.name}</p>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="value"
              fill="url(#adminBarGradient)"
              radius={[12, 12, 12, 12]}
              maxBarSize={60}
              onMouseEnter={(_data, index) => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.key}
                  fill={hoveredBar === index ? barColors[index % barColors.length] : 'url(#adminBarGradient)'}
                  className="transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
