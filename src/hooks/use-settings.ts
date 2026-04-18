import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── App Settings (key-value from app_settings table) ───

export interface AppSetting {
  key: string
  value: string
  updated_at: string
  updated_by: string | null
}

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('key')

      if (error) throw error
      return (data ?? []) as AppSetting[]
    },
    staleTime: 30_000,
  })
}

export function useUpdateAppSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: { session } } = await supabase.auth.getSession()

      // Upsert — insert if not exists, update if exists
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: session?.user?.id ?? null,
        }, { onConflict: 'key' })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] })
    },
  })
}

// ─── Feature Flags (from feature_flags table) ───

export interface FeatureFlag {
  id: string
  name: string
  is_enabled: boolean | null
  description: string | null
  updated_at: string | null
  updated_by: string | null
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name')

      if (error) throw error
      return (data ?? []) as FeatureFlag[]
    },
    staleTime: 30_000,
  })
}

export function useToggleFeatureFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession()

      const { error } = await supabase
        .from('feature_flags')
        .update({
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
          updated_by: session?.user?.id ?? null,
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })
}
