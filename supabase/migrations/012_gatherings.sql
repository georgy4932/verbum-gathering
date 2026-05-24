-- ── 012: Gatherings — digital church halls with dedicated rooms ───────────────
-- A Gathering is a structured discipleship space created by a host.
-- Each Gathering has five conceptual sections backed by child tables:
--   Home (gatherings row itself), Study, Discussion, Prayer, Live sessions.
--
-- Visibility modes:
--   public      — discoverable and viewable by everyone, joinable by all.
--   community   — discoverable by signed-in users, joinable by all auth users.
--   private     — visible only to members; host/moderator add members explicitly.
--
-- Roles:
--   host        — creator; full control.
--   moderator   — reserved; schema ready, v1 UI exposes host/member only.
--   member      — joined participant.
--
-- RLS strategy:
--   SECURITY DEFINER helper functions encapsulate membership/visibility logic
--   to avoid circular dependencies between gatherings and gathering_members.
--   All helpers are based on auth.uid() — no uid parameter needed.
--
-- Assumes: auth.users, update_updated_at_column() (from earlier migration).


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. CORE TABLE: gatherings
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gatherings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        UNIQUE NOT NULL,
  name            text        NOT NULL,
  description     text,
  host_id         uuid        NOT NULL REFERENCES auth.users ON DELETE RESTRICT,
  visibility      text        NOT NULL DEFAULT 'public',
  cover_image_url text,
  passage_ref     text,
  is_active       boolean     NOT NULL DEFAULT true,
  member_count    integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_gathering_visibility
    CHECK (visibility IN ('public', 'community', 'private')),
  CONSTRAINT chk_gathering_name_len
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  CONSTRAINT chk_gathering_slug_format
    CHECK (
      slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
      OR slug ~ '^[a-z0-9]$'
    ),
  CONSTRAINT chk_gathering_description_len
    CHECK (description IS NULL OR char_length(description) <= 1000)
);

DROP TRIGGER IF EXISTS trg_gatherings_updated_at ON gatherings;
CREATE TRIGGER trg_gatherings_updated_at
  BEFORE UPDATE ON gatherings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. MEMBERSHIP
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gathering_members (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id uuid        NOT NULL REFERENCES gatherings ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role         text        NOT NULL DEFAULT 'member',
  joined_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (gathering_id, user_id),

  CONSTRAINT chk_member_role
    CHECK (role IN ('host', 'moderator', 'member'))
);

CREATE INDEX IF NOT EXISTS idx_gathering_members_gathering
  ON gathering_members (gathering_id);

CREATE INDEX IF NOT EXISTS idx_gathering_members_user
  ON gathering_members (user_id);

-- composite index that matches helper lookups: (gathering_id, user_id)
CREATE INDEX IF NOT EXISTS idx_gathering_members_gid_uid
  ON gathering_members (gathering_id, user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. STUDY POSTS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gathering_study_posts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id    uuid        NOT NULL REFERENCES gatherings ON DELETE CASCADE,
  author_id       uuid        REFERENCES auth.users ON DELETE SET NULL,
  title           text        NOT NULL,
  body            text        NOT NULL,
  passage_ref     text,
  scripture_refs  text[]      NOT NULL DEFAULT '{}',
  is_pinned       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_study_post_title_len
    CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT chk_study_post_body_len
    CHECK (char_length(btrim(body)) BETWEEN 1 AND 10000)
);

DROP TRIGGER IF EXISTS trg_gathering_study_posts_updated_at ON gathering_study_posts;
CREATE TRIGGER trg_gathering_study_posts_updated_at
  BEFORE UPDATE ON gathering_study_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gathering_study_posts_gathering
  ON gathering_study_posts (gathering_id, created_at DESC);


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. DISCUSSION THREADS + REPLIES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gathering_discussion_threads (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id uuid        NOT NULL REFERENCES gatherings ON DELETE CASCADE,
  author_id    uuid        REFERENCES auth.users ON DELETE SET NULL,
  title        text        NOT NULL,
  body         text,
  passage_ref  text,
  is_pinned    boolean     NOT NULL DEFAULT false,
  reply_count  integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_thread_title_len
    CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT chk_thread_body_len
    CHECK (body IS NULL OR char_length(btrim(body)) <= 5000)
);

DROP TRIGGER IF EXISTS trg_gathering_threads_updated_at ON gathering_discussion_threads;
CREATE TRIGGER trg_gathering_threads_updated_at
  BEFORE UPDATE ON gathering_discussion_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gathering_threads_gathering
  ON gathering_discussion_threads (gathering_id, created_at DESC);

-- Replies derive gathering_id via the parent thread.
CREATE TABLE IF NOT EXISTS gathering_discussion_replies (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid        NOT NULL REFERENCES gathering_discussion_threads ON DELETE CASCADE,
  author_id  uuid        REFERENCES auth.users ON DELETE SET NULL,
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_reply_body_len
    CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS idx_gathering_replies_thread
  ON gathering_discussion_replies (thread_id, created_at ASC);

-- Increment reply_count on thread when a reply is inserted.
CREATE OR REPLACE FUNCTION _increment_thread_reply_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE gathering_discussion_threads
  SET reply_count = reply_count + 1,
      updated_at  = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_reply_count ON gathering_discussion_replies;
CREATE TRIGGER trg_increment_reply_count
  AFTER INSERT ON gathering_discussion_replies
  FOR EACH ROW EXECUTE FUNCTION _increment_thread_reply_count();


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. PRAYER REQUESTS + QUIET ACKNOWLEDGMENT
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gathering_prayer_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id    uuid        NOT NULL REFERENCES gatherings ON DELETE CASCADE,
  author_id       uuid        REFERENCES auth.users ON DELETE SET NULL,
  body            text        NOT NULL,
  is_answered     boolean     NOT NULL DEFAULT false,
  praying_count   integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_prayer_body_len
    CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000)
);

DROP TRIGGER IF EXISTS trg_prayer_requests_updated_at ON gathering_prayer_requests;
CREATE TRIGGER trg_prayer_requests_updated_at
  BEFORE UPDATE ON gathering_prayer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gathering_prayer_gathering
  ON gathering_prayer_requests (gathering_id, created_at DESC);

CREATE TABLE IF NOT EXISTS gathering_prayer_acknowledgments (
  request_id uuid        NOT NULL REFERENCES gathering_prayer_requests ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);

-- Sync praying_count automatically.
CREATE OR REPLACE FUNCTION _sync_praying_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gathering_prayer_requests
    SET praying_count = praying_count + 1
    WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gathering_prayer_requests
    SET praying_count = GREATEST(praying_count - 1, 0)
    WHERE id = OLD.request_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_praying_count_insert ON gathering_prayer_acknowledgments;
CREATE TRIGGER trg_praying_count_insert
  AFTER INSERT ON gathering_prayer_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION _sync_praying_count();

DROP TRIGGER IF EXISTS trg_praying_count_delete ON gathering_prayer_acknowledgments;
CREATE TRIGGER trg_praying_count_delete
  AFTER DELETE ON gathering_prayer_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION _sync_praying_count();


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. LIVE SESSIONS (scheduled only — no streaming in v1)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gathering_live_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id     uuid        NOT NULL REFERENCES gatherings ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes integer,
  passage_ref      text,
  stream_url       text,
  is_cancelled     boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_session_title_len
    CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT chk_session_duration
    CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

CREATE INDEX IF NOT EXISTS idx_gathering_sessions_gathering
  ON gathering_live_sessions (gathering_id, scheduled_at ASC);


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. MEMBER COUNT SYNC TRIGGER
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION _sync_gathering_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gatherings
    SET member_count = member_count + 1
    WHERE id = NEW.gathering_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gatherings
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.gathering_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_member_count_insert ON gathering_members;
CREATE TRIGGER trg_member_count_insert
  AFTER INSERT ON gathering_members
  FOR EACH ROW EXECUTE FUNCTION _sync_gathering_member_count();

DROP TRIGGER IF EXISTS trg_member_count_delete ON gathering_members;
CREATE TRIGGER trg_member_count_delete
  AFTER DELETE ON gathering_members
  FOR EACH ROW EXECUTE FUNCTION _sync_gathering_member_count();


-- ══════════════════════════════════════════════════════════════════════════════
-- 9. AUTO-PROVISION: host joins their own gathering
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION _auto_join_gathering_host()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO gathering_members (gathering_id, user_id, role)
  VALUES (NEW.id, NEW.host_id, 'host')
  ON CONFLICT (gathering_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_join_host ON gatherings;
CREATE TRIGGER trg_auto_join_host
  AFTER INSERT ON gatherings
  FOR EACH ROW EXECUTE FUNCTION _auto_join_gathering_host();


-- ══════════════════════════════════════════════════════════════════════════════
-- 10. RLS HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION can_see_gathering(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM gatherings g
    WHERE g.id        = gid
      AND g.is_active = true
      AND (
        g.visibility = 'public'
        OR (g.visibility = 'community' AND auth.uid() IS NOT NULL)
        OR EXISTS (
          SELECT 1
          FROM gathering_members m
          WHERE m.gathering_id = gid
            AND m.user_id      = auth.uid()
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION is_gathering_member(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM gathering_members m
    WHERE m.gathering_id = gid
      AND m.user_id      = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION gathering_member_role(gid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role
  FROM gathering_members
  WHERE gathering_id = gid
    AND user_id      = auth.uid()
  LIMIT 1;
$$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 11. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE gatherings                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_members                ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_study_posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_discussion_threads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_discussion_replies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_prayer_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_prayer_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_live_sessions          ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- gatherings

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gatherings'
      AND policyname = 'Gatherings: select'
  ) THEN
    CREATE POLICY "Gatherings: select"
      ON gatherings
      FOR SELECT
      USING (
        is_active = true
        AND (
          visibility = 'public'
          OR (visibility = 'community' AND auth.uid() IS NOT NULL)
          OR is_gathering_member(id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gatherings'
      AND policyname = 'Gatherings: insert'
  ) THEN
    CREATE POLICY "Gatherings: insert"
      ON gatherings
      FOR INSERT
      TO authenticated
      WITH CHECK (host_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gatherings'
      AND policyname = 'Gatherings: update'
  ) THEN
    CREATE POLICY "Gatherings: update"
      ON gatherings
      FOR UPDATE
      TO authenticated
      USING (host_id = auth.uid())
      WITH CHECK (host_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gatherings'
      AND policyname = 'Gatherings: delete'
  ) THEN
    CREATE POLICY "Gatherings: delete"
      ON gatherings
      FOR DELETE
      TO authenticated
      USING (host_id = auth.uid());
  END IF;


  -- gathering_members

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_members'
      AND policyname = 'Members: select'
  ) THEN
    CREATE POLICY "Members: select"
      ON gathering_members
      FOR SELECT
      USING (can_see_gathering(gathering_id));
  END IF;

  -- self-join for public/community gatherings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_members'
      AND policyname = 'Members: self-join'
  ) THEN
    CREATE POLICY "Members: self-join"
      ON gathering_members
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1
          FROM gatherings g
          WHERE g.id        = gathering_id
            AND g.is_active = true
            AND g.visibility IN ('public', 'community')
        )
      );
  END IF;

  -- host/moderator adds or removes others (e.g. private groups)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_members'
      AND policyname = 'Members: host-add'
  ) THEN
    CREATE POLICY "Members: host-add"
      ON gathering_members
      FOR INSERT
      TO authenticated
      WITH CHECK (
        gathering_member_role(gathering_id) IN ('host', 'moderator')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_members'
      AND policyname = 'Members: leave'
  ) THEN
    CREATE POLICY "Members: leave"
      ON gathering_members
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_members'
      AND policyname = 'Members: host-remove'
  ) THEN
    CREATE POLICY "Members: host-remove"
      ON gathering_members
      FOR DELETE
      TO authenticated
      USING (gathering_member_role(gathering_id) IN ('host', 'moderator'));
  END IF;


  -- gathering_study_posts

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_study_posts'
      AND policyname = 'Study posts: select'
  ) THEN
    CREATE POLICY "Study posts: select"
      ON gathering_study_posts
      FOR SELECT
      USING (can_see_gathering(gathering_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_study_posts'
      AND policyname = 'Study posts: insert'
  ) THEN
    CREATE POLICY "Study posts: insert"
      ON gathering_study_posts
      FOR INSERT
      TO authenticated
      WITH CHECK (
        author_id = auth.uid()
        AND gathering_member_role(gathering_id) IN ('host', 'moderator')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_study_posts'
      AND policyname = 'Study posts: update'
  ) THEN
    CREATE POLICY "Study posts: update"
      ON gathering_study_posts
      FOR UPDATE
      TO authenticated
      USING (
        author_id = auth.uid()
        OR gathering_member_role(gathering_id) IN ('host', 'moderator')
      )
      WITH CHECK (
        author_id = auth.uid()
        OR gathering_member_role(gathering_id) IN ('host', 'moderator')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_study_posts'
      AND policyname = 'Study posts: delete'
  ) THEN
    CREATE POLICY "Study posts: delete"
      ON gathering_study_posts
      FOR DELETE
      TO authenticated
      USING (
        author_id = auth.uid()
        OR gathering_member_role(gathering_id) IN ('host', 'moderator')
      );
  END IF;


  -- gathering_discussion_threads

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_discussion_threads'
      AND policyname = 'Threads: select'
  ) THEN
    CREATE POLICY "Threads: select"
      ON gathering_discussion_threads
      FOR SELECT
      USING (can_see_gathering(gathering_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_discussion_threads'
      AND policyname = 'Threads: insert'
  ) THEN
    CREATE POLICY "Threads: insert"
      ON gathering_discussion_threads
      FOR INSERT
      TO authenticated
      WITH CHECK (
        author_id = auth.uid()
        AND is_gathering_member(gathering_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_discussion_threads'
      AND policyname = 'Threads: delete'
  ) THEN
    CREATE POLICY "Threads: delete"
      ON gathering_discussion_threads
      FOR DELETE
      TO authenticated
      USING (
        author_id = auth.uid()
        OR gathering_member_role(gathering_id) IN ('host', 'moderator')
      );
  END IF;


  -- gathering_discussion_replies

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_discussion_replies'
      AND policyname = 'Replies: select'
  ) THEN
    CREATE POLICY "Replies: select"
      ON gathering_discussion_replies
      FOR SELECT
      USING (
        can_see_gathering(
          (SELECT gathering_id FROM gathering_discussion_threads WHERE id = thread_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_discussion_replies'
      AND policyname = 'Replies: insert'
  ) THEN
    CREATE POLICY "Replies: insert"
      ON gathering_discussion_replies
      FOR INSERT
      TO authenticated
      WITH CHECK (
        author_id = auth.uid()
        AND is_gathering_member(
          (SELECT gathering_id FROM gathering_discussion_threads WHERE id = thread_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_discussion_replies'
      AND policyname = 'Replies: delete'
  ) THEN
    CREATE POLICY "Replies: delete"
      ON gathering_discussion_replies
      FOR DELETE
      TO authenticated
      USING (
        author_id = auth.uid()
        OR gathering_member_role(
          (SELECT gathering_id FROM gathering_discussion_threads WHERE id = thread_id)
        ) IN ('host', 'moderator')
      );
  END IF;


  -- gathering_prayer_requests

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_prayer_requests'
      AND policyname = 'Prayer: select'
  ) THEN
    CREATE POLICY "Prayer: select"
      ON gathering_prayer_requests
      FOR SELECT
      USING (can_see_gathering(gathering_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_prayer_requests'
      AND policyname = 'Prayer: insert'
  ) THEN
    CREATE POLICY "Prayer: insert"
      ON gathering_prayer_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (
        author_id = auth.uid()
        AND is_gathering_member(gathering_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_prayer_requests'
      AND policyname = 'Prayer: update'
  ) THEN
    CREATE POLICY "Prayer: update"
      ON gathering_prayer_requests
      FOR UPDATE
      TO authenticated
      USING (
        author_id = auth.uid()
        OR gathering_member_role(gathering_id) IN ('host', 'moderator')
      )
      WITH CHECK (
        author_id = auth.uid()
        OR gathering_member_role(gathering_id) IN ('host', 'moderator')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_prayer_requests'
      AND policyname = 'Prayer: delete'
  ) THEN
    CREATE POLICY "Prayer: delete"
      ON gathering_prayer_requests
      FOR DELETE
      TO authenticated
      USING (
        author_id = auth.uid()
        OR gathering_member_role(gathering_id) IN ('host', 'moderator')
      );
  END IF;


  -- gathering_prayer_acknowledgments

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_prayer_acknowledgments'
      AND policyname = 'Praying: select'
  ) THEN
    CREATE POLICY "Praying: select"
      ON gathering_prayer_acknowledgments
      FOR SELECT
      USING (
        can_see_gathering(
          (SELECT gathering_id FROM gathering_prayer_requests WHERE id = request_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_prayer_acknowledgments'
      AND policyname = 'Praying: insert'
  ) THEN
    CREATE POLICY "Praying: insert"
      ON gathering_prayer_acknowledgments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND is_gathering_member(
          (SELECT gathering_id FROM gathering_prayer_requests WHERE id = request_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_prayer_acknowledgments'
      AND policyname = 'Praying: delete'
  ) THEN
    CREATE POLICY "Praying: delete"
      ON gathering_prayer_acknowledgments
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;


  -- gathering_live_sessions

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_live_sessions'
      AND policyname = 'Sessions: select'
  ) THEN
    CREATE POLICY "Sessions: select"
      ON gathering_live_sessions
      FOR SELECT
      USING (can_see_gathering(gathering_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_live_sessions'
      AND policyname = 'Sessions: insert'
  ) THEN
    CREATE POLICY "Sessions: insert"
      ON gathering_live_sessions
      FOR INSERT
      TO authenticated
      WITH CHECK (gathering_member_role(gathering_id) IN ('host', 'moderator'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_live_sessions'
      AND policyname = 'Sessions: update'
  ) THEN
    CREATE POLICY "Sessions: update"
      ON gathering_live_sessions
      FOR UPDATE
      TO authenticated
      USING (gathering_member_role(gathering_id) IN ('host', 'moderator'))
      WITH CHECK (gathering_member_role(gathering_id) IN ('host', 'moderator'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'gathering_live_sessions'
      AND policyname = 'Sessions: delete'
  ) THEN
    CREATE POLICY "Sessions: delete"
      ON gathering_live_sessions
      FOR DELETE
      TO authenticated
      USING (gathering_member_role(gathering_id) IN ('host', 'moderator'));
  END IF;

END;
$$;
