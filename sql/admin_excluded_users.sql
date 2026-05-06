-- Manual exclusion of users from admin dashboard metrics.
-- Run this once in the Supabase SQL editor (project: pqjqurjdujwforscefov).
-- Idempotent — safe to re-run.
--
-- Design note: this is a "soft tag" table. We deliberately don't enforce a
-- foreign key on user_id, because:
--   * the only purpose is "filter out this id from metrics queries"
--   * if a profile gets deleted later, the row becomes a harmless no-op
--   * orphan profiles in this project don't always have a matching auth.users
-- This avoids the FK-violation pitfall when excluding edge-case accounts.

CREATE TABLE IF NOT EXISTS public.admin_excluded_users (
  user_id uuid PRIMARY KEY,
  excluded_by uuid NOT NULL,
  excluded_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

-- If the table was created earlier with FK constraints, drop them.
ALTER TABLE public.admin_excluded_users
  DROP CONSTRAINT IF EXISTS admin_excluded_users_user_id_fkey;
ALTER TABLE public.admin_excluded_users
  DROP CONSTRAINT IF EXISTS admin_excluded_users_excluded_by_fkey;

CREATE INDEX IF NOT EXISTS idx_admin_excluded_users_excluded_at
  ON public.admin_excluded_users (excluded_at DESC);

ALTER TABLE public.admin_excluded_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read exclusions" ON public.admin_excluded_users;
CREATE POLICY "Admins can read exclusions"
  ON public.admin_excluded_users
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can exclude users" ON public.admin_excluded_users;
CREATE POLICY "Admins can exclude users"
  ON public.admin_excluded_users
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can un-exclude users" ON public.admin_excluded_users;
CREATE POLICY "Admins can un-exclude users"
  ON public.admin_excluded_users
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
