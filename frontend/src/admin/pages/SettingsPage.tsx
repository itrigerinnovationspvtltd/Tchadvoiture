import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription, Button, Input, Label, Skeleton } from '@/components/ui'
import { api } from '../lib/api'

type Settings = { individualListingLimit: number; currencyLabel: string }

export function SettingsPage() {
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api<Settings>('/api/settings', { auth: false }) })
  const [limit, setLimit] = useState('')
  const [label, setLabel] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!settings.data || loaded) return
    setLimit(String(settings.data.individualListingLimit))
    setLabel(settings.data.currencyLabel)
    setLoaded(true)
  }, [settings.data, loaded])

  const save = useMutation({
    mutationFn: () => api('/api/admin/settings', { method: 'PUT', body: { individualListingLimit: Number(limit), currencyLabel: label } }),
    onSuccess: () => {
      setMessage('Settings saved.')
      setError('')
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not save.'),
  })

  if (settings.isLoading) return <div className="flex min-h-40 items-center justify-center"><Skeleton className="h-8 w-40" /></div>

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="limit">Individual seller listing limit</Label>
        <Input id="limit" className="h-10" inputMode="numeric" value={limit} onChange={(event) => setLimit(event.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="currency">Currency label</Label>
        <Input id="currency" className="h-10" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Leave blank to show the number only" />
      </div>
      <Button onClick={() => save.mutate()}>Save settings</Button>
    </div>
  )
}
