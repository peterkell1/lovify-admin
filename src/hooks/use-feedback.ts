import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserFeedbackEntry } from '@/types/admin'

async function logAudit(
  action: string,
  target_type?: string,
  target_id?: string,
  details?: Record<string, unknown>,
) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  await supabase.from('admin_audit_log').insert({
    admin_user_id: session.user.id,
    action,
    target_type: target_type ?? null,
    target_id: target_id ?? null,
    details: details ?? null,
  })
}

interface UseFeedbackParams {
  page?: number
  pageSize?: number
  feedbackType?: string
  status?: 'all' | 'pending' | 'reviewed'
}

export function useFeedback({
  page = 1,
  pageSize = 25,
  feedbackType,
  status = 'all',
}: UseFeedbackParams) {
  return useQuery({
    queryKey: ['user-feedback', page, pageSize, feedbackType, status],
    queryFn: async () => {
      let query = supabase
        .from('user_feedback')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (feedbackType) {
        query = query.eq('feedback_type', feedbackType)
      }
      if (status === 'pending') {
        query = query.is('reviewed_at', null)
      } else if (status === 'reviewed') {
        query = query.not('reviewed_at', 'is', null)
      }

      const { data, count, error } = await query
      if (error) throw error
      if (!data || data.length === 0) return { entries: [] as UserFeedbackEntry[], total: 0 }

      const userIds = [...new Set(data.map((d) => d.user_id).filter((id): id is string => !!id))]
      let profiles: { id: string; email: string | null; display_name: string | null }[] = []
      if (userIds.length > 0) {
        const { data: rows } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', userIds)
        profiles = rows ?? []
      }
      const profileMap = new Map(profiles.map((p) => [p.id, p]))

      const entries: UserFeedbackEntry[] = data.map((d) => {
        const p = d.user_id ? profileMap.get(d.user_id) : undefined
        return {
          ...d,
          metadata: d.metadata as Record<string, unknown> | null,
          user_email: p?.email ?? null,
          user_display_name: p?.display_name ?? null,
        }
      })

      return { entries, total: count ?? 0 }
    },
    staleTime: 15_000,
  })
}

export function useFeedbackCounts() {
  return useQuery({
    queryKey: ['user-feedback-counts'],
    queryFn: async () => {
      const [{ count: total }, { count: pending }] = await Promise.all([
        supabase.from('user_feedback').select('*', { count: 'exact', head: true }),
        supabase.from('user_feedback').select('*', { count: 'exact', head: true }).is('reviewed_at', null),
      ])
      return { total: total ?? 0, pending: pending ?? 0 }
    },
    staleTime: 30_000,
  })
}

interface UpdateStatusInput {
  id: string
  reviewed: boolean
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reviewed }: UpdateStatusInput) => {
      const { error } = await supabase
        .from('user_feedback')
        .update({
          reviewed_at: reviewed ? new Date().toISOString() : null,
          needs_review: reviewed ? false : true,
        })
        .eq('id', id)
      if (error) throw error

      await logAudit('update_feedback_status', 'user_feedback', id, { reviewed })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-feedback'] })
      queryClient.invalidateQueries({ queryKey: ['user-feedback-counts'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
  })
}
