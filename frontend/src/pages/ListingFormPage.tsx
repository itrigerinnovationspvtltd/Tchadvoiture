import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Car, Check, ClipboardCheck, ImagePlus, Images, SlidersHorizontal } from 'lucide-react'
import { z } from 'zod'
import { PageLoadingSkeleton } from '../components/PageLoadingSkeleton'
import { Alert, AlertDescription, Button, Card, CardContent, Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'

const ANY = '__any__'

function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-slate-600">{hint}</p> : null}
    </div>
  )
}

function Choice({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Choose',
  disabled,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <FormField label={label}>
      <Select value={value || ANY} onValueChange={(next) => onValueChange(next === ANY ? '' : next)} disabled={disabled}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
import { api, assetUrl } from '../lib/api'
import { errorMessage, formatPrice } from '../lib/format'
import { useCatalog, useSettings } from '../lib/hooks'
import type { Vehicle, VehicleImage } from '../lib/types'

const steps = [
  { label: 'Vehicle', description: 'Tell buyers which car this is and what you are asking.', icon: Car },
  { label: 'Specs', description: 'Add how the car has been used and any extra details.', icon: SlidersHorizontal },
  { label: 'Photos', description: 'Add clear photos. The first one is the cover.', icon: Images },
  { label: 'Review', description: 'Check the listing before you send it for approval.', icon: ClipboardCheck },
]

const stepOne = z.object({
  makeId: z.string().min(1, 'Choose a brand.'),
  modelId: z.string().min(1, 'Choose a model.'),
  vehicleTypeId: z.string().min(1, 'Choose a vehicle type.'),
  manufacturingYear: z.coerce.number().int().min(1950, 'Enter a valid year.'),
  price: z.coerce.number().positive('Enter a price.'),
  location: z.string().trim().min(2, 'Enter a location.'),
})

const stepTwo = z.object({
  fuelTypeId: z.string().min(1, 'Choose a fuel type.'),
  transmissionId: z.string().min(1, 'Choose a transmission.'),
  kilometers: z.coerce.number().min(0, 'Enter kilometers.'),
  owners: z.coerce.number().int().min(1).max(20),
  condition: z.string().min(1, 'Choose a condition.'),
  description: z.string().trim().min(20, 'Description should be at least 20 characters.'),
})

type Draft = {
  makeId: string
  modelId: string
  variant: string
  vehicleTypeId: string
  manufacturingYear: string
  registrationYear: string
  color: string
  location: string
  price: string
  fuelTypeId: string
  transmissionId: string
  kilometers: string
  owners: string
  condition: string
  insured: boolean
  insuranceExpiry: string
  insurancePolicyNumber: string
  registrationNumber: string
  description: string
  specs: { label: string; value: string }[]
  images: VehicleImage[]
}

const empty: Draft = {
  makeId: '', modelId: '', variant: '', vehicleTypeId: '', manufacturingYear: '', registrationYear: '',
  color: '', location: '', price: '', fuelTypeId: '', transmissionId: '', kilometers: '', owners: '1',
  condition: '', insured: false, insuranceExpiry: '', insurancePolicyNumber: '', registrationNumber: '',
  description: '', specs: [], images: [],
}

export function ListingFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const catalog = useCatalog()
  const settings = useSettings()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(empty)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const existing = useQuery({
    queryKey: ['my-vehicle', id],
    enabled: Boolean(id),
    queryFn: () => api<{ vehicle: Vehicle }>(`/api/me/vehicles/${id}`),
  })

  useEffect(() => {
    const vehicle = existing.data?.vehicle
    if (!vehicle) return
    setDraft({
      makeId: vehicle.makeId,
      modelId: vehicle.modelId,
      variant: vehicle.variant,
      vehicleTypeId: vehicle.vehicleTypeId,
      manufacturingYear: String(vehicle.manufacturingYear),
      registrationYear: vehicle.registrationYear ? String(vehicle.registrationYear) : '',
      color: vehicle.color,
      location: vehicle.location,
      price: String(vehicle.price),
      fuelTypeId: vehicle.fuelTypeId,
      transmissionId: vehicle.transmissionId,
      kilometers: String(vehicle.kilometers),
      owners: String(vehicle.owners),
      condition: vehicle.condition,
      insured: vehicle.insured,
      insuranceExpiry: vehicle.insuranceExpiry,
      insurancePolicyNumber: vehicle.insurancePolicyNumber || '',
      registrationNumber: vehicle.registrationNumber || '',
      description: vehicle.description,
      specs: vehicle.specs,
      images: vehicle.images,
    })
  }, [existing.data])

  const models = useMemo(
    () => catalog.data?.makes.find((make) => make.id === draft.makeId)?.models ?? [],
    [catalog.data, draft.makeId],
  )

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function next() {
    const schema = step === 0 ? stepOne : stepTwo
    const parsed = schema.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Check this step.')
      return
    }
    setError('')
    setStep((value) => value + 1)
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append('files', file))
    setUploading(true)
    setError('')
    try {
      const data = await api<{ files: VehicleImage[] }>('/api/me/uploads', { method: 'POST', formData })
      setDraft((current) => ({ ...current, images: [...current.images, ...data.files].slice(0, 12) }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...draft,
        manufacturingYear: Number(draft.manufacturingYear),
        registrationYear: draft.registrationYear ? Number(draft.registrationYear) : null,
        kilometers: Number(draft.kilometers),
        owners: Number(draft.owners),
        price: Number(draft.price),
        specs: draft.specs.filter((spec) => spec.label && spec.value),
      }
      if (id) return api(`/api/me/vehicles/${id}`, { method: 'PATCH', body: payload })
      return api('/api/me/vehicles', { method: 'POST', body: payload })
    },
    onSuccess: () => navigate('/my-listings'),
    onError: (err) => setError(errorMessage(err)),
  })

  if (catalog.isLoading || existing.isLoading) {
    return <PageLoadingSkeleton variant="form" />
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{id ? 'Edit listing' : 'List a car'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Step {step + 1} of {steps.length}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        New listings stay pending until an admin approves them.
        {settings.data ? ` Individual sellers can have ${settings.data.individualListingLimit} pending or active cars.` : ''}
      </p>
      <ol className="mt-8 grid grid-cols-4">
        {steps.map((item, index) => {
          const done = index < step
          const current = index === step
          const Icon = done ? Check : item.icon
          return (
            <li key={item.label} className="relative flex flex-col items-center">
              {index > 0 ? (
                <span className={cn('absolute top-4 right-1/2 h-0.5 w-full', index <= step ? 'bg-primary' : 'bg-border')} aria-hidden />
              ) : null}
              <button
                type="button"
                disabled={index > step}
                aria-current={current ? 'step' : undefined}
                onClick={() => {
                  setError('')
                  setStep(index)
                }}
                className={cn(
                  'relative z-10 flex size-8 items-center justify-center rounded-full border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  current && 'border-primary bg-primary text-white',
                  done && 'cursor-pointer border-primary bg-primary text-white hover:bg-primary/90',
                  !current && !done && 'border-border bg-card text-muted-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="sr-only">{item.label}</span>
              </button>
              <span className={cn('mt-2 text-center text-xs font-medium sm:text-sm', current || done ? 'text-primary' : 'text-muted-foreground')}>{item.label}</span>
            </li>
          )
        })}
      </ol>
      {error ? <div className="mt-4"><Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert></div> : null}

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-charcoal">{steps[step].label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{steps[step].description}</p>

      {step === 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Choice
            label="Brand"
            value={draft.makeId}
            onValueChange={(value) => { update('makeId', value); update('modelId', '') }}
            options={catalog.data?.makes?.map((make) => ({ value: make.id, label: make.name })) ?? []}
          />
          <Choice
            label="Model"
            value={draft.modelId}
            onValueChange={(value) => update('modelId', value)}
            disabled={!draft.makeId}
            options={models.map((model) => ({ value: model.id, label: model.name }))}
          />
          <FormField label="Variant"><Input className="h-10" value={draft.variant} onChange={(event) => update('variant', event.target.value)} /></FormField>
          <Choice
            label="Vehicle type"
            value={draft.vehicleTypeId}
            onValueChange={(value) => update('vehicleTypeId', value)}
            options={catalog.data?.vehicleTypes?.map((item) => ({ value: item.id, label: item.name })) ?? []}
          />
          <FormField label="Manufacturing year"><Input className="h-10" inputMode="numeric" value={draft.manufacturingYear} onChange={(event) => update('manufacturingYear', event.target.value)} /></FormField>
          <FormField label="Registration year"><Input className="h-10" inputMode="numeric" value={draft.registrationYear} onChange={(event) => update('registrationYear', event.target.value)} /></FormField>
          <FormField label="Color"><Input className="h-10" value={draft.color} onChange={(event) => update('color', event.target.value)} /></FormField>
          <FormField label="Location"><Input className="h-10" value={draft.location} onChange={(event) => update('location', event.target.value)} placeholder="City or area" /></FormField>
          <FormField label="Expected price" hint={settings.data?.currencyLabel || 'Number only'}>
            <Input className="h-10" inputMode="decimal" value={draft.price} onChange={(event) => update('price', event.target.value)} />
          </FormField>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Choice
            label="Fuel"
            value={draft.fuelTypeId}
            onValueChange={(value) => update('fuelTypeId', value)}
            options={catalog.data?.fuels?.map((item) => ({ value: item.id, label: item.name })) ?? []}
          />
          <Choice
            label="Transmission"
            value={draft.transmissionId}
            onValueChange={(value) => update('transmissionId', value)}
            options={catalog.data?.transmissions?.map((item) => ({ value: item.id, label: item.name })) ?? []}
          />
          <FormField label="Kilometers"><Input className="h-10" inputMode="numeric" value={draft.kilometers} onChange={(event) => update('kilometers', event.target.value)} /></FormField>
          <FormField label="Owners"><Input className="h-10" inputMode="numeric" value={draft.owners} onChange={(event) => update('owners', event.target.value)} /></FormField>
          <Choice
            label="Condition"
            value={draft.condition}
            onValueChange={(value) => update('condition', value)}
            options={catalog.data?.conditions?.map((condition) => ({ value: condition, label: condition })) ?? []}
          />
          <label className="flex cursor-pointer items-end gap-2 pb-3 text-sm font-medium">
            <Checkbox checked={draft.insured} onCheckedChange={(checked) => update('insured', checked === true)} /> Insured
          </label>
          {draft.insured ? (
            <>
              <FormField label="Insurance expiry"><Input className="h-10" value={draft.insuranceExpiry} onChange={(event) => update('insuranceExpiry', event.target.value)} placeholder="YYYY-MM" /></FormField>
              <FormField label="Policy number" hint="Only you and admin can see this"><Input className="h-10" value={draft.insurancePolicyNumber} onChange={(event) => update('insurancePolicyNumber', event.target.value)} /></FormField>
            </>
          ) : null}
          <FormField label="Registration number" hint="Hidden on the public page"><Input className="h-10" value={draft.registrationNumber} onChange={(event) => update('registrationNumber', event.target.value)} /></FormField>
          <div className="sm:col-span-2">
            <FormField label="Description"><Textarea className="min-h-28" value={draft.description} onChange={(event) => update('description', event.target.value)} /></FormField>
          </div>
          <div className="space-y-3 rounded-xl bg-muted/50 p-4 sm:col-span-2">
            <p className="text-sm font-medium">Extra specifications</p>
            {draft.specs.map((spec, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input className="h-10 bg-card" value={spec.label} placeholder="Label" aria-label="Specification label" onChange={(event) => {
                  const specs = [...draft.specs]
                  specs[index] = { ...spec, label: event.target.value }
                  update('specs', specs)
                }} />
                <Input className="h-10 bg-card" value={spec.value} placeholder="Value" aria-label="Specification value" onChange={(event) => {
                  const specs = [...draft.specs]
                  specs[index] = { ...spec, value: event.target.value }
                  update('specs', specs)
                }} />
                <Button variant="outline" className="cursor-pointer" onClick={() => update('specs', draft.specs.filter((_, specIndex) => specIndex !== index))}>Remove</Button>
              </div>
            ))}
            <Button variant="outline" className="cursor-pointer" onClick={() => update('specs', [...draft.specs, { label: '', value: '' }])}>Add specification</Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center transition-colors duration-200 hover:border-primary hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
            <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
            <span className="mt-2 text-sm font-medium text-charcoal">Choose photos</span>
            <span className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or WebP. Up to 12 images, 5 MB each.</span>
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void onFiles(event.target.files)} />
          </label>
          {uploading ? <p className="text-sm text-muted-foreground">Uploading photos…</p> : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {draft.images.map((image) => (
              <div key={image.filename} className="overflow-hidden rounded-xl border border-border">
                <img src={assetUrl(image.url)} alt="" className="aspect-[4/3] w-full object-cover" />
                <Button variant="destructive" className="w-full cursor-pointer rounded-none" type="button" onClick={() => update('images', draft.images.filter((item) => item.filename !== image.filename))}>Remove</Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-[11rem_1fr] sm:items-start">
          {draft.images[0] ? (
            <img src={assetUrl(draft.images[0].url)} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">No photo</div>
          )}
          <div>
            <p className="text-lg font-bold text-charcoal">{draft.manufacturingYear} {catalog.data?.makes.find((make) => make.id === draft.makeId)?.name} {models.find((model) => model.id === draft.modelId)?.name} {draft.variant}</p>
            <p className="mt-1 font-semibold text-primary">{formatPrice(Number(draft.price) || 0, settings.data?.currencyLabel)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{draft.location || '—'}</dd></div>
              <div><dt className="text-muted-foreground">Kilometers</dt><dd className="font-medium">{draft.kilometers || '0'} km</dd></div>
              <div><dt className="text-muted-foreground">Owners</dt><dd className="font-medium">{draft.owners}</dd></div>
              <div><dt className="text-muted-foreground">Condition</dt><dd className="font-medium">{draft.condition || '—'}</dd></div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">Plate number and policy number stay private.</p>
          </div>
        </div>
      ) : null}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between gap-3">
        {step > 0 ? <Button variant="outline" className="cursor-pointer" onClick={() => { setError(''); setStep((value) => value - 1) }}>Back</Button> : <span />}
        {step < 2 ? <Button className="cursor-pointer" onClick={next}>Continue</Button> : null}
        {step === 2 ? (
          <Button className="cursor-pointer" onClick={() => {
            if (!draft.images.length) {
              setError('Add at least one photo.')
              return
            }
            setError('')
            setStep(3)
          }}>Review</Button>
        ) : null}
        {step === 3 ? <Button className="cursor-pointer" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Submitting…' : id ? 'Save changes' : 'Submit for approval'}</Button> : null}
      </div>
    </div>
  )
}
