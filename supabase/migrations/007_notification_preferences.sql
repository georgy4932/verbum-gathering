-- ── 007: User notification preferences ──────────────────────────────────────
-- One row per user (UNIQUE on user_id).  Stores a daily reminder time and
-- the user's IANA timezone so the in-app nudge can fire at the right moment.
-- Architecture is web-first but the schema is ready for a future push_subscription
-- column when mobile notifications are added.

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  reminders_enabled BOOLEAN     NOT NULL DEFAULT false,
  reminder_time     TIME        NOT NULL DEFAULT '08:00',
  timezone          TEXT        NOT NULL DEFAULT 'UTC',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at
  ON user_notification_preferences;

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_notification_preferences_updated_at();

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_notification_preferences'
      AND policyname = 'Notification prefs: select own'
  ) THEN
    CREATE POLICY "Notification prefs: select own"
      ON user_notification_preferences FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_notification_preferences'
      AND policyname = 'Notification prefs: insert own'
  ) THEN
    CREATE POLICY "Notification prefs: insert own"
      ON user_notification_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_notification_preferences'
      AND policyname = 'Notification prefs: update own'
  ) THEN
    CREATE POLICY "Notification prefs: update own"
      ON user_notification_preferences FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_notification_preferences'
      AND policyname = 'Notification prefs: delete own'
  ) THEN
    CREATE POLICY "Notification prefs: delete own"
      ON user_notification_preferences FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END;
$$;
