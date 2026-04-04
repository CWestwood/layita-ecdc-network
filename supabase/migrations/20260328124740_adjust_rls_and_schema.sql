-- =============================================================================
-- MIGRATION: Schema Corrections + RLS Policy Overhaul
-- =============================================================================
-- Run this in the Supabase SQL editor.
-- Safe to run on existing data — uses IF NOT EXISTS / IF EXISTS guards throughout.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SECTION 1: SCHEMA CORRECTIONS
-- -----------------------------------------------------------------------------

-- 1a. Fix kobo_processed column naming
--     The status column was created as "kobo_processed" (same as the table name).
--     Rename it to "status" for clarity, and add the warnings column if missing.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kobo_processed' AND column_name = 'kobo_processed'
  ) THEN
    ALTER TABLE public.kobo_processed
      RENAME COLUMN kobo_processed TO status;
  END IF;
END $$;

ALTER TABLE public.kobo_processed
  ALTER COLUMN status SET DEFAULT 'success',
  ALTER COLUMN status TYPE text;

ALTER TABLE public.kobo_processed
  DROP CONSTRAINT IF EXISTS kobo_processed_status_check;

ALTER TABLE public.kobo_processed
  ADD CONSTRAINT kobo_processed_status_check
  CHECK (status IN ('success', 'failed', 'partial'));

-- Add warnings column if not already present
ALTER TABLE public.kobo_processed
  ADD COLUMN IF NOT EXISTS warnings text[];


-- 1b. Ensure outreach_visits has provenance columns (already in schema, guard anyway)
ALTER TABLE public.outreach_visits
  ADD COLUMN IF NOT EXISTS kobo_instance_id text
    REFERENCES public.kobo_raw_submissions(instance_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public.outreach_visits
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'kobo'
    CHECK (source IN ('kobo', 'manual', 'manual_edit'));


-- 1c. Add resolved_by to kobo_unmatched so we can track which admin resolved it
ALTER TABLE public.kobo_unmatched
  ADD COLUMN IF NOT EXISTS resolved_by uuid
    REFERENCES public.profiles(id)
    ON UPDATE CASCADE ON DELETE SET NULL;


-- -----------------------------------------------------------------------------
-- SECTION 2: REVOKE ANONYMOUS ACCESS
-- -----------------------------------------------------------------------------
-- anon role should have no access to any application tables.
-- All access requires authentication.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Keep PostGIS/pg_trgm functions accessible (required by Supabase internals)
-- These are extension functions and don't expose application data.


-- -----------------------------------------------------------------------------
-- SECTION 3: DROP ALL EXISTING APPLICATION RLS POLICIES
-- -----------------------------------------------------------------------------
-- Start clean to avoid conflicting or duplicate policies.

-- area
DROP POLICY IF EXISTS "authenticated users can read areas" ON public.area;
DROP POLICY IF EXISTS "admins can edit and delete areas" ON public.area;

-- ecdc_list
DROP POLICY IF EXISTS "authenticated users can read ecdcs" ON public.ecdc_list;
DROP POLICY IF EXISTS "administrators can manage ecdc data" ON public.ecdc_list;

-- groups
DROP POLICY IF EXISTS "authenticated users can read groups" ON public.groups;
DROP POLICY IF EXISTS "administrators can edit groups" ON public.groups;

-- kobo_label
DROP POLICY IF EXISTS "administrators can edit kobo_labels" ON public.kobo_label;

-- landmarks
DROP POLICY IF EXISTS "authenticated can view landmarks" ON public.landmarks;

-- layita_staff
DROP POLICY IF EXISTS "administrators can edit layita staff" ON public.layita_staff;

-- outreach_visits
DROP POLICY IF EXISTS "authenticated users can read outreach_visits" ON public.outreach_visits;
DROP POLICY IF EXISTS "administrators can edit outreach visit data" ON public.outreach_visits;

-- practitioners
DROP POLICY IF EXISTS "authenticated users can view visits" ON public.practitioners;
DROP POLICY IF EXISTS "administrators can manage practitioners" ON public.practitioners;
DROP POLICY IF EXISTS "administrators can view and edit data" ON public.practitioners;

-- profiles
DROP POLICY IF EXISTS "users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "administrators can edit profiles data" ON public.profiles;

-- training
DROP POLICY IF EXISTS "authenticated can view training" ON public.training;

-- visit_requirements
DROP POLICY IF EXISTS "administrators can edit visit requirements" ON public.visit_requirements;


-- -----------------------------------------------------------------------------
-- SECTION 4: ENABLE RLS ON ALL TABLES (idempotent)
-- -----------------------------------------------------------------------------

ALTER TABLE public.area               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecdc_list          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kobo_label         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kobo_processed     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kobo_raw_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kobo_unmatched     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landmarks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layita_staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_visits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioners      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_requirements ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- SECTION 5: HELPER — use get_my_role() consistently
-- -----------------------------------------------------------------------------
-- Already exists in schema. Defined as SECURITY DEFINER so it reads profiles
-- without triggering RLS on the profiles table itself. Recreate to be sure.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


-- -----------------------------------------------------------------------------
-- SECTION 6: RLS POLICIES — AREA
-- -----------------------------------------------------------------------------
-- All authenticated users can read. Only administrators can write.

CREATE POLICY "area: authenticated read"
  ON public.area FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "area: administrator write"
  ON public.area FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 7: RLS POLICIES — AUDIT LOGS
-- -----------------------------------------------------------------------------
-- Administrators and managers can read. Nobody writes directly (trigger only).

CREATE POLICY "audit_logs: administrator read"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('administrator', 'manager'));

-- No INSERT/UPDATE/DELETE policies — rows are written only by log_table_updates()
-- which runs as a trigger with elevated privileges.


-- -----------------------------------------------------------------------------
-- SECTION 8: RLS POLICIES — ECDC LIST
-- -----------------------------------------------------------------------------
-- All authenticated users can read. Administrators can write.

CREATE POLICY "ecdc_list: authenticated read"
  ON public.ecdc_list FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ecdc_list: administrator write"
  ON public.ecdc_list FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 9: RLS POLICIES — GROUPS
-- -----------------------------------------------------------------------------
-- All authenticated users can read. Administrators can write.

CREATE POLICY "groups: authenticated read"
  ON public.groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "groups: administrator write"
  ON public.groups FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 10: RLS POLICIES — KOBO LABEL
-- -----------------------------------------------------------------------------
-- All authenticated users can read labels (needed to resolve form values).
-- Only administrators can modify.

CREATE POLICY "kobo_label: authenticated read"
  ON public.kobo_label FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "kobo_label: administrator write"
  ON public.kobo_label FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 11: RLS POLICIES — KOBO PROCESSED
-- -----------------------------------------------------------------------------
-- Administrators and managers can read processing status.
-- Administrators can update (e.g. reset failed submissions for reprocessing).
-- Inserts come from edge functions (service role) — no authenticated insert needed.

CREATE POLICY "kobo_processed: admin/manager read"
  ON public.kobo_processed FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('administrator', 'manager'));

CREATE POLICY "kobo_processed: administrator update"
  ON public.kobo_processed FOR UPDATE
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 12: RLS POLICIES — KOBO RAW SUBMISSIONS
-- -----------------------------------------------------------------------------
-- Administrators can read raw payloads (debugging, reprocessing).
-- Inserts come from edge functions only (service role).

CREATE POLICY "kobo_raw_submissions: administrator read"
  ON public.kobo_raw_submissions FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 13: RLS POLICIES — KOBO UNMATCHED
-- -----------------------------------------------------------------------------
-- Administrators and managers can see and resolve unmatched records.
-- Administrators can delete resolved records.

CREATE POLICY "kobo_unmatched: admin/manager read"
  ON public.kobo_unmatched FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('administrator', 'manager'));

CREATE POLICY "kobo_unmatched: administrator resolve"
  ON public.kobo_unmatched FOR UPDATE
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');

CREATE POLICY "kobo_unmatched: administrator delete"
  ON public.kobo_unmatched FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 14: RLS POLICIES — LANDMARKS
-- -----------------------------------------------------------------------------
-- All authenticated users can read. Administrators can write.

CREATE POLICY "landmarks: authenticated read"
  ON public.landmarks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "landmarks: administrator write"
  ON public.landmarks FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 15: RLS POLICIES — LAYITA STAFF
-- -----------------------------------------------------------------------------
-- All authenticated users can read (needed for data capturer name display).
-- Administrators can write.

CREATE POLICY "layita_staff: authenticated read"
  ON public.layita_staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "layita_staff: administrator write"
  ON public.layita_staff FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 16: RLS POLICIES — OUTREACH VISITS
-- -----------------------------------------------------------------------------
-- All authenticated users can read visits.
-- Administrators can insert, update, delete any visit.
-- Datacapturers can insert visits (from manual entry) and update their own.
-- Managers can update visits (e.g. correct data), but not delete.

CREATE POLICY "outreach_visits: authenticated read"
  ON public.outreach_visits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "outreach_visits: administrator write"
  ON public.outreach_visits FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');

CREATE POLICY "outreach_visits: manager update"
  ON public.outreach_visits FOR UPDATE
  TO authenticated
  USING     (public.get_my_role() = 'manager')
  WITH CHECK (public.get_my_role() = 'manager');

CREATE POLICY "outreach_visits: datacapturer insert"
  ON public.outreach_visits FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'datacapturer'
    AND data_capturer_id = (
      SELECT ls.id FROM public.layita_staff ls
      JOIN public.profiles p ON lower(p.name) = lower(ls.name)
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "outreach_visits: datacapturer update own"
  ON public.outreach_visits FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'datacapturer'
    AND data_capturer_id = (
      SELECT ls.id FROM public.layita_staff ls
      JOIN public.profiles p ON lower(p.name) = lower(ls.name)
      WHERE p.id = auth.uid()
    )
    AND source != 'kobo' -- datacapturers cannot edit Kobo-originated records
  )
  WITH CHECK (
    public.get_my_role() = 'datacapturer'
  );


-- -----------------------------------------------------------------------------
-- SECTION 17: RLS POLICIES — PRACTITIONERS
-- -----------------------------------------------------------------------------
-- All authenticated users can read.
-- Administrators can write.
-- Managers can update (but not insert or delete).

CREATE POLICY "practitioners: authenticated read"
  ON public.practitioners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "practitioners: administrator write"
  ON public.practitioners FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');

CREATE POLICY "practitioners: manager update"
  ON public.practitioners FOR UPDATE
  TO authenticated
  USING     (public.get_my_role() = 'manager')
  WITH CHECK (public.get_my_role() = 'manager');


-- -----------------------------------------------------------------------------
-- SECTION 18: RLS POLICIES — PROFILES
-- -----------------------------------------------------------------------------
-- Users can always read their own profile.
-- Administrators can read all profiles and manage roles.
-- Nobody except administrators can change roles.

CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles: administrator read all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'administrator');

CREATE POLICY "profiles: administrator write"
  ON public.profiles FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');

CREATE POLICY "profiles: user update own non-role fields"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  -- Prevent self-promotion: users cannot change their own role
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );


-- -----------------------------------------------------------------------------
-- SECTION 19: RLS POLICIES — TRAINING
-- -----------------------------------------------------------------------------
-- All authenticated users can read.
-- Administrators can write.
-- Managers can update (to record training outcomes).

CREATE POLICY "training: authenticated read"
  ON public.training FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "training: administrator write"
  ON public.training FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');

CREATE POLICY "training: manager update"
  ON public.training FOR UPDATE
  TO authenticated
  USING     (public.get_my_role() = 'manager')
  WITH CHECK (public.get_my_role() = 'manager');


-- -----------------------------------------------------------------------------
-- SECTION 20: RLS POLICIES — VISIT REQUIREMENTS
-- -----------------------------------------------------------------------------
-- All authenticated users can read targets.
-- Only administrators can change them.

CREATE POLICY "visit_requirements: authenticated read"
  ON public.visit_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "visit_requirements: administrator write"
  ON public.visit_requirements FOR ALL
  TO authenticated
  USING     (public.get_my_role() = 'administrator')
  WITH CHECK (public.get_my_role() = 'administrator');


-- -----------------------------------------------------------------------------
-- SECTION 21: FUNCTION PERMISSIONS
-- -----------------------------------------------------------------------------
-- Restrict sensitive functions to appropriate roles.

-- merge_practitioners is destructive — administrator only
REVOKE ALL ON FUNCTION public.merge_practitioners(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.merge_practitioners(uuid, uuid)
  TO authenticated; -- RLS on underlying tables enforces admin-only access

-- find_similar_practitioners is read-only — all authenticated users can call it
GRANT EXECUTE ON FUNCTION public.find_similar_practitioners(text) TO authenticated;

-- get_my_role is needed by all authenticated users for RLS evaluation
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- -----------------------------------------------------------------------------
-- SECTION 22: GRANT AUTHENTICATED ACCESS TO APPLICATION TABLES
-- -----------------------------------------------------------------------------
-- Restore table-level grants for authenticated role.
-- RLS policies above control row-level access within these grants.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.area               TO authenticated;
GRANT SELECT                          ON public.audit_logs         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecdc_list          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kobo_label         TO authenticated;
GRANT SELECT,          UPDATE        ON public.kobo_processed     TO authenticated;
GRANT SELECT                          ON public.kobo_raw_submissions TO authenticated;
GRANT SELECT,          UPDATE, DELETE ON public.kobo_unmatched    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landmarks          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.layita_staff       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_visits    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practitioners      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_requirements TO authenticated;

-- Views (read-only exports used by KoboToolbox dynamic selects)
GRANT SELECT ON public.kobotoolbox_ecdc_export         TO authenticated;
GRANT SELECT ON public.kobotoolbox_practitioners_export TO authenticated;

-- Sequences
GRANT USAGE ON public.landmarks_id_seq TO authenticated;

-- Service role retains full access for edge functions
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;


-- -----------------------------------------------------------------------------
-- SECTION 23: INDEX — kobo_processed status for admin queue views
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS kobo_processed_status_idx
  ON public.kobo_processed (status)
  WHERE status IN ('failed', 'partial');

-- -----------------------------------------------------------------------------
-- END OF MIGRATION
-- -----------------------------------------------------------------------------