import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function useAdminAuth() {
  const store = useAuthStore()
  const didInit = useRef(false)

  useEffect(() => {
    // Only run once per mount
    if (didInit.current) return
    didInit.current = true

    let mounted = true

    const verifyAdmin = async (userId: string) => {
      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin',
        })
        if (mounted) {
          store.setIsAdmin(!error && data === true)
        }
      } catch {
        if (mounted) store.setIsAdmin(false)
      }
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        if (mounted) store.clear()
        return
      }

      if (mounted) store.setUser(session.user)

      // Verify admin role — this updates persisted state but does NOT block UI
      await verifyAdmin(session.user.id)

      if (mounted) store.setInitialized()
    }

    init()

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Skip initial — we already handled it above
        if (event === 'INITIAL_SESSION') return

        if (event === 'SIGNED_OUT' || !session?.user) {
          if (mounted) store.clear()
          return
        }

        // TOKEN_REFRESHED / SIGNED_IN — update user silently, no loading state
        if (mounted) store.setUser(session.user)

        // Re-verify admin in background (no UI blocking)
        verifyAdmin(session.user.id)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    store.clear()
  }

  return {
    user: store.user,
    isAdmin: store.isAdmin,
    isLoading: store.initializing,
    isAuthenticated: !!store.user && store.isAdmin,
    login,
    logout,
  }
}
