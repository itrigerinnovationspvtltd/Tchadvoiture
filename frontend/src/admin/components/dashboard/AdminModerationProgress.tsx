import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'

export function AdminModerationProgress({
  pending,
  total,
}: {
  pending: number
  total: number
}) {
  const pct = total > 0 ? Math.round((pending / total) * 100) : 0
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (pct / 100) * circumference

  return (
    <Card
      className="animate-slide-in-up gap-0 p-6 transition-all duration-500 hover:shadow-xl"
      style={{ animationDelay: '500ms' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Moderation queue</h2>
        <Link to="/admin/vehicles?status=pending" className="text-xs font-semibold text-primary transition-colors hover:underline">
          Review
        </Link>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              className="text-primary transition-all duration-700"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-foreground">{pct}%</span>
            <span className="text-[10px] text-muted-foreground">pending</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-3xl font-bold tabular-nums text-foreground">{pending}</p>
          <p className="text-sm text-muted-foreground">listings awaiting review</p>
          <p className="mt-1 text-xs text-muted-foreground">{total} total in inventory</p>
        </div>
      </div>
    </Card>
  )
}
