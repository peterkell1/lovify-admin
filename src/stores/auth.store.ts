import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isAdmin: boolean
  initializing: boolean
  _hydrated: boolean
  setUser: (user: User | null) => void
  setIsAdmin: (isAdmin: boolean) => void
  setInitialized: () => void
  setHydrated: () => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,
      initializing: true,
      _hydrated: false,
      setUser: (user) => set({ user }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      setInitialized: () => set({ initializing: false }),
      setHydrated: () => set({ _hydrated: true }),
      clear: () => set({ user: null, isAdmin: false, initializing: false }),
    }),
    {
      name: 'lovify-admin-auth',
      partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true
          // If we have persisted user + admin, skip loading
          if (state.user && state.isAdmin) {
            state.initializing = false
          }
          // If no user persisted, also skip loading — go to login
          if (!state.user) {
            state.initializing = false
          }
        }
      },
    }
  )
)
