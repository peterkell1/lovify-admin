import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { Spinner } from '@/components/ui/spinner'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, isAdmin } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-warm">
        <img src="/lovify-logo.png" alt="Lovify" className="h-14 w-14 rounded-2xl mb-6 shadow-dreamy" />
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm px-4">
        <div className="text-center bg-card border border-border rounded-2xl p-8 shadow-dreamy max-w-sm">
          <img src="/lovify-logo.png" alt="Lovify" className="h-12 w-12 rounded-xl mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-foreground">Access Denied</h2>
          <p className="text-tertiary text-sm">
            Your account ({user.email}) does not have admin privileges.
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
