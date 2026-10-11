import { Car, CheckCircle2, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { useAuth } from '../lib/auth'

const highlights = [
  { icon: Car, text: 'Review and approve vehicle listings' },
  { icon: Users, text: 'Manage buyers, sellers, and dealers' },
  { icon: Settings, text: 'Configure platform settings and content' },
]

function BrandPanel({ compact }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'relative overflow-hidden bg-gradient-to-br from-primary via-primary to-charcoal px-6 py-8 text-white'
          : 'relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-charcoal px-10 py-12 text-white lg:min-h-full lg:px-12 lg:py-16'
      }
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="relative">
        <p className="text-2xl font-bold tracking-tight lg:text-3xl">
          Tchad<span className="text-accent">voiture</span>
        </p>
        <p className="mt-2 text-sm text-white/80 lg:text-base">Administration portal</p>
        {!compact ? (
          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/90 lg:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 opacity-70 lg:hidden" aria-hidden />
                  {text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@tchadvoiture.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="relative min-h-dvh bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-2">
        <div className="lg:hidden">
          <BrandPanel compact />
        </div>
        <div className="hidden lg:block">
          <BrandPanel />
        </div>
        <div className="flex items-center justify-center px-4 py-10 lg:px-10 lg:py-16">
          <Card className="w-full max-w-md border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>Use your super-admin credentials from the backend environment.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setError('')
                  try {
                    await login(email, password)
                    navigate('/admin')
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Login failed.')
                  }
                }}
              >
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    className="h-10"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    className="h-10"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" className="h-10 w-full">
                  Log in
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Set <span className="font-medium">SUPER_ADMIN_EMAIL</span> and{' '}
                  <span className="font-medium">SUPER_ADMIN_PASSWORD</span> in backend <span className="font-medium">.env</span>.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
