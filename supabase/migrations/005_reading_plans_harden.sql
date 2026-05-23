-- ── 005: Reading plans — hardening ───────────────────────────────────────────
-- Additive migration; safe to re-run on a DB where 004 is already applied.
-- Nothing here drops or rewrites existing data.
--
-- Changes:
--   1. slug column + partial unique index on reading_plans
--   2. Backfill slugs for existing public seed plans
--   3. CHECK constraints: total_days >= 1, current_day >= 1, slug format
--   4. Replace FOR ALL progress policy with explicit SELECT/INSERT/UPDATE/DELETE
--   5. Idempotent reseed of all five public plans (ON CONFLICT (slug) … DO NOTHING)

-- ── 1. slug column ────────────────────────────────────────────────────────────
-- Nullable so user-created plans can omit it.
-- Partial unique index enforces uniqueness only among non-null slugs.

ALTER TABLE reading_plans ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_plans_slug
  ON reading_plans(slug) WHERE slug IS NOT NULL;

-- ── 2. Backfill slugs for existing seeded rows ────────────────────────────────
-- WHERE slug IS NULL guards against re-running: already-backfilled rows are skipped.

UPDATE reading_plans SET slug = 'gospel-of-john-7-days'
  WHERE is_public AND title = 'Gospel of John in 7 Days'    AND slug IS NULL;

UPDATE reading_plans SET slug = 'psalms-30-days'
  WHERE is_public AND title = 'Psalms in 30 Days'           AND slug IS NULL;

UPDATE reading_plans SET slug = 'proverbs-31-days'
  WHERE is_public AND title = 'Proverbs in 31 Days'         AND slug IS NULL;

UPDATE reading_plans SET slug = 'new-testament-90-days'
  WHERE is_public AND title = 'New Testament in 90 Days'    AND slug IS NULL;

UPDATE reading_plans SET slug = 'bible-in-a-year'
  WHERE is_public AND title = 'Bible in a Year'             AND slug IS NULL;

-- ── 3. CHECK constraints ──────────────────────────────────────────────────────
-- EXCEPTION WHEN duplicate_object makes each block idempotent.

DO $$
BEGIN
  ALTER TABLE reading_plans
    ADD CONSTRAINT chk_reading_plans_total_days CHECK (total_days >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE reading_plans
    ADD CONSTRAINT chk_reading_plans_slug_format
      CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE user_reading_plan_progress
    ADD CONSTRAINT chk_progress_current_day CHECK (current_day >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- ── 4. Replace FOR ALL with explicit per-operation policies ───────────────────
-- Drop the broad policy first (IF EXISTS = safe no-op if already gone).

DROP POLICY IF EXISTS "Users manage own progress" ON user_reading_plan_progress;

-- Create each specific policy only if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_reading_plan_progress'
      AND policyname = 'Progress: select own'
  ) THEN
    CREATE POLICY "Progress: select own"
      ON user_reading_plan_progress FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_reading_plan_progress'
      AND policyname = 'Progress: insert own'
  ) THEN
    CREATE POLICY "Progress: insert own"
      ON user_reading_plan_progress FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_reading_plan_progress'
      AND policyname = 'Progress: update own'
  ) THEN
    CREATE POLICY "Progress: update own"
      ON user_reading_plan_progress FOR UPDATE
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_reading_plan_progress'
      AND policyname = 'Progress: delete own'
  ) THEN
    CREATE POLICY "Progress: delete own"
      ON user_reading_plan_progress FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- ── 5. Idempotent reseed ──────────────────────────────────────────────────────
-- Every INSERT uses ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING.
-- If backfill (step 2) already set the slug, these are pure no-ops.
-- If 004 was never run, these insert the plans fresh.

-- Gospel of John in 7 Days ────────────────────────────────────────────────────
INSERT INTO reading_plans (title, description, total_days, passages, is_public, slug)
SELECT
  'Gospel of John in 7 Days',
  'An immersive week through the Gospel of John — three chapters each day.',
  7,
  jsonb_agg(
    jsonb_build_object(
      'day', d,
      'passages', (
        SELECT jsonb_agg('John ' || c ORDER BY c)
        FROM generate_series((d - 1) * 3 + 1, d * 3) c
      )
    ) ORDER BY d
  ),
  true,
  'gospel-of-john-7-days'
FROM generate_series(1, 7) d
ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;

-- Psalms in 30 Days ───────────────────────────────────────────────────────────
INSERT INTO reading_plans (title, description, total_days, passages, is_public, slug)
SELECT
  'Psalms in 30 Days',
  'Journey through all 150 Psalms in one month — five psalms each day.',
  30,
  jsonb_agg(
    jsonb_build_object(
      'day', d,
      'passages', (
        SELECT jsonb_agg('Psalm ' || p ORDER BY p)
        FROM generate_series((d - 1) * 5 + 1, d * 5) p
      )
    ) ORDER BY d
  ),
  true,
  'psalms-30-days'
FROM generate_series(1, 30) d
ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;

-- Proverbs in 31 Days ─────────────────────────────────────────────────────────
INSERT INTO reading_plans (title, description, total_days, passages, is_public, slug)
SELECT
  'Proverbs in 31 Days',
  'One chapter of Proverbs each day — wisdom aligned to every day of the month.',
  31,
  jsonb_agg(
    jsonb_build_object('day', d, 'passages', jsonb_build_array('Proverbs ' || d))
    ORDER BY d
  ),
  true,
  'proverbs-31-days'
FROM generate_series(1, 31) d
ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;

-- New Testament in 90 Days ────────────────────────────────────────────────────
-- Guard at the top skips the expensive array-build when the plan already exists.
DO $$
DECLARE
  nt_books  TEXT[][] := ARRAY[
    ARRAY['Matthew','28'],        ARRAY['Mark','16'],
    ARRAY['Luke','24'],           ARRAY['John','21'],
    ARRAY['Acts','28'],           ARRAY['Romans','16'],
    ARRAY['1 Corinthians','16'],  ARRAY['2 Corinthians','13'],
    ARRAY['Galatians','6'],       ARRAY['Ephesians','6'],
    ARRAY['Philippians','4'],     ARRAY['Colossians','4'],
    ARRAY['1 Thessalonians','5'], ARRAY['2 Thessalonians','3'],
    ARRAY['1 Timothy','6'],       ARRAY['2 Timothy','4'],
    ARRAY['Titus','3'],           ARRAY['Philemon','1'],
    ARRAY['Hebrews','13'],        ARRAY['James','5'],
    ARRAY['1 Peter','5'],         ARRAY['2 Peter','3'],
    ARRAY['1 John','5'],          ARRAY['2 John','1'],
    ARRAY['3 John','1'],          ARRAY['Jude','1'],
    ARRAY['Revelation','22']
  ];
  chapters  TEXT[] := '{}';
  book      TEXT[];
  c         INT;
  total     INT;
  plan_days JSONB := '[]'::JSONB;
  s         INT;
  e         INT;
BEGIN
  IF EXISTS (SELECT 1 FROM reading_plans WHERE slug = 'new-testament-90-days') THEN RETURN; END IF;

  FOREACH book SLICE 1 IN ARRAY nt_books LOOP
    FOR c IN 1 .. book[2]::INT LOOP
      chapters := array_append(chapters, book[1] || ' ' || c);
    END LOOP;
  END LOOP;
  total := array_length(chapters, 1); -- 260

  FOR d IN 1 .. 90 LOOP
    s := 1 + round((d - 1) * total::FLOAT / 90)::INT;
    e :=     round( d      * total::FLOAT / 90)::INT;
    plan_days := plan_days || jsonb_build_array(
      jsonb_build_object('day', d, 'passages', to_jsonb(chapters[s:e]))
    );
  END LOOP;

  INSERT INTO reading_plans (title, description, total_days, passages, is_public, slug)
  VALUES (
    'New Testament in 90 Days',
    'From Matthew to Revelation in three months — about three chapters each day.',
    90,
    plan_days,
    true,
    'new-testament-90-days'
  )
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
END;
$$;

-- Bible in a Year ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  all_books TEXT[][] := ARRAY[
    ARRAY['Genesis','50'],        ARRAY['Exodus','40'],
    ARRAY['Leviticus','27'],      ARRAY['Numbers','36'],
    ARRAY['Deuteronomy','34'],    ARRAY['Joshua','24'],
    ARRAY['Judges','21'],         ARRAY['Ruth','4'],
    ARRAY['1 Samuel','31'],       ARRAY['2 Samuel','24'],
    ARRAY['1 Kings','22'],        ARRAY['2 Kings','25'],
    ARRAY['1 Chronicles','29'],   ARRAY['2 Chronicles','36'],
    ARRAY['Ezra','10'],           ARRAY['Nehemiah','13'],
    ARRAY['Esther','10'],         ARRAY['Job','42'],
    ARRAY['Psalms','150'],        ARRAY['Proverbs','31'],
    ARRAY['Ecclesiastes','12'],   ARRAY['Song of Solomon','8'],
    ARRAY['Isaiah','66'],         ARRAY['Jeremiah','52'],
    ARRAY['Lamentations','5'],    ARRAY['Ezekiel','48'],
    ARRAY['Daniel','12'],         ARRAY['Hosea','14'],
    ARRAY['Joel','3'],            ARRAY['Amos','9'],
    ARRAY['Obadiah','1'],         ARRAY['Jonah','4'],
    ARRAY['Micah','7'],           ARRAY['Nahum','3'],
    ARRAY['Habakkuk','3'],        ARRAY['Zephaniah','3'],
    ARRAY['Haggai','2'],          ARRAY['Zechariah','14'],
    ARRAY['Malachi','4'],         ARRAY['Matthew','28'],
    ARRAY['Mark','16'],           ARRAY['Luke','24'],
    ARRAY['John','21'],           ARRAY['Acts','28'],
    ARRAY['Romans','16'],         ARRAY['1 Corinthians','16'],
    ARRAY['2 Corinthians','13'],  ARRAY['Galatians','6'],
    ARRAY['Ephesians','6'],       ARRAY['Philippians','4'],
    ARRAY['Colossians','4'],      ARRAY['1 Thessalonians','5'],
    ARRAY['2 Thessalonians','3'], ARRAY['1 Timothy','6'],
    ARRAY['2 Timothy','4'],       ARRAY['Titus','3'],
    ARRAY['Philemon','1'],        ARRAY['Hebrews','13'],
    ARRAY['James','5'],           ARRAY['1 Peter','5'],
    ARRAY['2 Peter','3'],         ARRAY['1 John','5'],
    ARRAY['2 John','1'],          ARRAY['3 John','1'],
    ARRAY['Jude','1'],            ARRAY['Revelation','22']
  ];
  chapters  TEXT[] := '{}';
  book      TEXT[];
  c         INT;
  total     INT;
  plan_days JSONB := '[]'::JSONB;
  s         INT;
  e         INT;
BEGIN
  IF EXISTS (SELECT 1 FROM reading_plans WHERE slug = 'bible-in-a-year') THEN RETURN; END IF;

  FOREACH book SLICE 1 IN ARRAY all_books LOOP
    FOR c IN 1 .. book[2]::INT LOOP
      chapters := array_append(chapters, book[1] || ' ' || c);
    END LOOP;
  END LOOP;
  total := array_length(chapters, 1); -- 1189

  FOR d IN 1 .. 365 LOOP
    s := 1 + round((d - 1) * total::FLOAT / 365)::INT;
    e :=     round( d      * total::FLOAT / 365)::INT;
    plan_days := plan_days || jsonb_build_array(
      jsonb_build_object('day', d, 'passages', to_jsonb(chapters[s:e]))
    );
  END LOOP;

  INSERT INTO reading_plans (title, description, total_days, passages, is_public, slug)
  VALUES (
    'Bible in a Year',
    'Read the entire Bible in 365 days — three to four chapters each day, Genesis to Revelation.',
    365,
    plan_days,
    true,
    'bible-in-a-year'
  )
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
END;
$$;
