-- ── 011: Fellowship messages — canonical standalone migration ─────────────────
-- fellowship_messages existed in production before being formally migrated.
-- All statements are idempotent — safe to apply on any environment.
--
-- Design decisions:
--   room_slug     — text FK to fellowship_rooms.slug (denormalised intentionally;
--                   rooms are seeded/stable and slugs never change post-launch).
--   user_id       — nullable so messages survive account deletion (SET NULL).
--                   Application layer enforces auth before INSERT.
--   author_name   — display name snapshot at post time; preserved if account deleted.
--   message       — 1–500 chars at DB level. Client enforces 280 for calm brevity.
--   deleted_at    — soft-delete column for moderation. NULL = visible.
--                   Admin uses Supabase dashboard to set this; no heavy UI yet.
--
-- RLS summary:
--   SELECT  — public (anon + authenticated), only non-deleted rows.
--   INSERT  — authenticated only; user_id must match auth.uid().
--   DELETE  — own messages only (lets users remove their own posts).
--   UPDATE  — intentionally omitted for MVP.
--
-- Assumes: auth.users, fellowship_rooms (pre-existing Verbum Gathering tables).

-- ── 1. Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fellowship_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_slug   text        NOT NULL,
  user_id     uuid        REFERENCES auth.users ON DELETE SET NULL,
  author_name text        NOT NULL,
  message     text        NOT NULL,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_fellowship_message_len
    CHECK (char_length(btrim(message)) BETWEEN 1 AND 500),

  CONSTRAINT chk_fellowship_author_name_len
    CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 80)
);

-- ── 2. Additive columns — safe no-ops on existing tables ─────────────────────

ALTER TABLE fellowship_messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── 3. Constraints — idempotent ───────────────────────────────────────────────

DO $$
BEGIN
  ALTER TABLE fellowship_messages
    ADD CONSTRAINT chk_fellowship_message_len
      CHECK (char_length(btrim(message)) BETWEEN 1 AND 500);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE fellowship_messages
    ADD CONSTRAINT chk_fellowship_author_name_len
      CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 80);
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- ── 4. Indexes ────────────────────────────────────────────────────────────────

-- Primary read pattern: recent messages for a room, non-deleted only.
CREATE INDEX IF NOT EXISTS idx_fellowship_messages_room
  ON fellowship_messages (room_slug, created_at DESC)
  WHERE deleted_at IS NULL;

-- Moderation: find all messages by a given user.
CREATE INDEX IF NOT EXISTS idx_fellowship_messages_user
  ON fellowship_messages (user_id)
  WHERE user_id IS NOT NULL;

-- ── 5. Row-level security ─────────────────────────────────────────────────────

ALTER TABLE fellowship_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Public read: anon and authenticated users see non-deleted messages.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'fellowship_messages'
      AND policyname = 'Messages: public read'
  ) THEN
    CREATE POLICY "Messages: public read"
      ON fellowship_messages
      FOR SELECT
      USING (deleted_at IS NULL);
  END IF;

  -- Authenticated insert: user must supply their own user_id.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'fellowship_messages'
      AND policyname = 'Messages: insert own'
  ) THEN
    CREATE POLICY "Messages: insert own"
      ON fellowship_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Self-removal: authenticated users may hard-delete their own messages.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'fellowship_messages'
      AND policyname = 'Messages: delete own'
  ) THEN
    CREATE POLICY "Messages: delete own"
      ON fellowship_messages
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END;
$$;
