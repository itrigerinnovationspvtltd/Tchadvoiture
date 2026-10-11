import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from '@/components/ui'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/format'
import type { Role } from '../lib/types'

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

const roles: { id: Role; title: string; text: string }[] = [
  { id: 'buyer', title: 'Buyer', text: 'Browse cars and send enquiries.' },
  { id: 'individual', title: 'Individual seller', text: 'List a small number of your own cars.' },
  { id: 'dealer', title: 'Dealer', text: 'List unlimited cars for your business.' },
]

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const form = useForm<FormValues>({
    defaultValues: { role: 'buyer', name: '', email: '', phone: '', password: '', location: '', dealershipName: '', address: '', description: '', businessDetails: '' },
  })
  const role = form.watch('role')

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-charcoal">Create your account</CardTitle>
        <CardDescription className="text-slate-600">Registration is free. Choose how you will use Tchadvoiture.</CardDescription>
      </CardHeader>
      <CardContent>
      <form
        className="space-y-4"
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
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="grid gap-3">
          {roles.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={role === item.id ? 'default' : 'outline'}
              className="h-auto w-full flex-col items-start whitespace-normal px-4 py-4 text-left"
              onClick={() => form.setValue('role', item.id)}
            >
              <span className="block font-semibold">{item.title}</span>
              <span className="mt-1 block text-sm font-normal opacity-80">{item.text}</span>
            </Button>
          ))}
        </div>
        <div className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="name">Full name</Label><Input id="name" className="h-10" {...form.register('name')} /></div>
          <div className="grid gap-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" className="h-10" {...form.register('phone')} /></div>
          <div className="grid gap-1.5"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" className="h-10" type="email" {...form.register('email')} /></div>
          <div className="grid gap-1.5"><Label htmlFor="signup-password">Password</Label><Input id="signup-password" className="h-10" type="password" {...form.register('password')} /></div>
          <div className="grid gap-1.5"><Label htmlFor="location">Location</Label><Input id="location" className="h-10" placeholder="City" {...form.register('location')} /></div>
        </div>
        {role === 'dealer' ? (
          <div className="grid gap-4">
            <div className="grid gap-1.5"><Label htmlFor="dealership">Dealership name</Label><Input id="dealership" className="h-10" {...form.register('dealershipName')} /></div>
            <div className="grid gap-1.5"><Label htmlFor="address">Address</Label><Input id="address" className="h-10" {...form.register('address')} /></div>
            <div className="grid gap-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" className="min-h-28" {...form.register('description')} /></div>
            <div className="grid gap-1.5"><Label htmlFor="business">Business details</Label><Textarea id="business" className="min-h-28" {...form.register('businessDetails')} /></div>
          </div>
        ) : null}
        <Button type="submit" className="h-10 w-full" disabled={form.formState.isSubmitting}>Create account</Button>
      </form>
      <p className="mt-4 text-sm">Already registered? <Link to="/login" className="cursor-pointer font-semibold text-primary">Log in</Link></p>
      </CardContent>
    </Card>
  )
}
