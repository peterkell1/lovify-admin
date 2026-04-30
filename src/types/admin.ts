export interface AdminUser {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  is_public: boolean
  // joined from user_credits
  credit_balance: number
  subscription_tier: string
  // joined counts
  song_count: number
  vision_count: number
}

export interface UserCredits {
  credit_balance: number
  subscription_tier: string
  subscription_credits_monthly: number
  free_songs_remaining: number | null
  last_daily_bonus_at: string | null
  trial_exhausted: boolean | null
}

export interface CreditTransaction {
  id: string
  amount: number
  transaction_type: string
  description: string | null
  created_at: string
}

export interface UserSubscription {
  id: string
  plan_id: string
  status: string
  price_cents: number
  credits_per_month: number
  current_period_start: string | null
  current_period_end: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface UserSong {
  id: string
  title: string | null
  genre: string | null
  image_url: string | null
  audio_url: string | null
  duration: number | null
  play_count: number
  song_type: string
  style: string | null
  is_public: boolean
  created_at: string
}

export interface UserVision {
  id: string
  prompt: string | null
  image_url: string | null
  is_public: boolean
  created_at: string
}

export interface UserVideo {
  id: string
  status: string
  thumbnail_url: string | null
  video_url: string | null
  duration_seconds: number | null
  is_public: boolean
  created_at: string
  song_id: string
  vision_id: string
}

export interface UserFeedbackEntry {
  id: string
  user_id: string | null
  feedback_type: string
  message: string | null
  trigger: string
  needs_review: boolean
  reviewed_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  // joined
  user_email: string | null
  user_display_name: string | null
}
