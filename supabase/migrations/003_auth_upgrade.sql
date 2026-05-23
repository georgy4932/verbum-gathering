-- ══════════════════════════════════════════════════════════════════════
-- Migration 003 — Auth Upgrade
-- Extends profiles, adds new-user trigger, username constraint,
-- storage bucket + RLS for avatars, updated RLS on profiles.
-- Additive + idempotent.
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Extend profiles ───────────────────────────────────────────────
-- display_name and bio already exist on this table in most deployments;
-- ADD COLUMN IF NOT EXISTS is safe to run regardless.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio          TEXT,
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS username     TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS is_public    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

-- Unique username index (partial — NULL values are excluded so multiple
-- rows can have NULL username without violating uniqueness).
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
  ON profiles(username) WHERE username IS NOT NULL;

-- Username format: 3-20 chars, lowercase alphanumeric + _ -
-- Drop first in case an earlier version existed with a different definition.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS username_format;
ALTER TABLE profiles
  ADD CONSTRAINT username_format
  CHECK (username IS NULL OR username ~ '^[a-z0-9_-]{3,20}$');

-- ── 2. updated_at auto-stamp ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 3. Auto-create profile on new auth.users row ─────────────────────
-- Fires for email/password sign-ups and OAuth (Google etc.).
--
-- display_name resolution order:
--   1. raw_user_meta_data->>'display_name'  — set explicitly by the signup
--      form via supabase.auth.signUp({ options: { data: { display_name } } })
--   2. raw_user_meta_data->>'full_name'     — populated by Google OAuth
--   3. raw_user_meta_data->>'name'          — fallback Google/other OAuth field
--   4. NULL                                 — user must complete in onboarding
--
-- On conflict (row already exists) the email is refreshed but display_name
-- is NOT overwritten — preserving any name the user already set.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name TEXT;
BEGIN
  _name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'),    ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'),         ''),
    NULL
  );

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, _name)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    -- display_name intentionally NOT overwritten on conflict:
    -- the user may have already customised it.

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 4. Keep profiles.email in sync when auth email changes ───────────
-- Supabase updates auth.users.email after the user confirms an email
-- change. Without this trigger the profiles row would drift out of sync.
-- For MVP this is sufficient — no cascade to application data needed.

CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET    email = NEW.email
    WHERE  id    = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

-- ── 5. RLS on profiles ───────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies to start clean (idempotent).
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"             ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable"                 ON profiles;
DROP POLICY IF EXISTS "Users update own profile"                 ON profiles;
DROP POLICY IF EXISTS "Users insert own profile"                 ON profiles;
DROP POLICY IF EXISTS "Profiles viewable"                        ON profiles;

-- Own row always readable; public rows readable by anyone (including anon).
CREATE POLICY "Profiles viewable" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_public = TRUE);

-- Only the authenticated owner may update their own row.
-- USING checks the existing row before the update is applied;
-- WITH CHECK validates the row after — prevents a user from
-- updating id or any other column to impersonate another user.
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── 6. Avatar storage bucket ─────────────────────────────────────────
-- Public bucket — avatar URLs are intentionally guessable (MVP).
-- File size: 5 MB. Accepted MIME types: common image formats only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public             = TRUE,
      file_size_limit    = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage object RLS — drop before re-creating (idempotent).
DROP POLICY IF EXISTS "Avatars public read"      ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete own folder" ON storage.objects;

-- Anyone (including anon) can read avatar objects.
CREATE POLICY "Avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users may only write inside their own /{user_id}/... path.
-- The TO authenticated clause prevents the policy from even being evaluated
-- for anonymous requests, giving defence-in-depth alongside the uid check.

CREATE POLICY "Avatar upload own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatar update own folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatar delete own folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
