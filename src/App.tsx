import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import LoginPage from '@/pages/LoginPage'
import ProductPage from '@/pages/ProductPage'
import BusinessHealthPage from '@/pages/BusinessHealthPage'
import GrowthPage from '@/pages/GrowthPage'
import VanityPage from '@/pages/VanityPage'
import UsersPage from '@/pages/UsersPage'
import UserDetailPage from '@/pages/UserDetailPage'
import ContentPage from '@/pages/ContentPage'
import SubscriptionsPage from '@/pages/SubscriptionsPage'
import SettingsPage from '@/pages/SettingsPage'
import AuditLogPage from '@/pages/AuditLogPage'
import FeedbackPage from '@/pages/FeedbackPage'
import FunnelsPage from '@/pages/FunnelsPage'
import FunnelDetailPage from '@/pages/FunnelDetailPage'
import FunnelEditPage from '@/pages/FunnelEditPage'
import FunnelTemplatesPage from '@/pages/FunnelTemplatesPage'
import FunnelAnalyticsPage from '@/pages/FunnelAnalyticsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <AdminGuard>
                <DashboardLayout />
              </AdminGuard>
            }
          >
            <Route index element={<ProductPage />} />
            <Route path="business" element={<BusinessHealthPage />} />
            <Route path="growth" element={<GrowthPage />} />
            <Route path="vanity" element={<VanityPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:userId" element={<UserDetailPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="funnels" element={<FunnelsPage />} />
            <Route path="funnels/new/templates" element={<FunnelTemplatesPage />} />
            <Route path="funnels/new" element={<FunnelEditPage mode="create" />} />
            <Route path="funnels/:id" element={<FunnelDetailPage />} />
            <Route path="funnels/:id/edit" element={<FunnelEditPage mode="edit" />} />
            <Route path="funnels/:id/analytics" element={<FunnelAnalyticsPage />} />
            <Route path="audit" element={<AuditLogPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
