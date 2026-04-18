import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AuditLogEntry {
  id: string
  admin_user_id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  // joined
  admin_email: string | null
}

interface UseAuditLogParams {
  page?: number
  pageSize?: number
  action?: string
}

export function useAuditLog({ page = 1, pageSize = 30, action }: UseAuditLogParams) {
  return useQuery({
    queryKey: ['audit-log', page, action],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (action) {
        query = query.eq('action', action)
      }

      const { data, count, error } = await query
      if (error) throw error

      if (!data || data.length === 0) return { entries: [], total: 0 }

      // Join admin emails
      const adminIds = [...new Set(data.map((d) => d.admin_user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', adminIds)

      const emailMap = new Map(profiles?.map((p) => [p.id, p.email]) ?? [])

      const entries: AuditLogEntry[] = data.map((d) => ({
        ...d,
        details: d.details as Record<string, unknown> | null,
        admin_email: emailMap.get(d.admin_user_id) ?? null,
      }))

      return { entries, total: count ?? 0 }
    },
    staleTime: 15_000,
  })
}

// ─── Log an audit entry ───

export function useLogAuditEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: {
      action: string
      target_type?: string
      target_id?: string
      details?: Record<string, unknown>
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const { error } = await supabase.from('admin_audit_log').insert({
        admin_user_id: session.user.id,
        action: entry.action,
        target_type: entry.target_type ?? null,
        target_id: entry.target_id ?? null,
        details: entry.details ?? null,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
  })
}
