import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { Alert, AlertDescription, Button, Input, Label, Textarea } from '@/components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/format'
import type { User } from '../lib/types'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
})

export function AccountPage() {
  const { user, refreshUser, logout } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const passwordForm = useForm({ defaultValues: { currentPassword: '', newPassword: '' } })

  const save = useMutation({
    mutationFn: (body: Partial<User>) => api<{ user: User }>('/api/auth/me', { method: 'PATCH', body }),
    onSuccess: async (data) => {
      await refreshUser(data.user)
      setMessage('Profile saved.')
      setError('')
    },
    onError: (err) => setError(errorMessage(err)),
  })

  if (!user) return null

  async function upload(field: 'avatar' | 'logo', file?: File) {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const data = await api<{ user: User }>(field === 'avatar' ? '/api/auth/avatar' : '/api/auth/logo', { method: 'POST', formData })
      await refreshUser(data.user)
      setMessage('Photo updated.')
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your account</h1>
        <p className="mt-1 text-sm capitalize text-neutral-600">{user.role === 'individual' ? 'Individual seller' : user.role} · {user.email}</p>
      </div>
      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          save.mutate(Object.fromEntries(formData.entries()) as Partial<User>)
        }}
      >
        <div className="grid gap-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" className="h-10" defaultValue={user.name} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" className="h-10" defaultValue={user.phone} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="location">Location</Label><Input id="location" name="location" className="h-10" defaultValue={user.location} /></div>
        {user.role === 'dealer' ? (
          <>
            <div className="grid gap-1.5"><Label htmlFor="dealership">Dealership name</Label><Input id="dealership" name="dealershipName" className="h-10" defaultValue={user.dealershipName} required /></div>
            <div className="grid gap-1.5"><Label htmlFor="address">Address</Label><Input id="address" name="address" className="h-10" defaultValue={user.address} /></div>
            <div className="grid gap-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" className="min-h-28" defaultValue={user.description} /></div>
            <div className="grid gap-1.5"><Label htmlFor="business">Business details</Label><Textarea id="business" name="businessDetails" className="min-h-28" defaultValue={user.businessDetails} /></div>
          </>
        ) : null}
        <Button type="submit" disabled={save.isPending}>Save profile</Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="avatar">Profile photo</Label>
          <Input id="avatar" className="h-10" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload('avatar', event.target.files?.[0])} />
        </div>
        {user.role === 'dealer' ? (
          <div className="grid gap-1.5">
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" className="h-10" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload('logo', event.target.files?.[0])} />
          </div>
        ) : null}
      </div>
      <form
        className="space-y-4 border-t border-neutral-200 pt-6"
        onSubmit={passwordForm.handleSubmit(async (values) => {
          const parsed = passwordSchema.safeParse(values)
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Check the password.')
            return
          }
          try {
            await api('/api/auth/change-password', { method: 'POST', body: parsed.data })
            await logout()
            setMessage('Password changed. Please log in again.')
          } catch (err) {
            setError(errorMessage(err))
          }
        })}
      >
        <h2 className="text-xl font-bold">Change password</h2>
        <div className="grid gap-1.5"><Label htmlFor="current-password">Current password</Label><Input id="current-password" className="h-10" type="password" {...passwordForm.register('currentPassword')} /></div>
        <div className="grid gap-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" className="h-10" type="password" {...passwordForm.register('newPassword')} /></div>
        <Button type="submit" variant="secondary" className="h-10 bg-charcoal text-white hover:bg-black">Update password</Button>
      </form>
    </div>
  )
}
