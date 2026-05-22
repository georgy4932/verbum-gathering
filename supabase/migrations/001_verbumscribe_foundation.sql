-- ════════════════════════════════════════════════════════════════════════
-- VerbumScribe Foundation Migration
-- File: supabase/migrations/001_verbumscribe_foundation.sql
--
-- ADDITIVE ONLY. No existing tables are dropped, renamed, or modified
-- destructively. Safe to apply to a live Verbum Gathering database.
-- Idempotent: uses IF NOT EXISTS and ON CONFLICT throughout.
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
-- Additive alongside host_profiles. Both coexist in Phase 1.

CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'member',
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users
);


-- ── 3. ROLE HELPER FUNCTIONS ─────────────────────────────────────────────
-- Single source of truth used in all RLS policies.
-- Falls back to host_profiles for Phase 1 backward compatibility.

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
-- Idempotent. Safe to re-run.

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


-- ── 8. COMPANION — The Word Interpreted ──────────────────────────────────
-- All data is strictly private. No companion data is ever publicly visible.

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


-- ── 9. STUDIO — The Word Proclaimed ─────────────────────────────────────
-- passage_ref nullable at DB to allow draft creation before Scripture assigned.
-- Application layer enforces passage_ref before publish.

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


-- ── 10. WORSHIP — The Word Embodied ─────────────────────────────────────
-- Sets are ordered experiences (position column), not algorithmic playlists.

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


-- ── 11. SAVED ITEMS (cross-movement) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_items (
  id          uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid            NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entity_type saved_item_kind NOT NULL,
  entity_id   text            NOT NULL,
  saved_at    timestamptz     NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);


-- ── 12. INDEXES ───────────────────────────────────────────────────────────

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

-- GIN indexes for scripture_refs array filtering
CREATE INDEX IF NOT EXISTS idx_teachings_refs    ON teachings    USING gin (scripture_refs);
CREATE INDEX IF NOT EXISTS idx_worship_sets_refs ON worship_sets USING gin (scripture_refs);
CREATE INDEX IF NOT EXISTS idx_live_rooms_refs   ON live_rooms   USING gin (scripture_refs);


-- ── 13. ROW LEVEL SECURITY ────────────────────────────────────────────────

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
CREATE POLICY "roles_own_select" ON user_roles FOR SELECT USING (id = auth.uid());
CREATE POLICY "roles_admin_all"  ON user_roles FOR ALL    USING (get_user_role(auth.uid()) = 'admin');

-- companion_notes (private)
CREATE POLICY "companion_notes_owner" ON companion_notes FOR ALL USING (user_id = auth.uid());

-- companion_threads (private)
CREATE POLICY "companion_threads_owner" ON companion_threads FOR ALL USING (user_id = auth.uid());

-- companion_messages (private via thread ownership)
CREATE POLICY "companion_messages_owner" ON companion_messages FOR ALL
  USING (thread_id IN (SELECT id FROM companion_threads WHERE user_id = auth.uid()));

-- saved_passages (private)
CREATE POLICY "saved_passages_owner" ON saved_passages FOR ALL USING (user_id = auth.uid());

-- teaching_series
CREATE POLICY "series_select" ON teaching_series FOR SELECT
  USING (is_published = true OR minister_id = auth.uid());
CREATE POLICY "series_insert" ON teaching_series FOR INSERT
  WITH CHECK (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
CREATE POLICY "series_update" ON teaching_series FOR UPDATE
  USING (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
CREATE POLICY "series_delete" ON teaching_series FOR DELETE
  USING (user_has_role(auth.uid(), 'admin'));

-- teachings
CREATE POLICY "teachings_select" ON teachings FOR SELECT
  USING (is_published = true OR minister_id = auth.uid());
CREATE POLICY "teachings_insert" ON teachings FOR INSERT
  WITH CHECK (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
CREATE POLICY "teachings_update" ON teachings FOR UPDATE
  USING (minister_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
CREATE POLICY "teachings_delete" ON teachings FOR DELETE
  USING (user_has_role(auth.uid(), 'admin'));

-- worship_sets
CREATE POLICY "worship_sets_select" ON worship_sets FOR SELECT
  USING (is_published = true OR curator_id = auth.uid());
CREATE POLICY "worship_sets_insert" ON worship_sets FOR INSERT
  WITH CHECK (user_has_role(auth.uid(), 'minister'));
CREATE POLICY "worship_sets_update" ON worship_sets FOR UPDATE
  USING (curator_id = auth.uid() AND user_has_role(auth.uid(), 'minister'));
CREATE POLICY "worship_sets_delete" ON worship_sets FOR DELETE
  USING (user_has_role(auth.uid(), 'admin'));

-- worship_moments (follows parent set permissions)
CREATE POLICY "worship_moments_select" ON worship_moments FOR SELECT
  USING (
    set_id IN (SELECT id FROM worship_sets WHERE is_published = true)
    OR set_id IN (SELECT id FROM worship_sets WHERE curator_id = auth.uid())
  );
CREATE POLICY "worship_moments_write" ON worship_moments FOR ALL
  USING (
    set_id IN (SELECT id FROM worship_sets WHERE curator_id = auth.uid())
    AND user_has_role(auth.uid(), 'minister')
  );

-- devotional_practices
CREATE POLICY "practices_select" ON devotional_practices FOR SELECT USING (is_published = true);
CREATE POLICY "practices_write"  ON devotional_practices FOR ALL   USING (user_has_role(auth.uid(), 'minister'));

-- saved_items (private)
CREATE POLICY "saved_items_owner" ON saved_items FOR ALL USING (user_id = auth.uid());
