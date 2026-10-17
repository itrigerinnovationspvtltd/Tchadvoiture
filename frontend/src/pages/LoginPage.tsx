import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Alert, AlertDescription, Button, Input, Label } from '@/components/ui'
import { AuthPageLayout, authFieldClass, authPrimaryButtonClass } from '../components/auth/AuthPageLayout'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/format'
import { btnLiftClass } from '@/lib/motion'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState('')
  const form = useForm<FormValues>({ defaultValues: { email: '', password: '' } })

  return (
    <AuthPageLayout
      eyebrow="Welcome back"
      title="Log in to your account"
      description="Access saved cars, enquiries, and your listings from one place."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-charcoal">Sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use your Tchadvoiture email and password.</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          const parsed = schema.safeParse(values)
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Check the form.')
            return
          }
          setError('')
          try {
            await login(parsed.data.email, parsed.data.password)
            const next = params.get('next') || '/'
            navigate(next.startsWith('/') && !next.startsWith('//') ? next : '/')
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
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            className={authFieldClass}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...form.register('email')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            className={authFieldClass}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...form.register('password')}
          />
        </div>
        <Button
          type="submit"
          className={cn(authPrimaryButtonClass, btnLiftClass)}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Signing in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/cars" className="font-medium text-primary hover:underline">
          Continue browsing without an account
        </Link>
      </p>
    </AuthPageLayout>
  )
}
