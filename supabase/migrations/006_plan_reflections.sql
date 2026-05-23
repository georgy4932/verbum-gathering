-- ── 006: Private plan-day reflections ────────────────────────────────────────
-- Additive migration only.
-- Does NOT touch reading_plans or user_reading_plan_progress.
-- Requires migrations 001-005 (reading_plans tables, update_updated_at_column()).
--
-- Changes:
--   1. user_reflections table (one private journal entry per user × plan × day)
--   2. Indexes for plan-day lookups and recent-reflection queries
--   3. updated_at trigger (reuses update_updated_at_column from migration 003)
--   4. RLS: four explicit per-operation policies, private to each user

-- ── 1. Table ──────────────────────────────────────────────────────────────────
-- plan_id, plan_day, and passage_ref are all optional so the table can later
-- hold free-form reflections not tied to a plan.  For Phase F, plan_id and
-- plan_day are always supplied by the server action.
-- UNIQUE (user_id, plan_id, plan_day): PostgreSQL treats NULL ≠ NULL in UNIQUE
-- constraints, so free-form rows (both NULL) are never accidentally blocked.

CREATE TABLE IF NOT EXISTS user_reflections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  plan_id     UUID                 REFERENCES reading_plans(id) ON DELETE SET NULL,
  plan_day    INTEGER,
  passage_ref TEXT,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_reflection_plan_day UNIQUE (user_id, plan_id, plan_day),
  CONSTRAINT chk_reflection_plan_day     CHECK (plan_day IS NULL OR plan_day >= 1),
  CONSTRAINT chk_reflection_content_len  CHECK (char_length(content) BETWEEN 1 AND 5000)
);

-- ── 2. Indexes ─────────────────────────────────────────────────────────────────
-- Covers getReflectionsForPlan (user_id + plan_id filter, ordered by plan_day).
CREATE INDEX IF NOT EXISTS idx_user_reflections_plan
  ON user_reflections (user_id, plan_id);

-- Covers getRecentReflections (user_id filter, ordered by updated_at DESC).
CREATE INDEX IF NOT EXISTS idx_user_reflections_recent
  ON user_reflections (user_id, updated_at DESC);

-- ── 3. updated_at trigger ─────────────────────────────────────────────────────
-- update_updated_at_column() was created in migration 003.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname  = 'trg_user_reflections_updated_at'
      AND tgrelid = 'user_reflections'::regclass
  ) THEN
    CREATE TRIGGER trg_user_reflections_updated_at
      BEFORE UPDATE ON user_reflections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- ── 4. Row-level security ─────────────────────────────────────────────────────
-- Reflections are strictly private: no policy grants cross-user visibility.

ALTER TABLE user_reflections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_reflections'
      AND policyname = 'Reflections: select own'
  ) THEN
    CREATE POLICY "Reflections: select own"
      ON user_reflections FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_reflections'
      AND policyname = 'Reflections: insert own'
  ) THEN
    CREATE POLICY "Reflections: insert own"
      ON user_reflections FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_reflections'
      AND policyname = 'Reflections: update own'
  ) THEN
    CREATE POLICY "Reflections: update own"
      ON user_reflections FOR UPDATE
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_reflections'
      AND policyname = 'Reflections: delete own'
  ) THEN
    CREATE POLICY "Reflections: delete own"
      ON user_reflections FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END;
$$;
