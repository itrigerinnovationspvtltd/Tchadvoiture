import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Fuel, Gauge, Heart, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton, Textarea, statusBadgeClass } from '@/components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage, formatKm, formatPrice, sellerLabel } from '../lib/format'
import { useSettings } from '../lib/hooks'
import type { Vehicle } from '../lib/types'
import { rememberVehicle } from '../lib/recentlyViewed'
import { useCompareIds } from '../lib/compare'
import { CompareToggle } from '../components/CompareControls'

function specCells(vehicle: Vehicle) {
  const built: [string, string][] = [
    ['Kilometers', formatKm(vehicle.kilometers)],
    ['Transmission', vehicle.transmissionName || '—'],
    ['Body type', vehicle.vehicleTypeName || '—'],
    ['Fuel', vehicle.fuelName || '—'],
    ['Owners', vehicle.owners === 1 ? '1 owner' : `${vehicle.owners} owners`],
    ['Condition', vehicle.condition || '—'],
    ['Color', vehicle.color || '—'],
    ['Insurance', vehicle.insured ? `Yes${vehicle.insuranceExpiry ? `, until ${vehicle.insuranceExpiry}` : ''}` : 'No'],
  ]
  const extra = vehicle.specs
    .filter((spec) => spec.label && spec.value)
    .map((spec) => [spec.label, spec.value] as [string, string])
  return [...built, ...extra]
}

export function VehiclePage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const settings = useSettings()
  const compareIds = useCompareIds()
  const [photo, setPhoto] = useState(0)
  const [more, setMore] = useState(false)
  const [message, setMessage] = useState('I am interested in this car. Please contact me.')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [copied, setCopied] = useState(false)

  const listing = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, { auth: Boolean(user) }),
  })
  const vehicle = listing.data?.vehicle

  useEffect(() => {
    setPhoto(0)
    setMore(false)
  }, [id])

  useEffect(() => {
    if (vehicle?.id) rememberVehicle(vehicle.id)
  }, [vehicle?.id])

  const favourite = useMutation({
    mutationFn: async () => {
      if (!vehicle) return
      if (vehicle.favourited) await api(`/api/me/wishlist/${vehicle.id}`, { method: 'DELETE' })
      else await api('/api/me/wishlist', { method: 'POST', body: { vehicleId: vehicle.id } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicle', id] }),
  })

  const enquire = useMutation({
    mutationFn: () => api('/api/me/enquiries', { method: 'POST', body: { vehicleId: id, message } }),
    onSuccess: () => {
      setNotice('Your enquiry was sent to the seller.')
      setError('')
    },
    onError: (err) => setError(errorMessage(err)),
  })

  const report = useMutation({
    mutationFn: () => api('/api/me/reports', { method: 'POST', body: { vehicleId: id, reason } }),
    onSuccess: () => {
      setReportOpen(false)
      setReason('')
      setNotice('Thanks. An admin will review this report.')
      setError('')
    },
    onError: (err) => setError(errorMessage(err)),
  })

  async function share() {
    if (!vehicle) return
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: vehicle.title, url })
      } catch {
        /* user cancelled */
      }
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  if (listing.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>
  if (!vehicle) return <Alert variant="destructive"><AlertDescription>{errorMessage(listing.error) || 'Listing not found.'}</AlertDescription></Alert>

  const sellerName = sellerLabel(vehicle.sellerRole, vehicle.seller)
  const heading = [vehicle.modelName, vehicle.variant].filter(Boolean).join(' ') || vehicle.title
  const images = vehicle.images
  const left = images[photo]
  const right = images.length > 1 ? images[(photo + 1) % images.length] : undefined
  const description = vehicle.description.trim()
  const long = description.length > 160
  const shown = more || !long ? description : `${description.slice(0, 160).trim()}…`
  const facts = [
    { icon: Calendar, value: String(vehicle.manufacturingYear), label: 'Year' },
    { icon: Gauge, value: formatKm(vehicle.kilometers), label: 'Kilometers' },
    { icon: Fuel, value: vehicle.fuelName || '—', label: 'Fuel' },
  ]

  return (
    <div className={compareIds.length ? 'pb-24' : undefined}>
      <section className="relative min-h-[28rem] overflow-hidden rounded-2xl bg-muted lg:min-h-[34rem]">
        {images.length > 1 ? (
          <div className="absolute inset-0 grid grid-cols-2">
            <img src={left?.url} alt="" className="size-full object-cover" />
            <img src={right?.url} alt="" className="size-full object-cover" />
          </div>
        ) : left ? (
          <img src={left.url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-charcoal/25" />
        <div className="relative z-10 flex min-h-[28rem] items-center justify-center p-4 lg:min-h-[34rem] lg:p-8">
          <article className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-lg">
            <p className="text-sm text-muted-foreground">{vehicle.makeName}</p>
            <h1 className="text-3xl font-bold text-charcoal">{heading}</h1>
            {description ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {shown}
                {long ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="cursor-pointer font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
                      aria-expanded={more}
                      onClick={() => setMore((value) => !value)}
                    >
                      {more ? 'less' : 'more'}
                    </button>
                  </>
                ) : null}
              </p>
            ) : null}
            <p className="mt-4 text-2xl font-bold text-charcoal">{formatPrice(vehicle.price, settings.data?.currencyLabel)}</p>
            <p className="text-sm text-muted-foreground">{vehicle.location}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
              {facts.map((fact) => (
                <div key={fact.label} className="min-w-0 text-center">
                  <fact.icon className="mx-auto size-5 text-muted-foreground" aria-hidden />
                  <p className="mt-2 truncate text-sm font-semibold text-charcoal">{fact.value}</p>
                  <p className="text-xs text-muted-foreground">{fact.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <CompareToggle id={vehicle.id} className="sm:mr-auto" />
              <Button
                type="button"
                className="h-11 bg-charcoal text-white hover:bg-charcoal/90"
                onClick={() => document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Send an enquiry
              </Button>
            </div>
          </article>
        </div>
      </section>

      {images.length > 1 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <Button
              key={`${image.filename}-${index}`}
              type="button"
              variant="outline"
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={photo === index}
              onClick={() => setPhoto(index)}
              className={cn('h-16 w-24 overflow-hidden p-0', photo === index && 'border-primary')}
            >
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </Button>
          ))}
        </div>
      ) : null}

      <section className="mt-8 rounded-2xl bg-charcoal px-4 py-10 text-white sm:px-8" aria-labelledby="specs-heading">
        <h2 id="specs-heading" className="text-center text-2xl font-bold">{heading} specifications</h2>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specCells(vehicle).map(([label, value]) => (
            <div key={`${label}-${value}`} className="rounded-xl bg-white/10 p-4">
              <dt className="text-sm text-white/70">{label}</dt>
              <dd className="mt-2 text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardContent>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{vehicle.sellerRole === 'dealer' ? 'Dealer' : 'Individual seller'}</p>
            <Link to={`/sellers/${vehicle.seller.id}`} className="mt-1 block text-lg font-bold text-charcoal hover:text-primary">{sellerName}</Link>
            <p className="text-sm text-muted-foreground">{vehicle.seller.location}</p>
            <Button variant="link" className="mt-2 h-auto px-0" asChild>
              <Link to={`/sellers/${vehicle.seller.id}`}>View all their cars</Link>
            </Button>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" className="h-11" onClick={() => (user ? favourite.mutate() : navigate(`/login?next=/cars/${id}`))}>
                <Heart className={cn('h-5 w-5', vehicle.favourited && 'fill-primary text-primary')} />
                {vehicle.favourited ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" className="h-11" onClick={() => void share()}>
                <Share2 className="h-5 w-5" /> {copied ? 'Link copied' : 'Share'}
              </Button>
              <Button variant="outline" className="h-11" onClick={() => (user ? setReportOpen(true) : navigate(`/login?next=/cars/${id}`))}>
                Report
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card id="enquiry">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-charcoal">Send an enquiry</CardTitle>
            <CardDescription>The seller’s phone stays private. They will see your name and phone from your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notice ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
            {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
            {user ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  enquire.mutate()
                }}
              >
                <Textarea className="min-h-28" value={message} onChange={(event) => setMessage(event.target.value)} aria-label="Message" />
                <Button type="submit" className="h-11 cursor-pointer" disabled={enquire.isPending}>Send enquiry</Button>
              </form>
            ) : (
              <Button asChild className="h-11"><Link to={`/login?next=/cars/${id}`}>Log in to enquire</Link></Button>
            )}
          </CardContent>
        </Card>
        {reportOpen ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-charcoal">Report this listing</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  report.mutate()
                }}
              >
                <Badge variant="outline" className={statusBadgeClass('open')}>open</Badge>
                <Textarea className="min-h-28" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What is wrong with this listing?" />
                <div className="flex gap-2">
                  <Button type="submit" variant="destructive" className="h-11" disabled={report.isPending}>Submit report</Button>
                  <Button variant="outline" className="h-11" type="button" onClick={() => setReportOpen(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
