import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PageLoadingSkeleton } from '../../components/PageLoadingSkeleton'
import { Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { adminInputClass, adminPrimaryButtonClass } from '../components/adminControls'
import { api } from '../lib/api'
import { useAuth, type Admin } from '../lib/auth'

type Settings = { individualListingLimit: number; currencyLabel: string }

const TAB_VALUES = ['account', 'security', 'platform'] as const
type TabValue = (typeof TAB_VALUES)[number]

function parseTab(value: string | null): TabValue {
  if (value && TAB_VALUES.includes(value as TabValue)) return value as TabValue
  return 'account'
}

export function SettingsPage() {
  const { admin, refreshAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))

  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api<Settings>('/api/settings', { auth: false }) })

  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [label, setLabel] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [accountMessage, setAccountMessage] = useState('')
  const [accountError, setAccountError] = useState('')
  const [securityMessage, setSecurityMessage] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [platformMessage, setPlatformMessage] = useState('')
  const [platformError, setPlatformError] = useState('')
  const [platformLoaded, setPlatformLoaded] = useState(false)

  useEffect(() => {
    if (admin) setName(admin.name)
  }, [admin])

  useEffect(() => {
    if (!settings.data || platformLoaded) return
    setLimit(String(settings.data.individualListingLimit))
    setLabel(settings.data.currencyLabel)
    setPlatformLoaded(true)
  }, [settings.data, platformLoaded])

  const saveAccount = useMutation({
    mutationFn: () => api<{ admin: Admin }>('/api/admin/auth/me', { method: 'PATCH', body: { name } }),
    onSuccess: async (data) => {
      await refreshAdmin(data.admin)
      setAccountMessage('Profile updated.')
      setAccountError('')
    },
    onError: (err) => setAccountError(err instanceof Error ? err.message : 'Could not save profile.'),
  })

  const changePassword = useMutation({
    mutationFn: () => api('/api/admin/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
    onSuccess: () => {
      setSecurityMessage('Password updated. Other sessions were signed out.')
      setSecurityError('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => setSecurityError(err instanceof Error ? err.message : 'Could not change password.'),
  })

  const savePlatform = useMutation({
    mutationFn: () => api('/api/admin/settings', { method: 'PUT', body: { individualListingLimit: Number(limit), currencyLabel: label } }),
    onSuccess: () => {
      setPlatformMessage('Platform settings saved.')
      setPlatformError('')
    },
    onError: (err) => setPlatformError(err instanceof Error ? err.message : 'Could not save.'),
  })

  if (settings.isLoading) return <PageLoadingSkeleton variant="form" />

  return (
    <div className="max-w-3xl space-y-4">
      <AdminPageHeader description="Manage your admin account, password, and marketplace defaults." />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = new URLSearchParams(searchParams)
          next.set('tab', value)
          setSearchParams(next, { replace: true })
        }}
      >
        <TabsList className="mb-2 w-full justify-start sm:w-auto">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-0">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {accountMessage ? <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{accountMessage}</p> : null}
              {accountError ? (
                <Alert variant="destructive">
                  <AlertDescription>{accountError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-1.5">
                <Label htmlFor="admin-name">Display name</Label>
                <Input id="admin-name" className={adminInputClass} value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" className={adminInputClass} value={admin?.email ?? ''} readOnly disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
              <Button className={adminPrimaryButtonClass} disabled={saveAccount.isPending} onClick={() => saveAccount.mutate()}>
                Save profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Change password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityMessage ? <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{securityMessage}</p> : null}
              {securityError ? (
                <Alert variant="destructive">
                  <AlertDescription>{securityError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-1.5">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  className={adminInputClass}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  className={adminInputClass}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  className={adminInputClass}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <Button
                className={adminPrimaryButtonClass}
                disabled={changePassword.isPending}
                onClick={() => {
                  if (newPassword !== confirmPassword) {
                    setSecurityError('New passwords do not match.')
                    setSecurityMessage('')
                    return
                  }
                  changePassword.mutate()
                }}
              >
                Update password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="mt-0">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Marketplace defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {platformMessage ? <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{platformMessage}</p> : null}
              {platformError ? (
                <Alert variant="destructive">
                  <AlertDescription>{platformError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-1.5">
                <Label htmlFor="limit">Individual seller listing limit</Label>
                <Input id="limit" className={adminInputClass} inputMode="numeric" value={limit} onChange={(event) => setLimit(event.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="currency">Currency label</Label>
                <Input
                  id="currency"
                  className={adminInputClass}
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Leave blank to show the number only"
                />
              </div>
              <Button className={adminPrimaryButtonClass} disabled={savePlatform.isPending} onClick={() => savePlatform.mutate()}>
                Save platform settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
