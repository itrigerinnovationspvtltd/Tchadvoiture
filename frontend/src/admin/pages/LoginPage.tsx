import { Car, CheckCircle2, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { adminPrimaryButtonClass } from '../components/adminControls'
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
          ? 'relative overflow-hidden border-b border-border bg-primary/10 px-6 py-8'
          : 'relative flex flex-col justify-center overflow-hidden bg-primary/10 px-10 py-12 lg:min-h-full lg:px-12 lg:py-16'
      }
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 hover:scale-110">
            <Car className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Tchad<span className="text-primary">voiture</span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground lg:text-base">Administration portal</p>
        {!compact ? (
          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-foreground/90 lg:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
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
    <div className="admin-login relative min-h-dvh bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-2">
        <div className="lg:hidden">
          <BrandPanel compact />
        </div>
        <div className="hidden lg:block">
          <BrandPanel />
        </div>
        <div className="flex items-center justify-center px-4 py-10 lg:px-10 lg:py-16">
          <Card className="animate-slide-in-up w-full max-w-md border-border shadow-lg transition-all duration-300 hover:shadow-xl">
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
                    className="h-10 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
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
                    className="h-10 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" className={`h-10 w-full ${adminPrimaryButtonClass}`}>
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
