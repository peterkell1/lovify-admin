import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function useAdminAuth() {
  const store = useAuthStore()
  const didInit = useRef(false)

  useEffect(() => {
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
      } finally {
        if (mounted) store.setInitialized()
      }
    }

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          if (mounted) store.clear()
          return
        }

        if (mounted) store.setUser(session.user)
        await verifyAdmin(session.user.id)
      } catch {
        // If getSession fails, clear everything
        if (mounted) store.clear()
      }
    }

    init()

    // Safety timeout — if init hangs for more than 8 seconds, force initialized
    const timeout = setTimeout(() => {
      if (mounted && store.initializing) {
        store.setInitialized()
      }
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION') return

        if (event === 'SIGNED_OUT' || !session?.user) {
          if (mounted) store.clear()
          return
        }

        if (mounted) store.setUser(session.user)
        verifyAdmin(session.user.id)
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
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
