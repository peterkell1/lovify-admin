import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isAdmin: boolean
  // true only on the very first load before we know anything
  initializing: boolean
  setUser: (user: User | null) => void
  setIsAdmin: (isAdmin: boolean) => void
  setInitialized: () => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,
      initializing: true,
      setUser: (user) => set({ user }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      setInitialized: () => set({ initializing: false }),
      clear: () => set({ user: null, isAdmin: false, initializing: false }),
    }),
    {
      name: 'lovify-admin-auth',
      // Persist user + isAdmin so returning users see UI instantly
      partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin }),
      onRehydrateStorage: () => (state) => {
        // If we have persisted user + admin, skip the loading state entirely
        if (state?.user && state?.isAdmin) {
          state.initializing = false
        }
      },
    }
  )
)
