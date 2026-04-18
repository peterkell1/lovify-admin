import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminUser, CreditTransaction, UserCredits, UserSubscription, UserSong, UserVision, UserVideo } from '@/types/admin'

// ─── User Directory ───

interface UseUsersParams {
  search?: string
  page?: number
  pageSize?: number
}

async function fetchUsers({ search, page = 1, pageSize = 25 }: UseUsersParams) {
  let query = supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, created_at, is_public', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (search) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  const { data: profiles, count, error } = await query
  if (error) throw error

  if (!profiles || profiles.length === 0) {
    return { users: [], total: 0 }
  }

  const userIds = profiles.map((p) => p.id)

  // Fetch credits in parallel
  const { data: credits } = await supabase
    .from('user_credits')
    .select('user_id, credit_balance, subscription_tier')
    .in('user_id', userIds)

  const creditsMap = new Map(credits?.map((c) => [c.user_id, c]) ?? [])

  const users: AdminUser[] = profiles.map((p) => {
    const cred = creditsMap.get(p.id)
    return {
      ...p,
      credit_balance: cred?.credit_balance ?? 0,
      subscription_tier: cred?.subscription_tier ?? 'free',
      song_count: 0,
      vision_count: 0,
    }
  })

  return { users, total: count ?? 0 }
}

export function useUsers(params: UseUsersParams) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchUsers(params),
    staleTime: 30_000,
  })
}

// ─── User Detail ───

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const [profileRes, creditsRes, subsRes, songsRes, visionsRes, videosRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_credits').select('*').eq('user_id', userId).single(),
        supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('generated_songs').select('id, title, genre, image_url, audio_url, duration, play_count, song_type, style, is_public, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('generated_visions').select('id, prompt, image_url, is_public, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('generated_videos').select('id, status, thumbnail_url, video_url, duration_seconds, is_public, created_at, song_id, vision_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      ])

      return {
        profile: profileRes.data,
        credits: creditsRes.data as UserCredits | null,
        subscriptions: (subsRes.data ?? []) as UserSubscription[],
        songs: (songsRes.data ?? []) as UserSong[],
        visions: (visionsRes.data ?? []) as UserVision[],
        videos: (videosRes.data ?? []) as UserVideo[],
      }
    },
    enabled: !!userId,
  })
}

// ─── Credit Transactions ───

export function useUserTransactions(userId: string) {
  return useQuery({
    queryKey: ['admin-user-transactions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, transaction_type, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data ?? []) as CreditTransaction[]
    },
    enabled: !!userId,
  })
}

// ─── Grant Credits ───

export function useGrantCredits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, amount, type, description }: {
      userId: string
      amount: number
      type: string
      description?: string
    }) => {
      const { data, error } = await supabase.rpc('grant_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_description: description ?? `Admin grant: ${amount} credits`,
      })

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-user-transactions', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

// ─── Toggle Content Visibility ───

export function useToggleContentVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ table, id, isPublic }: {
      table: 'generated_songs' | 'generated_visions' | 'generated_videos'
      id: string
      isPublic: boolean
    }) => {
      const { error } = await supabase
        .from(table)
        .update({ is_public: isPublic })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] })
    },
  })
}
