import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

async function logAudit(
  action: string,
  target_type?: string,
  target_id?: string,
  details?: Record<string, unknown>,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return
  await supabase
    .from('admin_audit_log')
    .insert({
      admin_user_id: session.user.id,
      action,
      target_type: target_type ?? null,
      target_id: target_id ?? null,
      details: details ?? null,
    })
    .then(() => {})
}

export interface ExcludedUser {
  user_id: string
  excluded_by: string
  excluded_at: string
  reason: string | null
  // joined
  email?: string | null
  display_name?: string | null
}

const EXCLUSIONS_KEY = ['admin-excluded-users'] as const

// Returns a Set of user IDs that have been manually excluded from metrics.
// Gracefully returns an empty Set if the table doesn't exist yet (admin
// hasn't run the migration).
export function useExcludedUserIds() {
  return useQuery({
    queryKey: EXCLUSIONS_KEY,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('admin_excluded_users')
        .select('user_id')
        .limit(10000)
      if (error) {
        // Table missing or permission denied — degrade gracefully.
        console.warn('[useExcludedUserIds]', error.message)
        return new Set()
      }
      return new Set((data ?? []).map((r) => r.user_id))
    },
    staleTime: 30_000,
  })
}

export function useExcludedUsersList() {
  return useQuery({
    queryKey: ['admin-excluded-users-list'],
    queryFn: async (): Promise<ExcludedUser[]> => {
      const { data, error } = await supabase
        .from('admin_excluded_users')
        .select('*')
        .order('excluded_at', { ascending: false })
        .limit(2000)
      if (error) {
        console.warn('[useExcludedUsersList]', error.message)
        return []
      }
      const rows = (data ?? []) as ExcludedUser[]
      if (rows.length === 0) return []

      // Join in profile info
      const ids = rows.map((r) => r.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', ids)
      const profMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])
      return rows.map((r) => {
        const p = profMap.get(r.user_id)
        return { ...r, email: p?.email ?? null, display_name: p?.display_name ?? null }
      })
    },
    staleTime: 30_000,
  })
}

export function useExcludeUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { userId: string; reason?: string }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not signed in')
      const { error } = await supabase.from('admin_excluded_users').upsert({
        user_id: input.userId,
        excluded_by: session.user.id,
        reason: input.reason ?? null,
      })
      if (error) throw error
      logAudit('exclude_user', 'user', input.userId, { reason: input.reason ?? null })
    },
    onSuccess: () => {
      toast.success('User excluded from metrics')
      qc.invalidateQueries({ queryKey: EXCLUSIONS_KEY })
      qc.invalidateQueries({ queryKey: ['admin-excluded-users-list'] })
      // Refresh anything that uses the cohort
      qc.invalidateQueries({ queryKey: ['product-cohort'] })
      qc.invalidateQueries({ queryKey: ['product-cohort-summary'] })
      qc.invalidateQueries({ queryKey: ['product-onboarding-funnel'] })
      qc.invalidateQueries({ queryKey: ['product-funnel-users'] })
      qc.invalidateQueries({ queryKey: ['product-retention'] })
      qc.invalidateQueries({ queryKey: ['product-activation-habit'] })
      qc.invalidateQueries({ queryKey: ['product-plays-dist'] })
      qc.invalidateQueries({ queryKey: ['product-relisten'] })
      qc.invalidateQueries({ queryKey: ['product-songs-per-active'] })
    },
    onError: (e: Error) => {
      const m = e.message.toLowerCase()
      const tableMissing =
        m.includes('relation') ||
        m.includes('schema cache') ||
        m.includes('could not find the table') ||
        m.includes('does not exist')
      const msg = tableMissing
        ? 'Setup needed: run sql/admin_excluded_users.sql in Supabase SQL editor, then try again.'
        : e.message
      toast.error(msg, { duration: 8000 })
    },
  })
}

export function useIncludeUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('admin_excluded_users')
        .delete()
        .eq('user_id', userId)
      if (error) throw error
      logAudit('include_user', 'user', userId)
    },
    onSuccess: () => {
      toast.success('User restored to metrics')
      qc.invalidateQueries({ queryKey: EXCLUSIONS_KEY })
      qc.invalidateQueries({ queryKey: ['admin-excluded-users-list'] })
      qc.invalidateQueries({ queryKey: ['product-cohort'] })
      qc.invalidateQueries({ queryKey: ['product-cohort-summary'] })
      qc.invalidateQueries({ queryKey: ['product-onboarding-funnel'] })
      qc.invalidateQueries({ queryKey: ['product-funnel-users'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
