import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── Content Browser ───

interface ContentParams {
  page?: number
  pageSize?: number
  search?: string
  visibility?: 'all' | 'public' | 'private'
}

export interface BrowseSong {
  id: string
  title: string | null
  genre: string | null
  image_url: string | null
  audio_url: string | null
  is_public: boolean
  play_count: number
  created_at: string
  user_id: string
  // joined
  email: string | null
  display_name: string | null
}

export function useBrowseSongs({ page = 1, pageSize = 24, search, visibility }: ContentParams) {
  return useQuery({
    queryKey: ['content-songs', page, search, visibility],
    queryFn: async () => {
      let query = supabase
        .from('generated_songs')
        .select('id, title, genre, image_url, audio_url, is_public, play_count, created_at, user_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (search) query = query.ilike('title', `%${search}%`)
      if (visibility === 'public') query = query.eq('is_public', true)
      if (visibility === 'private') query = query.eq('is_public', false)

      const { data, count, error } = await query
      if (error) throw error
      if (!data || data.length === 0) return { items: [] as BrowseSong[], total: 0 }

      const userIds = [...new Set(data.map((d) => d.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds)
      const pMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

      const items: BrowseSong[] = data.map((d) => ({
        ...d,
        email: pMap.get(d.user_id)?.email ?? null,
        display_name: pMap.get(d.user_id)?.display_name ?? null,
      }))

      return { items, total: count ?? 0 }
    },
    staleTime: 30_000,
  })
}

export interface BrowseVision {
  id: string
  prompt: string | null
  image_url: string | null
  is_public: boolean
  created_at: string
  user_id: string
  email: string | null
  display_name: string | null
}

export function useBrowseVisions({ page = 1, pageSize = 24, search, visibility }: ContentParams) {
  return useQuery({
    queryKey: ['content-visions', page, search, visibility],
    queryFn: async () => {
      let query = supabase
        .from('generated_visions')
        .select('id, prompt, image_url, is_public, created_at, user_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (search) query = query.ilike('prompt', `%${search}%`)
      if (visibility === 'public') query = query.eq('is_public', true)
      if (visibility === 'private') query = query.eq('is_public', false)

      const { data, count, error } = await query
      if (error) throw error
      if (!data || data.length === 0) return { items: [] as BrowseVision[], total: 0 }

      const userIds = [...new Set(data.map((d) => d.user_id))]
      const { data: profiles } = await supabase.from('profiles').select('id, email, display_name').in('id', userIds)
      const pMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

      const items: BrowseVision[] = data.map((d) => ({
        ...d,
        email: pMap.get(d.user_id)?.email ?? null,
        display_name: pMap.get(d.user_id)?.display_name ?? null,
      }))

      return { items, total: count ?? 0 }
    },
    staleTime: 30_000,
  })
}

export interface BrowseVideo {
  id: string
  status: string
  thumbnail_url: string | null
  video_url: string | null
  duration_seconds: number | null
  is_public: boolean
  created_at: string
  user_id: string
  vision_id: string
  song_id: string | null
  email: string | null
  display_name: string | null
  /** Fallback thumbnail — linked vision image or song cover */
  fallback_image_url: string | null
}

export function useBrowseVideos({ page = 1, pageSize = 24, visibility }: ContentParams) {
  return useQuery({
    queryKey: ['content-videos', page, visibility],
    queryFn: async () => {
      let query = supabase
        .from('generated_videos')
        .select('id, status, thumbnail_url, video_url, duration_seconds, is_public, created_at, user_id, vision_id, song_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (visibility === 'public') query = query.eq('is_public', true)
      if (visibility === 'private') query = query.eq('is_public', false)

      const { data, count, error } = await query
      if (error) throw error
      if (!data || data.length === 0) return { items: [] as BrowseVideo[], total: 0 }

      const userIds = [...new Set(data.map((d) => d.user_id))]
      const visionIds = [...new Set(data.map((d) => d.vision_id).filter(Boolean))]
      const songIds = [...new Set(data.map((d) => d.song_id).filter(Boolean))]

      // Fetch profiles + linked vision images + linked song covers in parallel
      const [{ data: profiles }, { data: visions }, { data: songs }] = await Promise.all([
        supabase.from('profiles').select('id, email, display_name').in('id', userIds),
        visionIds.length > 0
          ? supabase.from('generated_visions').select('id, image_url').in('id', visionIds)
          : Promise.resolve({ data: [] }),
        songIds.length > 0
          ? supabase.from('generated_songs').select('id, image_url').in('id', songIds)
          : Promise.resolve({ data: [] }),
      ])

      const pMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])
      const vMap = new Map(visions?.map((v) => [v.id, v.image_url]) ?? [])
      const sMap = new Map(songs?.map((s) => [s.id, s.image_url]) ?? [])

      const items: BrowseVideo[] = data.map((d) => ({
        ...d,
        email: pMap.get(d.user_id)?.email ?? null,
        display_name: pMap.get(d.user_id)?.display_name ?? null,
        fallback_image_url: vMap.get(d.vision_id) ?? (d.song_id ? sMap.get(d.song_id) ?? null : null),
      }))

      return { items, total: count ?? 0 }
    },
    staleTime: 30_000,
  })
}

// ─── Moderation Log ───

export interface ModerationLogRow {
  id: string
  user_id: string | null
  surface: string
  prompt: string
  layer: 'keyword' | 'llm' | 'output'
  reason: string | null
  category: string | null
  created_at: string
}

interface UseModerationParams {
  surface?: string
  layer?: string
  days?: number
}

export function useModerationLog({ surface, layer, days = 7 }: UseModerationParams) {
  return useQuery({
    queryKey: ['moderation-log', surface, layer, days],
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)

      let query = supabase
        .from('content_moderation_log')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(500)

      if (surface && surface !== 'all') query = query.eq('surface', surface)
      if (layer && layer !== 'all') query = query.eq('layer', layer)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ModerationLogRow[]
    },
    staleTime: 30_000,
  })
}
