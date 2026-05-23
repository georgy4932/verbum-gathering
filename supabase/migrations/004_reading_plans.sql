-- ── Reading plan tables ──────────────────────────────────────────────────────

CREATE TABLE reading_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  total_days  INTEGER NOT NULL,
  passages    JSONB NOT NULL, -- [{day: 1, passages: ["Genesis 1", "Psalm 1"]}, ...]
  created_by  UUID REFERENCES auth.users,
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reading_plans_public ON reading_plans(is_public) WHERE is_public = TRUE;

CREATE TABLE user_reading_plan_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users NOT NULL,
  plan_id        UUID REFERENCES reading_plans NOT NULL,
  current_day    INTEGER DEFAULT 1,
  completed_days INTEGER[] DEFAULT '{}',
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  last_read_at   TIMESTAMPTZ,
  UNIQUE(user_id, plan_id)
);

CREATE INDEX idx_user_progress_user ON user_reading_plan_progress(user_id);
CREATE INDEX idx_user_progress_plan ON user_reading_plan_progress(plan_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public plans visible to all"
  ON reading_plans FOR SELECT
  USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY "Users create own plans"
  ON reading_plans FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users manage own progress"
  ON user_reading_plan_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Seed: Gospel of John in 7 Days (21 chapters, 3/day) ─────────────────────

INSERT INTO reading_plans (title, description, total_days, passages, is_public)
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
  true
FROM generate_series(1, 7) d;

-- ── Seed: Psalms in 30 Days (150 psalms, 5/day) ──────────────────────────────

INSERT INTO reading_plans (title, description, total_days, passages, is_public)
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
  true
FROM generate_series(1, 30) d;

-- ── Seed: Proverbs in 31 Days (31 chapters, 1/day) ───────────────────────────

INSERT INTO reading_plans (title, description, total_days, passages, is_public)
SELECT
  'Proverbs in 31 Days',
  'One chapter of Proverbs each day — wisdom aligned to every day of the month.',
  31,
  jsonb_agg(
    jsonb_build_object('day', d, 'passages', jsonb_build_array('Proverbs ' || d))
    ORDER BY d
  ),
  true
FROM generate_series(1, 31) d;

-- ── Seed: New Testament in 90 Days (260 chapters, ~3/day) ────────────────────

DO $$
DECLARE
  nt_books TEXT[][] := ARRAY[
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
  chapters TEXT[] := '{}';
  book     TEXT[];
  c        INT;
  total    INT;
  plan_days JSONB := '[]'::JSONB;
  s        INT;
  e        INT;
BEGIN
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

  INSERT INTO reading_plans (title, description, total_days, passages, is_public)
  VALUES (
    'New Testament in 90 Days',
    'From Matthew to Revelation in three months — about three chapters each day.',
    90,
    plan_days,
    true
  );
END;
$$;

-- ── Seed: Bible in a Year (1189 chapters, ~3-4/day) ──────────────────────────

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

  INSERT INTO reading_plans (title, description, total_days, passages, is_public)
  VALUES (
    'Bible in a Year',
    'Read the entire Bible in 365 days — three to four chapters each day, Genesis to Revelation.',
    365,
    plan_days,
    true
  );
END;
$$;
