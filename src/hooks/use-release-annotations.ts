import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export type ReleaseKind =
  | 'release'
  | 'feature'
  | 'fix'
  | 'experiment'
  | 'marketing'
  | 'infra'
  | 'incident'

export interface ReleaseAnnotation {
  id: string
  occurred_at: string // ISO
  title: string
  description: string | null
  kind: ReleaseKind | string
  source: 'manual' | 'github' | 'vercel' | string
  external_url: string | null
  external_id: string | null
  created_at: string
  created_by: string | null
}

const KEY = ['release-annotations'] as const

export function useReleaseAnnotations(opts?: { since?: string }) {
  return useQuery({
    queryKey: [...KEY, opts?.since ?? 'all'],
    queryFn: async (): Promise<ReleaseAnnotation[]> => {
      let query = supabase
        .from('release_annotations')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(500)
      if (opts?.since) {
        query = query.gte('occurred_at', opts.since)
      }
      const { data, error } = await query
      if (error) {
        // Graceful fallback if migration hasn't been run
        console.warn('[useReleaseAnnotations]', error.message)
        return []
      }
      return (data ?? []) as ReleaseAnnotation[]
    },
    staleTime: 60_000,
  })
}

export function useAddReleaseAnnotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      occurred_at: string
      title: string
      description?: string
      kind?: ReleaseKind
      external_url?: string
      external_id?: string
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const { error } = await supabase.from('release_annotations').insert({
        occurred_at: input.occurred_at,
        title: input.title,
        description: input.description ?? null,
        kind: input.kind ?? 'release',
        source: 'manual',
        external_url: input.external_url ?? null,
        external_id: input.external_id ?? null,
        created_by: session?.user?.id ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Release logged')
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e: Error) => {
      const m = e.message.toLowerCase()
      const tableMissing =
        m.includes('relation') ||
        m.includes('schema cache') ||
        m.includes('could not find the table') ||
        m.includes('does not exist')
      toast.error(
        tableMissing
          ? 'Setup needed: run sql/release_annotations.sql in Supabase SQL editor.'
          : e.message,
        { duration: 8000 }
      )
    },
  })
}

export function useDeleteReleaseAnnotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('release_annotations')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Release removed')
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
