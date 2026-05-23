-- ══════════════════════════════════════════════════════════════════════
-- Migration 003 — Auth Upgrade
-- Extends profiles, adds new-user trigger, username constraint,
-- storage bucket + RLS for avatars, updated RLS on profiles.
-- Additive + idempotent.
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Extend profiles ───────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS username     TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS is_public    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

-- Unique username index (partial — NULL values are excluded so multiple
-- rows can have NULL username).
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
  ON profiles(username) WHERE username IS NOT NULL;

-- Username format: 3-20 chars, lowercase alphanumeric + _ -
-- Drop first in case it existed with a different definition.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS username_format;
ALTER TABLE profiles
  ADD CONSTRAINT username_format
  CHECK (username IS NULL OR username ~ '^[a-z0-9_-]{3,20}$');

-- ── 2. updated_at trigger ────────────────────────────────────────────

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
-- Runs for both email/password sign-ups and OAuth (Google etc.).
-- Google metadata arrives in raw_user_meta_data under 'full_name' or 'name'.
-- On conflict (user already has a row) just refresh email.

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
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULL
  );

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, _name)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 4. RLS on profiles ───────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies so we start clean
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"             ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable"                 ON profiles;
DROP POLICY IF EXISTS "Users update own profile"                 ON profiles;
DROP POLICY IF EXISTS "Users insert own profile"                 ON profiles;
DROP POLICY IF EXISTS "Profiles viewable"                        ON profiles;

-- Own row always visible; public rows visible to anyone
CREATE POLICY "Profiles viewable" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_public = TRUE);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── 5. Avatar storage bucket ─────────────────────────────────────────
-- Public bucket (URLs are guessable but that is fine for MVP).
-- 5 MB limit, image MIME types only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public              = TRUE,
      file_size_limit     = 5242880,
      allowed_mime_types  = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS — drop before re-creating to keep idempotent
DROP POLICY IF EXISTS "Avatars public read"       ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload own folder"  ON storage.objects;
DROP POLICY IF EXISTS "Avatar update own folder"  ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete own folder"  ON storage.objects;

CREATE POLICY "Avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar upload own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatar update own folder" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatar delete own folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
