-- ── 006b: Add UNIQUE constraint to user_reflections ──────────────────────────
-- The table was created by an earlier migration with only a partial unique index
-- (WHERE plan_id IS NOT NULL AND plan_day IS NOT NULL).  Supabase's PostgREST
-- .upsert() generates: ON CONFLICT (cols) DO UPDATE — without a WHERE predicate —
-- which PostgreSQL cannot resolve against a partial index.
--
-- A full UNIQUE constraint on the same columns is the correct fix.
-- PostgreSQL NULL≠NULL semantics in UNIQUE mean free-form rows (both NULL) still
-- don't conflict with each other, so future un-anchored reflections are unaffected.
-- Idempotent: EXCEPTION WHEN duplicate_object skips if already present.

DO $$
BEGIN
  ALTER TABLE user_reflections
    ADD CONSTRAINT uq_user_reflection_plan_day
      UNIQUE (user_id, plan_id, plan_day);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
