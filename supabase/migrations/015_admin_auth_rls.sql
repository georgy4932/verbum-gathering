-- ── 015: Admin auth boundary — RLS and route protection ──────────────────────
--
-- Problem: the existing profiles UPDATE policy allows authenticated users to
-- write any column on their own row, including is_platform_admin, trust_state,
-- and account_status. This must be closed before any admin UI exists.
--
-- Fix: replace the UPDATE policy with one whose WITH CHECK prevents mutation of
-- governance columns. Service role bypasses RLS and can still set these columns
-- via the Supabase dashboard or SECURITY DEFINER functions.
--
-- is_platform_admin: set only by the database owner via dashboard.
--   Never set by application code.
-- trust_state: set only by approve_trust_user() and decline_trust_user().
-- account_status: set only by admin action (functions TBD; for now: dashboard).

DROP POLICY IF EXISTS "Users update own profile" ON profiles;

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent client code from elevating is_platform_admin
    AND is_platform_admin = (
      SELECT p.is_platform_admin FROM profiles p WHERE p.id = auth.uid()
    )
    -- Prevent client code from self-promoting trust_state
    AND trust_state = (
      SELECT p.trust_state FROM profiles p WHERE p.id = auth.uid()
    )
    -- Prevent client code from self-modifying account_status
    AND account_status = (
      SELECT p.account_status FROM profiles p WHERE p.id = auth.uid()
    )
  );
