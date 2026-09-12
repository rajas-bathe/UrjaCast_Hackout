import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ENDPOINTS } from '@/lib/endpoints'
import type { CreateSiteRequest, Site } from '@/lib/types'

export function useSitesList() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data } = await api.get<Site[]>(ENDPOINTS.sites)
      return data
    },
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateSiteRequest) => {
      const { data } = await api.post<Site>(ENDPOINTS.sites, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}

export function useUpdateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreateSiteRequest> }) => {
      const { data } = await api.put<Site>(ENDPOINTS.site(id), payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}