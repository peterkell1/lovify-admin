import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const store = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!data.user) throw new Error('No user returned')

      // 2. Check admin role
      const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
        _user_id: data.user.id,
        _role: 'admin',
      })

      if (roleError || !isAdmin) {
        await supabase.auth.signOut()
        setError('Your account does not have admin privileges.')
        setLoading(false)
        return
      }

      // 3. Set store and navigate
      store.setUser(data.user)
      store.setIsAdmin(true)
      store.setInitialized()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/lovify-logo.png" alt="Lovify" className="h-16 w-16 rounded-2xl mx-auto mb-4 shadow-dreamy" />
          <h1 className="text-2xl font-bold text-foreground">Lovify Admin</h1>
          <p className="text-tertiary text-sm mt-1">Sign in to manage your platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-dreamy">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-xl p-3 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">Email</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@trylovify.com" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-foreground">Password</label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-xs text-tertiary mt-6">Only admin accounts can access this panel.</p>
      </div>
    </div>
  )
}
