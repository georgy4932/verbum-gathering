-- ── 008: Study notes ────────────────────────────────────────────────────────
-- Distinct from user_reflections (brief devotional, day-linked).
-- Study notes are longer-form, passage-anchored, open-ended — a personal
-- Scripture study journal.  Private only; no sharing, no feed.
-- The structured book/chapter/verse fields are nullable in v1 (passage_ref
-- is free-form) but are reserved for passage-anchoring from the reader.

CREATE TABLE IF NOT EXISTS study_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  content     TEXT        NOT NULL DEFAULT '',
  passage_ref TEXT,
  book        TEXT,
  chapter     INTEGER,
  verse_start INTEGER,
  verse_end   INTEGER,
  note_date   DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_study_note_title   CHECK (title   IS NULL OR char_length(title)   <= 500),
  CONSTRAINT chk_study_note_content CHECK (char_length(content) <= 50000)
);

CREATE INDEX IF NOT EXISTS idx_study_notes_recent  ON study_notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_notes_passage ON study_notes (user_id, book, chapter);
CREATE INDEX IF NOT EXISTS idx_study_notes_date    ON study_notes (user_id, note_date DESC);

CREATE OR REPLACE FUNCTION update_study_notes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_study_notes_updated_at ON study_notes;
CREATE TRIGGER trg_study_notes_updated_at
  BEFORE UPDATE ON study_notes
  FOR EACH ROW EXECUTE FUNCTION update_study_notes_updated_at();

ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'study_notes' AND policyname = 'Study notes: select own'
  ) THEN
    CREATE POLICY "Study notes: select own"
      ON study_notes FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'study_notes' AND policyname = 'Study notes: insert own'
  ) THEN
    CREATE POLICY "Study notes: insert own"
      ON study_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'study_notes' AND policyname = 'Study notes: update own'
  ) THEN
    CREATE POLICY "Study notes: update own"
      ON study_notes FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'study_notes' AND policyname = 'Study notes: delete own'
  ) THEN
    CREATE POLICY "Study notes: delete own"
      ON study_notes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$;
