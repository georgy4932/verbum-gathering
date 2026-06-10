-- ── 019: Lock self-join role to 'member' ──────────────────────────────────
--
-- "Members: self-join" (012_gatherings.sql) let any authenticated user
-- insert their own gathering_members row for a public/community gathering,
-- but did not constrain the `role` value. The app's joinGathering() always
-- sends role='member', but RLS alone permitted a direct insert with
-- role='moderator' or role='host' for a public/community gathering —
-- privilege escalation via direct REST/DB access, bypassing the app.
--
-- Fix: self-join may only create role='member' rows. Host/moderator
-- assignment must go through "Members: host-add" (unchanged).

DROP POLICY IF EXISTS "Members: self-join" ON gathering_members;

CREATE POLICY "Members: self-join"
  ON gathering_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND EXISTS (
      SELECT 1
      FROM gatherings g
      WHERE g.id        = gathering_id
        AND g.is_active = true
        AND g.visibility IN ('public', 'community')
    )
  );
