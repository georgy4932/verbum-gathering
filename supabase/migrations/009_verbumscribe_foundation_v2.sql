-- ════════════════════════════════════════════════════════════════════════
-- VerbumScribe Foundation Migration (RLS-hardened, idempotent)
-- Safe to apply to a live Verbum Gathering database.
-- ADDITIVE ONLY: no destructive changes.
-- Idempotent where possible via IF NOT EXISTS guards.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. ENUMS ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member', 'guide', 'minister', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE teaching_kind AS ENUM ('sermon', 'devotion', 'study', 'lecture');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE worship_set_kind AS ENUM ('curated', 'liturgical', 'seasonal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE worship_moment_kind AS ENUM ('song', 'reading', 'prayer', 'silence', 'reflection');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE devotional_kind AS ENUM ('daily', 'weekly', 'seasonal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE saved_item_kind AS ENUM ('devotion', 'teaching', 'worship_set', 'passage', 'note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 2. ROLES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'member',
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users
);


-- ── 3. ROLE HELPER FUNCTIONS ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM user_roles WHERE id = uid),
    CASE WHEN EXISTS (
      SELECT 1 FROM host_profiles WHERE id = uid AND is_host = true
    ) THEN 'guide' END,
    'member'
  );
$$;

CREATE OR REPLACE FUNCTION user_has_role(uid uuid, min_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT get_user_role(uid) = ANY(
    CASE min_role
      WHEN 'member'   THEN ARRAY['member', 'guide', 'minister', 'admin']
      WHEN 'guide'    THEN ARRAY['guide', 'minister', 'admin']
      WHEN 'minister' THEN ARRAY['minister', 'admin']
      WHEN 'admin'    THEN ARRAY['admin']
      ELSE ARRAY[]::text[]
    END
  );
$$;


-- ── 4. AUTO-GRANT MEMBER ROLE ON SIGN-UP ─────────────────────────────────

CREATE OR REPLACE FUNCTION _grant_member_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_roles (id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_member_role ON auth.users;

CREATE TRIGGER trg_grant_member_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION _grant_member_role_on_signup();


-- ── 5. BACKFILL EXISTING HOSTS INTO user_roles ───────────────────────────

INSERT INTO user_roles (id, role, granted_at)
SELECT hp.id, 'guide'::user_role, now()
FROM   host_profiles hp
WHERE  hp.is_host = true
  AND  NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.id = hp.id)
ON CONFLICT (id) DO NOTHING;


-- ── 6. COMPATIBILITY VIEW ────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_user_roles AS
SELECT
  u.id,
  COALESCE(
    ur.role::text,
    CASE WHEN hp.is_host THEN 'guide' END,
    'member'
  )::text AS role,
  COALESCE(ur.granted_at, now()) AS granted_at
FROM auth.users u
LEFT JOIN user_roles    ur ON ur.id = u.id
LEFT JOIN host_profiles hp ON hp.id = u.id;


-- ── 7. EXTEND EXISTING GATHERING TABLES (additive only) ──────────────────

ALTER TABLE live_rooms
  ADD COLUMN IF NOT EXISTS passage_ref    text,
  ADD COLUMN IF NOT EXISTS scripture_refs text[] NOT NULL DEFAULT '{}';

ALTER TABLE fellowship_rooms
  ADD COLUMN IF NOT EXISTS passage_ref text,
  ADD COLUMN IF NOT EXISTS theme       text;

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS passage_ref    text,
  ADD COLUMN IF NOT EXISTS scripture_refs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS host_user_id   uuid REFERENCES auth.users;

ALTER TABLE devotions
  ADD COLUMN IF NOT EXISTS scripture_refs text[] NOT NULL DEFAULT '{}';


-- ── 8. COMPANION — The Word Interpreted (all private) ────────────────────

CREATE TABLE IF NOT EXISTS companion_notes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  passage_ref    text        NOT NULL,
  scripture_refs text[]      NOT NULL DEFAULT '{}',
  body           text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companion_threads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  passage_ref text        NOT NULL,
  title       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companion_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid        NOT NULL REFERENCES companion_threads ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_passages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  passage_ref text        NOT NULL,
  note        text,
  saved_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, passage_ref)
);


-- ── 9. STUDIO — The Word Proclaimed ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS teaching_series (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        UNIQUE NOT NULL,
  title           text        NOT NULL,
  description     text,
  minister_id     uuid        REFERENCES auth.users,
  cover_image_url text,
  is_published    boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teachings (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text          UNIQUE NOT NULL,
  title            text          NOT NULL,
  series_id        uuid          REFERENCES teaching_series,
  minister_id      uuid          NOT NULL REFERENCES auth.users,
  kind             teaching_kind NOT NULL DEFAULT 'sermon',
  passage_ref      text,
  scripture_refs   text[]        NOT NULL DEFAULT '{}',
  body             text,
  audio_url        text,
  video_url        text,
  duration_seconds integer,
  is_published     boolean       NOT NULL DEFAULT false,
  published_at     timestamptz,
  created_at       timestamptz   NOT NULL DEFAULT now()
);


-- ── 10. WORSHIP — The Word Embodied ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS worship_sets (
  id             uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text             UNIQUE NOT NULL,
  title          text             NOT NULL,
  description    text,
  passage_ref    text,
  scripture_refs text[]           NOT NULL DEFAULT '{}',
  curator_id     uuid             REFERENCES auth.users,
  kind           worship_set_kind NOT NULL DEFAULT 'curated',
  is_published   boolean          NOT NULL DEFAULT false,
  created_at     timestamptz      NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worship_moments (
  id               uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id           uuid                NOT NULL REFERENCES worship_sets ON DELETE CASCADE,
  kind             worship_moment_kind NOT NULL,
  title            text,
  body             text,
  passage_ref      text,
  media_url        text,
  duration_seconds integer,
  position         integer             NOT NULL DEFAULT 0,
  created_at       timestamptz         NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devotional_practices (
  id             uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text            UNIQUE NOT NULL,
  title          text            NOT NULL,
  description    text,
  passage_ref    text,
  scripture_refs text[]          NOT NULL DEFAULT '{}',
  kind           devotional_kind NOT NULL DEFAULT 'daily',
  is_published   boolean         NOT NULL DEFAULT false,
  created_at     timestamptz     NOT NULL DEFAULT now()
);


-- ── 11. SAVED ITEMS (cross-movement, private) ────────────────────────────

CREATE TABLE IF NOT EXISTS saved_items (
  id          uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid            NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entity_type saved_item_kind NOT NULL,
  entity_id   text            NOT NULL,
  saved_at    timestamptz     NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);


-- ── 12. INDEXES ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_roles_role           ON user_roles (role);

CREATE INDEX IF NOT EXISTS idx_companion_notes_user      ON companion_notes (user_id);
CREATE INDEX IF NOT EXISTS idx_companion_notes_passage   ON companion_notes (passage_ref);
CREATE INDEX IF NOT EXISTS idx_companion_threads_user    ON companion_threads (user_id);
CREATE INDEX IF NOT EXISTS idx_companion_messages_thread ON companion_messages (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_saved_passages_user       ON saved_passages (user_id);

CREATE INDEX IF NOT EXISTS idx_teachings_published       ON teachings (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_teachings_minister        ON teachings (minister_id);
CREATE INDEX IF NOT EXISTS idx_teachings_series          ON teachings (series_id);
CREATE INDEX IF NOT EXISTS idx_series_published          ON teaching_series (is_published);

CREATE INDEX IF NOT EXISTS idx_worship_sets_published    ON worship_sets (is_published);
CREATE INDEX IF NOT EXISTS idx_worship_moments_set_pos   ON worship_moments (set_id, position);
CREATE INDEX IF NOT EXISTS idx_saved_items_user          ON saved_items (user_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_teachings_refs    ON teachings    USING gin (scripture_refs);
CREATE INDEX IF NOT EXISTS idx_worship_sets_refs ON worship_sets USING gin (scripture_refs);
CREATE INDEX IF NOT EXISTS idx_live_rooms_refs   ON live_rooms   USING gin (scripture_refs);


-- ── 13. ROW LEVEL SECURITY (idempotent) ──────────────────────────────────

ALTER TABLE user_roles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_passages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_series      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE worship_sets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE worship_moments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items          ENABLE ROW LEVEL SECURITY;

-- user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_roles'
      AND policyname = 'roles_own_select'
  ) THEN
    CREATE POLICY "roles_own_select"
      ON user_roles
      FOR SELECT
      USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_roles'
      AND policyname = 'roles_admin_all'
  ) THEN
    CREATE POLICY "roles_admin_all"
      ON user_roles
      FOR ALL
      USING (user_has_role(auth.uid(), 'admin'));
  END IF;
END;
$$;

-- companion_notes (private)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'companion_notes'
      AND policyname = 'Companion notes: owner'
  ) THEN
    CREATE POLICY "Companion notes: owner"
      ON companion_notes
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;

-- companion_threads (private)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'companion_threads'
      AND policyname = 'Companion threads: owner'
  ) THEN
    CREATE POLICY "Companion threads: owner"
      ON companion_threads
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;

-- companion_messages (private via thread ownership)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'companion_messages'
      AND policyname = 'Companion messages: via thread'
  ) THEN
    CREATE POLICY "Companion messages: via thread"
      ON companion_messages
      FOR ALL
      USING (
        thread_id IN (
          SELECT id FROM companion_threads WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        thread_id IN (
          SELECT id FROM companion_threads WHERE user_id = auth.uid()
        )
      );
  END IF;
END;
$$;

-- saved_passages (private)
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
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;

-- teaching_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'teaching_series'
      AND policyname = 'Series: select'
  ) THEN
    CREATE POLICY "Series: select"
      ON teaching_series
      FOR SELECT
      USING (is_published = true OR minister_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'teaching_series'
      AND policyname = 'Series: insert minister'
  ) THEN
    CREATE POLICY "Series: insert minister"
      ON teaching_series
      FOR INSERT
      WITH CHECK (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'teaching_series'
      AND policyname = 'Series: update own'
  ) THEN
    CREATE POLICY "Series: update own"
      ON teaching_series
      FOR UPDATE
      USING (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'))
      WITH CHECK (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'teaching_series'
      AND policyname = 'Series: delete admin'
  ) THEN
    CREATE POLICY "Series: delete admin"
      ON teaching_series
      FOR DELETE
      USING (user_has_role(auth.uid(), 'admin'));
  END IF;
END;
$$;

-- teachings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'teachings'
      AND policyname = 'Teachings: select'
  ) THEN
    CREATE POLICY "Teachings: select"
      ON teachings
      FOR SELECT
      USING (is_published = true OR minister_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'teachings'
      AND policyname = 'Teachings: insert minister'
  ) THEN
    CREATE POLICY "Teachings: insert minister"
      ON teachings
      FOR INSERT
      WITH CHECK (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'teachings'
      AND policyname = 'Teachings: update own'
  ) THEN
    CREATE POLICY "Teachings: update own"
      ON teachings
      FOR UPDATE
      USING (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'))
      WITH CHECK (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'teachings'
      AND policyname = 'Teachings: delete admin'
  ) THEN
    CREATE POLICY "Teachings: delete admin"
      ON teachings
      FOR DELETE
      USING (user_has_role(auth.uid(), 'admin'));
  END IF;
END;
$$;

-- worship_sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'worship_sets'
      AND policyname = 'Worship sets: select'
  ) THEN
    CREATE POLICY "Worship sets: select"
      ON worship_sets
      FOR SELECT
      USING (is_published = true OR curator_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'worship_sets'
      AND policyname = 'Worship sets: insert minister'
  ) THEN
    CREATE POLICY "Worship sets: insert minister"
      ON worship_sets
      FOR INSERT
      WITH CHECK (curator_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'worship_sets'
      AND policyname = 'Worship sets: update own'
  ) THEN
    CREATE POLICY "Worship sets: update own"
      ON worship_sets
      FOR UPDATE
      USING (curator_id = auth.uid() AND user_has_role(auth.uid(), 'minister'))
      WITH CHECK (curator_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'worship_sets'
      AND policyname = 'Worship sets: delete admin'
  ) THEN
    CREATE POLICY "Worship sets: delete admin"
      ON worship_sets
      FOR DELETE
      USING (user_has_role(auth.uid(), 'admin'));
  END IF;
END;
$$;

-- worship_moments (inherit permissions from parent set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'worship_moments'
      AND policyname = 'Worship moments: select'
  ) THEN
    CREATE POLICY "Worship moments: select"
      ON worship_moments
      FOR SELECT
      USING (
        set_id IN (SELECT id FROM worship_sets WHERE is_published = true)
        OR set_id IN (SELECT id FROM worship_sets WHERE curator_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'worship_moments'
      AND policyname = 'Worship moments: write'
  ) THEN
    CREATE POLICY "Worship moments: write"
      ON worship_moments
      FOR ALL
      USING (
        set_id IN (SELECT id FROM worship_sets WHERE curator_id = auth.uid())
        AND user_has_role(auth.uid(), 'minister')
      )
      WITH CHECK (
        set_id IN (SELECT id FROM worship_sets WHERE curator_id = auth.uid())
        AND user_has_role(auth.uid(), 'minister')
      );
  END IF;
END;
$$;

-- devotional_practices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'devotional_practices'
      AND policyname = 'Practices: select published'
  ) THEN
    CREATE POLICY "Practices: select published"
      ON devotional_practices
      FOR SELECT
      USING (is_published = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'devotional_practices'
      AND policyname = 'Practices: write minister'
  ) THEN
    CREATE POLICY "Practices: write minister"
      ON devotional_practices
      FOR ALL
      USING (user_has_role(auth.uid(), 'minister'))
      WITH CHECK (user_has_role(auth.uid(), 'minister'));
  END IF;
END;
$$;

-- saved_items (private)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'saved_items'
      AND policyname = 'Saved items: owner'
  ) THEN
    CREATE POLICY "Saved items: owner"
      ON saved_items
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;
