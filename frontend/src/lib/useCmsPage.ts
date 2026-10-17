import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { errorMessage } from './format'

export function useCmsPage(slug: string) {
  return useQuery({
    queryKey: ['page', slug],
    queryFn: () => api<{ title: string; body: string }>(`/api/pages/${slug}`, { auth: false }),
  })
}

export function cmsError(page: ReturnType<typeof useCmsPage>) {
  if (page.isLoading) return null
  if (page.data) return null
  return errorMessage(page.error)
}
