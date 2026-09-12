import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ENDPOINTS } from '@/lib/endpoints'
import { useAuthStore } from '@/store/useAuthStore'
import type { AuthResponse, LoginRequest, SignupRequest } from '@/lib/types'

export function useLogin() {
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const { data } = await api.post<AuthResponse>(ENDPOINTS.authLogin, payload)
      return data
    },
    onSuccess: (data) => login(data.token, data.user),
  })
}

export function useSignup() {
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: async (payload: SignupRequest) => {
      const { data } = await api.post<AuthResponse>(ENDPOINTS.authSignup, payload)
      return data
    },
    onSuccess: (data) => login(data.token, data.user),
  })
}