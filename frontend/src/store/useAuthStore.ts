import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/lib/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isDemo: boolean
  login: (token: string, user: AuthUser) => void
  loginAsDemo: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isDemo: false,
      login: (token, user) => set({ token, user, isDemo: false }),
      loginAsDemo: () =>
        set({
          token: 'demo-token',
          user: { id: 'demo-user', name: 'Demo User', email: 'demo@urjacast.dev', team: 'HEXABYTE' },
          isDemo: true,
        }),
      logout: () => set({ token: null, user: null, isDemo: false }),
    }),
    { name: 'urjacast-auth' },
  ),
)