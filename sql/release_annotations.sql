-- Release annotations — timestamped events to overlay on metric trend charts.
-- "We pushed feature X on Tuesday" → vertical marker on the chart so you can
-- correlate dips/spikes with deploys. Run this once in Supabase SQL editor.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.release_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL,
  title text NOT NULL,
  description text,
  -- Free-form category. Suggested values: 'release', 'feature', 'fix',
  -- 'experiment', 'marketing', 'infra', 'incident'. Not enum-constrained so
  -- you can add new categories without a migration.
  kind text NOT NULL DEFAULT 'release',
  -- Where the annotation came from. 'manual' for human-entered. Future:
  -- 'github' (auto from commits), 'vercel' (auto from deployments).
  source text NOT NULL DEFAULT 'manual',
  -- Optional link out to the commit / PR / deploy log.
  external_url text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_release_annotations_occurred_at
  ON public.release_annotations (occurred_at DESC);

ALTER TABLE public.release_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read releases" ON public.release_annotations;
CREATE POLICY "Admins can read releases"
  ON public.release_annotations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert releases" ON public.release_annotations;
CREATE POLICY "Admins can insert releases"
  ON public.release_annotations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update releases" ON public.release_annotations;
CREATE POLICY "Admins can update releases"
  ON public.release_annotations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete releases" ON public.release_annotations;
CREATE POLICY "Admins can delete releases"
  ON public.release_annotations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
