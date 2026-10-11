import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { Catalog, Settings } from './types'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
    staleTime: 60_000,
  })
}

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: () => api<Catalog>('/api/catalog'),
    staleTime: 300_000,
  })
}
