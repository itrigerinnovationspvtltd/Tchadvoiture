import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Search, UserRound } from 'lucide-react'
import { z } from 'zod'
import { Alert, AlertDescription, Button, Input, Label, Textarea } from '@/components/ui'
import { AuthPageLayout, authFieldClass, authPrimaryButtonClass } from '../components/auth/AuthPageLayout'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/format'
import type { Role } from '../lib/types'
import { btnLiftClass } from '@/lib/motion'
import { cn } from '@/lib/utils'

const schema = z.object({
  role: z.enum(['buyer', 'individual', 'dealer']),
  name: z.string().trim().min(2, 'Enter your name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().min(6, 'Enter a phone number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  location: z.string().optional(),
  dealershipName: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  businessDetails: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.role === 'dealer' && !value.dealershipName?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['dealershipName'], message: 'Dealership name is required.' })
  }
})

type FormValues = z.infer<typeof schema>

const roles: { id: Role; title: string; text: string; icon: typeof Search }[] = [
  { id: 'buyer', title: 'Buyer', text: 'Browse and send enquiries', icon: Search },
  { id: 'individual', title: 'Individual seller', text: 'List your own cars', icon: UserRound },
  { id: 'dealer', title: 'Dealer', text: 'Unlimited business listings', icon: Building2 },
]

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const form = useForm<FormValues>({
    defaultValues: {
      role: 'buyer',
      name: '',
      email: '',
      phone: '',
      password: '',
      location: '',
      dealershipName: '',
      address: '',
      description: '',
      businessDetails: '',
    },
  })
  const role = form.watch('role')

  return (
    <AuthPageLayout
      wideForm
      eyebrow="Get started"
      title="Join the marketplace"
      description="Free registration. Pick how you will use Tchadvoiture—buy, sell, or run a dealership."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-charcoal">Create your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">All fields marked below are required unless noted.</p>
      </div>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          const parsed = schema.safeParse(values)
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Check the form.')
            return
          }
          setError('')
          try {
            await signup(parsed.data)
            navigate(parsed.data.role === 'buyer' ? '/' : '/my-listings')
          } catch (err) {
            setError(errorMessage(err))
          }
        })}
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-medium text-charcoal">I want to</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {roles.map((item) => {
              const Icon = item.icon
              const selected = role === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => form.setValue('role', item.id)}
                  className={cn(
                    'flex cursor-pointer flex-col items-start rounded-xl border px-3 py-3 text-left transition-all duration-200',
                    selected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm'
                      : 'border-border bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40',
                  )}
                >
                  <Icon className={cn('size-5', selected ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                  <span className="mt-2 text-sm font-semibold text-charcoal">{item.title}</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">{item.text}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" className={authFieldClass} autoComplete="name" {...form.register('name')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" className={authFieldClass} autoComplete="tel" {...form.register('phone')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" className={authFieldClass} placeholder="City" autoComplete="address-level2" {...form.register('location')} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" className={authFieldClass} type="email" autoComplete="email" {...form.register('email')} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              className={authFieldClass}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...form.register('password')}
            />
          </div>
        </div>

        {role === 'dealer' ? (
          <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-sm font-semibold text-charcoal">Dealership details</p>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dealership">Dealership name</Label>
                <Input id="dealership" className={authFieldClass} {...form.register('dealershipName')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" className={authFieldClass} autoComplete="street-address" {...form.register('address')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" className="min-h-24 rounded-xl border-border bg-secondary/30" {...form.register('description')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business">Business details</Label>
                <Textarea id="business" className="min-h-24 rounded-xl border-border bg-secondary/30" {...form.register('businessDetails')} />
              </div>
            </div>
          </div>
        ) : null}

        <Button
          type="submit"
          className={cn(authPrimaryButtonClass, btnLiftClass)}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthPageLayout>
  )
}
