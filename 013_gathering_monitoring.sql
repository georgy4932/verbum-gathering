-- ── Gathering events audit log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gathering_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   text        NOT NULL,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  gathering_id uuid        REFERENCES gatherings(id) ON DELETE SET NULL,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gathering_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users may INSERT their own events
CREATE POLICY "auth_users_insert_own_events" ON gathering_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No SELECT for regular users — read via service role / admin SQL only
-- (Add host analytics SELECT policy when building the dashboard)

CREATE INDEX IF NOT EXISTS gathering_events_gathering_id_idx
  ON gathering_events (gathering_id, created_at DESC);

CREATE INDEX IF NOT EXISTS gathering_events_event_type_idx
  ON gathering_events (event_type, created_at DESC);

-- ── Feature flags for staged rollout ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  user_id    uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag       text  NOT NULL,
  enabled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, flag)
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Users can read their own flags (needed client-side / in server actions)
CREATE POLICY "users_read_own_flags" ON feature_flags
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role / postgres can grant or revoke flags
-- Grant a flag: INSERT INTO feature_flags (user_id, flag) VALUES ('<uuid>', 'gatherings_create');
-- Revoke a flag: DELETE FROM feature_flags WHERE user_id = '<uuid>' AND flag = 'gatherings_create';
