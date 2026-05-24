-- ── 010: Saved passages — canonical standalone migration ─────────────────────
-- saved_passages was first introduced inside migrations 001 and 009.
-- This file is the dedicated, authoritative source of truth for the table.
-- All statements are idempotent — safe to apply to any environment regardless
-- of which prior migrations ran.
--
-- Schema decisions:
--   passage_ref   — free-text chapter reference, e.g. "John 3" or "Romans 8".
--                   Normalised at the application layer (formatPassageRef).
--   note          — optional short annotation, max 2 000 chars. Private only.
--   book/chapter/verse_start/verse_end — nullable, reserved for future
--                   structured anchoring from the reader (v2+). Not written
--                   by any current action; safe to ignore for now.
--   saved_at      — immutable on creation. Updated by application if the user
--                   re-saves the same passage after removing it.
--
-- Assumes: auth.users, update_updated_at_column() (migration 003).

-- ── 1. Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_passages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  passage_ref text        NOT NULL,
  note        text,
  -- Reserved for future structured passage anchoring (reader v2):
  book        text,
  chapter     integer,
  verse_start integer,
  verse_end   integer,
  saved_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_saved_passage_user_ref
    UNIQUE (user_id, passage_ref),

  CONSTRAINT chk_saved_passage_note_len
    CHECK (note IS NULL OR char_length(note) <= 2000),

  CONSTRAINT chk_saved_passage_chapter
    CHECK (chapter IS NULL OR chapter >= 1),

  CONSTRAINT chk_saved_passage_verse_start
    CHECK (verse_start IS NULL OR verse_start >= 1),

  CONSTRAINT chk_saved_passage_verse_end
    CHECK (verse_end IS NULL OR verse_end >= 1),

  CONSTRAINT chk_saved_passage_verse_range
    CHECK (verse_start IS NULL OR verse_end IS NULL OR verse_end >= verse_start)
);

-- ── 2. Additive columns — safe no-ops on fresh installs ──────────────────────
-- These add the structured fields to existing tables (created by 001 or 009)
-- that only had (id, user_id, passage_ref, note, saved_at).

ALTER TABLE saved_passages
  ADD COLUMN IF NOT EXISTS book        text,
  ADD COLUMN IF NOT EXISTS chapter     integer,
  ADD COLUMN IF NOT EXISTS verse_start integer,
  ADD COLUMN IF NOT EXISTS verse_end   integer;

-- ── 3. Constraints — idempotent via EXCEPTION handling ───────────────────────

DO $$
BEGIN
  ALTER TABLE saved_passages
    ADD CONSTRAINT chk_saved_passage_note_len
      CHECK (note IS NULL OR char_length(note) <= 2000);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE saved_passages
    ADD CONSTRAINT chk_saved_passage_chapter
      CHECK (chapter IS NULL OR chapter >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE saved_passages
    ADD CONSTRAINT chk_saved_passage_verse_start
      CHECK (verse_start IS NULL OR verse_start >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE saved_passages
    ADD CONSTRAINT chk_saved_passage_verse_end
      CHECK (verse_end IS NULL OR verse_end >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE saved_passages
    ADD CONSTRAINT chk_saved_passage_verse_range
      CHECK (verse_start IS NULL OR verse_end IS NULL OR verse_end >= verse_start);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- ── 4. Index ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_saved_passages_user
  ON saved_passages (user_id, saved_at DESC);

-- ── 5. Row-level security ─────────────────────────────────────────────────────

ALTER TABLE saved_passages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'saved_passages'
      AND policyname = 'Saved passages: owner'
  ) THEN
    CREATE POLICY "Saved passages: owner"
      ON saved_passages
      FOR ALL
      USING     (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;
