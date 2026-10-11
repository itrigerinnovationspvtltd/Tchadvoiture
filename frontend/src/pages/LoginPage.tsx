import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/format'
import { useState } from 'react'

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
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-charcoal">Log in</CardTitle>
        <CardDescription className="text-slate-600">Use the email and password for your Tchadvoiture account.</CardDescription>
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
            await login(parsed.data.email, parsed.data.password)
            const next = params.get('next') || '/'
            navigate(next.startsWith('/') && !next.startsWith('//') ? next : '/')
          } catch (err) {
            setError(errorMessage(err))
          }
        })}
      >
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" className="h-10" type="email" autoComplete="email" {...form.register('email')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" className="h-10" type="password" autoComplete="current-password" {...form.register('password')} />
        </div>
        <Button type="submit" className="h-10 w-full" disabled={form.formState.isSubmitting}>Log in</Button>
      </form>
      <p className="mt-4 text-sm">New here? <Link to="/signup" className="cursor-pointer font-semibold text-primary">Create an account</Link></p>
      </CardContent>
    </Card>
  )
}
