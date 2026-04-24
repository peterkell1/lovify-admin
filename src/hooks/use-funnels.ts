import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Funnel, FunnelStatus, FunnelStep, StepType } from '@/types/funnels'

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
  }).then(() => {})
}

// POST to the Next.js funnel app's /api/revalidate endpoint to bust its
// funnel-config cache immediately after an admin publish/edit/pause.
// Throws on failure so status changes (publish/pause) fail loudly — a
// silent miss here means the paused funnel keeps serving for up to the
// SSR cache TTL, which is a surprising and bad default.
async function bustFunnelCache(slug: string): Promise<void> {
  const base = import.meta.env.VITE_FUNNEL_BASE_URL
  const secret = import.meta.env.VITE_FUNNEL_REVALIDATE_SECRET
  if (!base || !secret) {
    console.warn(
      '[bustFunnelCache] skipping — VITE_FUNNEL_BASE_URL or VITE_FUNNEL_REVALIDATE_SECRET missing. Funnel will refresh via SSR TTL.',
    )
    return
  }
  const res = await fetch(`${base}/api/revalidate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-revalidate-secret': secret,
    },
    body: JSON.stringify({ slug }),
  })
  if (!res.ok) {
    throw new Error(
      `Cache revalidation failed (${res.status}). The funnel may continue serving its old state for up to a minute.`,
    )
  }
}

// ─── List / detail ───

export function useFunnels(params: { search?: string; status?: FunnelStatus | 'all' } = {}) {
  return useQuery({
    queryKey: ['admin-funnels', params],
    queryFn: async () => {
      let query = supabase
        .from('funnels')
        .select('*')
        .order('created_at', { ascending: false })

      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%`)
      }
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Funnel[]
    },
  })
}

export function useFunnel(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-funnel', id],
    queryFn: async () => {
      if (!id) return null
      const [funnelRes, stepsRes] = await Promise.all([
        supabase.from('funnels').select('*').eq('id', id).single(),
        supabase.from('funnel_steps').select('*').eq('funnel_id', id).order('position'),
      ])
      if (funnelRes.error) throw funnelRes.error
      if (stepsRes.error) throw stepsRes.error
      return {
        funnel: funnelRes.data as Funnel,
        steps: (stepsRes.data ?? []) as FunnelStep[],
      }
    },
    enabled: !!id,
  })
}

// ─── Funnel CRUD ───

export function useCreateFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      slug: string
      name: string
      description?: string
      default_plan_key?: string
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase
        .from('funnels')
        .insert({
          slug: input.slug,
          name: input.name,
          description: input.description ?? null,
          default_plan_key: input.default_plan_key ?? null,
          created_by: session?.user.id ?? null,
        })
        .select('*')
        .single()
      if (error) throw error
      logAudit('funnel.create', 'funnel', data.id, { slug: data.slug, name: data.name })
      return data as Funnel
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-funnels'] })
    },
  })
}

export function useUpdateFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; slug: string; patch: Partial<Funnel> }) => {
      const { error } = await supabase.from('funnels').update(input.patch).eq('id', input.id)
      if (error) throw error
      await bustFunnelCache(input.slug)
      logAudit('funnel.update', 'funnel', input.id, {
        fields: Object.keys(input.patch),
      })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-funnels'] })
      qc.invalidateQueries({ queryKey: ['admin-funnel', vars.id] })
    },
  })
}

export function usePublishFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; slug: string; status: FunnelStatus }) => {
      const patch: Partial<Funnel> = { status: input.status }
      if (input.status === 'live') {
        patch.published_at = new Date().toISOString()
      }
      const { error } = await supabase.from('funnels').update(patch).eq('id', input.id)
      if (error) throw error
      await bustFunnelCache(input.slug)
      logAudit(`funnel.${input.status === 'live' ? 'publish' : input.status}`, 'funnel', input.id, {
        slug: input.slug,
        status: input.status,
      })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-funnels'] })
      qc.invalidateQueries({ queryKey: ['admin-funnel', vars.id] })
    },
  })
}

export function useDeleteFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; slug: string }) => {
      const { error } = await supabase.from('funnels').delete().eq('id', input.id)
      if (error) throw error
      await bustFunnelCache(input.slug)
      logAudit('funnel.delete', 'funnel', input.id, { slug: input.slug })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-funnels'] })
    },
  })
}

// ─── Step CRUD + reorder ───

export function useCreateStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      funnel_id: string
      funnel_slug: string
      step_key: string
      step_type: StepType
      position: number
      config: Record<string, unknown>
    }) => {
      const { error } = await supabase.from('funnel_steps').insert({
        funnel_id: input.funnel_id,
        step_key: input.step_key,
        step_type: input.step_type,
        position: input.position,
        config: input.config,
      })
      if (error) throw error
      await bustFunnelCache(input.funnel_slug)
      logAudit('funnel_step.create', 'funnel', input.funnel_id, {
        step_key: input.step_key,
        step_type: input.step_type,
      })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-funnel', vars.funnel_id] })
    },
  })
}

export function useUpdateStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      funnel_id: string
      funnel_slug: string
      patch: Partial<FunnelStep>
    }) => {
      const { error } = await supabase
        .from('funnel_steps')
        .update(input.patch)
        .eq('id', input.id)
      if (error) throw error
      await bustFunnelCache(input.funnel_slug)
      logAudit('funnel_step.update', 'funnel_step', input.id, {
        fields: Object.keys(input.patch),
      })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-funnel', vars.funnel_id] })
    },
  })
}

export function useDeleteStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      funnel_id: string
      funnel_slug: string
    }) => {
      const { error } = await supabase.from('funnel_steps').delete().eq('id', input.id)
      if (error) throw error
      await bustFunnelCache(input.funnel_slug)
      logAudit('funnel_step.delete', 'funnel_step', input.id)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-funnel', vars.funnel_id] })
    },
  })
}

// Swap two adjacent steps' positions. Deferred unique constraint on
// (funnel_id, position) lets both UPDATEs run in the same transaction.
export function useReorderSteps() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      funnel_id: string
      funnel_slug: string
      a: { id: string; position: number }
      b: { id: string; position: number }
    }) => {
      // Temporary swap via a negative sentinel, since two separate UPDATE
      // statements (not in a txn from the client) can't rely on the
      // DEFERRABLE flag. Using -1 as a stash column avoids the conflict.
      const stash = -1
      const res1 = await supabase.from('funnel_steps')
        .update({ position: stash }).eq('id', input.a.id)
      if (res1.error) throw res1.error
      const res2 = await supabase.from('funnel_steps')
        .update({ position: input.a.position }).eq('id', input.b.id)
      if (res2.error) throw res2.error
      const res3 = await supabase.from('funnel_steps')
        .update({ position: input.b.position }).eq('id', input.a.id)
      if (res3.error) throw res3.error
      await bustFunnelCache(input.funnel_slug)
      logAudit('funnel_step.reorder', 'funnel', input.funnel_id, {
        swapped: [input.a.id, input.b.id],
      })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-funnel', vars.funnel_id] })
    },
  })
}

// ─── Analytics ───

export function useFunnelAnalytics(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-funnel-analytics', id],
    queryFn: async () => {
      if (!id) return null

      // Fetch steps + sessions first so we can filter answers by session_ids
      // (avoids pulling every funnel's answers across the whole project).
      const [stepsRes, sessionsRes] = await Promise.all([
        supabase.from('funnel_steps')
          .select('id, step_key, step_type, position')
          .eq('funnel_id', id)
          .order('position'),
        supabase.from('funnel_sessions')
          .select('id, status, current_step_key, created_at, converted_at')
          .eq('funnel_id', id),
      ])
      if (stepsRes.error) throw stepsRes.error
      if (sessionsRes.error) throw sessionsRes.error

      const steps = (stepsRes.data ?? []) as {
        id: string; step_key: string; step_type: StepType; position: number
      }[]
      const sessions = (sessionsRes.data ?? []) as {
        id: string
        status: string
        current_step_key: string | null
        created_at: string
        converted_at: string | null
      }[]

      let answers: { session_id: string; step_id: string }[] = []
      if (sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id)
        // Supabase caps .in() filter size around 1000 entries. For typical
        // funnel volumes (thousands of sessions at most per funnel) this is
        // fine; revisit if any one funnel crosses ~10k sessions.
        const { data, error } = await supabase
          .from('funnel_answers')
          .select('session_id, step_id')
          .in('session_id', sessionIds)
        if (error) throw error
        answers = (data ?? []) as typeof answers
      }

      // reach[step_id] = Set<session_id> of sessions that submitted that step.
      const reach = new Map<string, Set<string>>()
      for (const a of answers) {
        if (!reach.has(a.step_id)) reach.set(a.step_id, new Set())
        reach.get(a.step_id)!.add(a.session_id)
      }

      const totalSessions = sessions.length
      const converted = sessions.filter((s) => s.status === 'converted').length
      const abandoned = sessions.filter((s) => s.status === 'abandoned').length

      // Drop-off rows: per step, how many sessions reached it, plus the
      // fall-off rate vs the previous step and vs. the very first step.
      //
      // Special case: the success step only fires an answer row on SSR
      // render. A user who closes the tab after confirming payment is
      // still a conversion — the webhook already flipped their session
      // to status='converted'. So we use max(answers-for-success,
      // converted-sessions) as the "reached success" count.
      const rows = steps.map((s, i) => {
        let reached = reach.get(s.id)?.size ?? 0
        if (s.step_type === 'success' && converted > reached) {
          reached = converted
        }
        const prev = i > 0 ? (reach.get(steps[i - 1].id)?.size ?? 0) : totalSessions
        const dropOffFromPrev = prev > 0 ? 1 - reached / prev : 0
        const overallRate = totalSessions > 0 ? reached / totalSessions : 0
        return {
          step_key: s.step_key,
          step_type: s.step_type,
          position: s.position,
          reached,
          drop_off_from_prev: dropOffFromPrev,
          overall_rate: overallRate,
        }
      })

      return {
        totalSessions,
        converted,
        abandoned,
        inProgress: totalSessions - converted - abandoned,
        conversionRate: totalSessions > 0 ? converted / totalSessions : 0,
        rows,
      }
    },
    enabled: !!id,
  })
}
