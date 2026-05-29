-- ── 014: Governance — trust, account status, reports, moderation log ─────────
--
-- Three orthogonal state machines. They are separate. They do not share columns.
--
--   trust_state     — what a user can create (Gatherings)
--   account_status  — whether a user can access the platform at all
--   report_status   — where a single filed report is in its review lifecycle
--
-- Suspension / ban (account_status) is enforced by the application.
-- Supabase Auth will still issue valid JWTs for suspended users.
-- Enforcement must be implemented in middleware or server actions that check
-- profiles.account_status = 'active' before processing requests. The DB stores
-- the state; the app enforces it.
--
-- email_confirmed_at is read from auth.users, not from profiles.
-- The get_trust_eligibility() function queries auth.users directly.
-- Do not add email_confirmed_at to profiles — it would be a stale copy.
--
-- Assumes: auth.users, profiles, gatherings child tables (from 012_gatherings).


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE trust_state AS ENUM (
    'standard_user',       -- default on account creation; no creation rights
    'eligible_for_review', -- all signals pass; admin has not reviewed; no new capabilities
    'trusted_user'         -- admin reviewed and explicitly approved; can create Gatherings
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM (
    'active',     -- default; full access
    'suspended',  -- cannot access platform; content remains; reversible
    'banned'      -- permanent; content soft-deleted
    -- NOTE: 'suspended' and 'banned' block access only where app code enforces it.
    -- Supabase Auth still authenticates the user unless the app checks this field.
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_category AS ENUM (
    'harassment',
    'spam',
    'exploitation',
    'sexual_misconduct',
    'abuse_or_hate',
    'occult_or_harmful',
    'scam',
    'divisive_teaching',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM (
    'open',          -- submitted, unreviewed
    'under_review',  -- admin has opened it
    'resolved',      -- action taken (strike issued, content removed, etc.)
    'dismissed'      -- no action; closed
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mod_action_type AS ENUM (
    'content_hidden',
    'content_restored',
    'content_removed',
    'content_pinned',
    'content_unpinned',
    'member_removed_from_gathering',
    'member_restored_to_gathering',
    'strike_issued',
    'strike_removed',
    'account_suspended',
    'account_unsuspended',
    'account_banned',
    'trust_promoted',
    'trust_review_declined',  -- admin reviewed an eligible candidate and declined; distinct from trust_revoked
    'trust_revoked',          -- admin removed trust from an already-trusted user
    'report_status_changed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. PROFILES — new governance columns
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trust_state       trust_state    NOT NULL DEFAULT 'standard_user',
  ADD COLUMN IF NOT EXISTS account_status    account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_platform_admin boolean        NOT NULL DEFAULT false,

  -- Set when trust_state first becomes eligible_for_review.
  -- Cleared when eligibility is lost (new strike or new serious open report).
  -- NULL for standard_user and trusted_user.
  ADD COLUMN IF NOT EXISTS eligible_since      timestamptz,

  -- Set by admin when making the trust decision (approve or decline).
  ADD COLUMN IF NOT EXISTS trust_reviewed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS trust_reviewed_by   uuid REFERENCES auth.users(id),

  -- Required on decline. Optional on approve.
  ADD COLUMN IF NOT EXISTS trust_review_note   text;

CREATE INDEX IF NOT EXISTS profiles_trust_state_idx
  ON profiles (trust_state, eligible_since)
  WHERE trust_state = 'eligible_for_review';


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. USER_STRIKES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_strikes (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id),
  reason            text        NOT NULL,
  issued_by         uuid        NOT NULL REFERENCES auth.users(id),
  issued_at         timestamptz NOT NULL DEFAULT now(),
  -- Strikes expire after 60 days. Active strike = expires_at > now().
  expires_at        timestamptz NOT NULL,
  related_report_id uuid        -- set after content_reports exists; FK added below
);

ALTER TABLE user_strikes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_strikes_user_id_idx
  ON user_strikes (user_id, expires_at);


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. CONTENT_REPORTS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_reports (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id         uuid            NOT NULL REFERENCES auth.users(id),

  -- Exactly one content FK is non-null. The CHECK constraint enforces this.
  -- reported_user_id and gathering_id are derived from the content by
  -- file_content_report(). They are never supplied by the caller.
  thread_id           uuid            REFERENCES gathering_discussion_threads(id),
  reply_id            uuid            REFERENCES gathering_discussion_replies(id),
  prayer_request_id   uuid            REFERENCES gathering_prayer_requests(id),
  study_post_id       uuid            REFERENCES gathering_study_posts(id),

  -- Derived from the content at insert time. Never trusted from caller.
  gathering_id        uuid            REFERENCES gatherings(id),
  reported_user_id    uuid            NOT NULL REFERENCES auth.users(id),

  category            report_category NOT NULL,
  note                text,

  status              report_status   NOT NULL DEFAULT 'open',
  reviewed_by         uuid            REFERENCES auth.users(id),
  reviewed_at         timestamptz,
  -- Required on resolve or dismiss (enforced in resolve_report / dismiss_report).
  resolution_note     text,

  created_at          timestamptz     NOT NULL DEFAULT now(),

  CONSTRAINT exactly_one_content_target CHECK (
    (CASE WHEN thread_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN reply_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN prayer_request_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN study_post_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

-- Duplicate-report protection using partial unique indexes.
--
-- Why partial indexes, not a composite unique constraint:
-- PostgreSQL treats NULL as distinct in unique constraints, so a standard
-- multi-column constraint over (reporter_id, thread_id, reply_id, ...) would
-- allow multiple reports from the same reporter on the same content as long as
-- one of the nullable columns is NULL. Partial indexes constrain each content
-- type independently and only cover rows where status is still active.
--
-- Policy: block duplicate reports from the same reporter on the same content
-- while any previous report is still open or under_review. After resolution or
-- dismissal, re-reporting is allowed.

CREATE UNIQUE INDEX IF NOT EXISTS content_reports_no_dup_thread
  ON content_reports (reporter_id, thread_id)
  WHERE thread_id IS NOT NULL AND status IN ('open', 'under_review');

CREATE UNIQUE INDEX IF NOT EXISTS content_reports_no_dup_reply
  ON content_reports (reporter_id, reply_id)
  WHERE reply_id IS NOT NULL AND status IN ('open', 'under_review');

CREATE UNIQUE INDEX IF NOT EXISTS content_reports_no_dup_prayer_request
  ON content_reports (reporter_id, prayer_request_id)
  WHERE prayer_request_id IS NOT NULL AND status IN ('open', 'under_review');

CREATE UNIQUE INDEX IF NOT EXISTS content_reports_no_dup_study_post
  ON content_reports (reporter_id, study_post_id)
  WHERE study_post_id IS NOT NULL AND status IN ('open', 'under_review');

CREATE INDEX IF NOT EXISTS content_reports_status_idx
  ON content_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS content_reports_reported_user_idx
  ON content_reports (reported_user_id, status);

CREATE INDEX IF NOT EXISTS content_reports_gathering_idx
  ON content_reports (gathering_id, status);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- FK from user_strikes back to content_reports (added here, after both tables exist)
ALTER TABLE user_strikes
  ADD CONSTRAINT IF NOT EXISTS user_strikes_related_report_fk
  FOREIGN KEY (related_report_id) REFERENCES content_reports(id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. MODERATION_LOG
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS moderation_log (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type         mod_action_type NOT NULL,
  actor_id            uuid            NOT NULL REFERENCES auth.users(id),
  target_user_id      uuid            REFERENCES auth.users(id),
  -- 'thread' | 'reply' | 'prayer_request' | 'study_post'
  target_content_type text,
  target_content_id   uuid,
  gathering_id        uuid            REFERENCES gatherings(id),
  related_report_id   uuid            REFERENCES content_reports(id),
  note                text,
  created_at          timestamptz     NOT NULL DEFAULT now()
);

-- Append-only. No UPDATE or DELETE by anyone.
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS moderation_log_actor_idx
  ON moderation_log (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_log_target_user_idx
  ON moderation_log (target_user_id, created_at DESC);


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. RLS POLICIES
-- ══════════════════════════════════════════════════════════════════════════════

-- profiles: is_platform_admin is only readable by the row owner
-- (existing SELECT policy covers this; trust/status columns follow same rule)

-- user_strikes: users see their own; no direct write
DROP POLICY IF EXISTS "users_read_own_strikes" ON user_strikes;
CREATE POLICY "users_read_own_strikes" ON user_strikes
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT / UPDATE / DELETE: SECURITY DEFINER functions only (no direct policy)

-- content_reports: reporters see their own filed reports; no direct INSERT
DROP POLICY IF EXISTS "reporters_read_own_reports" ON content_reports;
CREATE POLICY "reporters_read_own_reports" ON content_reports
  FOR SELECT USING (auth.uid() = reporter_id);
-- INSERT: no direct insert policy; all inserts go through file_content_report()
-- UPDATE: no direct update policy; status changes go through resolve/dismiss functions

-- moderation_log: no access for regular users; admin reads via service role
-- (no SELECT policy = deny all; service role bypasses RLS)


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. SECURITY DEFINER FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 7a. get_trust_eligibility ────────────────────────────────────────────────
--
-- Returns every signal evaluated individually as jsonb.
-- email_confirmed_at is read from auth.users, not from profiles.
-- This function is SECURITY DEFINER so it can access auth.users.
-- There is no weighted score. All signals must pass simultaneously.

CREATE OR REPLACE FUNCTION get_trust_eligibility(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  p                     record;
  v_email_confirmed_at  timestamptz;
  v_account_age_days    integer;
  v_gathering_count     integer;
  v_interaction_count   integer;
  v_active_strikes      integer;
  v_open_serious_reports integer;
  v_all_pass            boolean;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'user not found');
  END IF;

  -- Read email_confirmed_at from auth.users directly.
  -- Do not use profiles for this field — it would be a stale copy.
  SELECT email_confirmed_at INTO v_email_confirmed_at
    FROM auth.users WHERE id = uid;

  v_account_age_days := EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400;

  SELECT COUNT(*) INTO v_gathering_count
    FROM public.gathering_members WHERE user_id = uid;

  -- Threads + substantive replies (≥ 20 chars) + prayer requests.
  -- Prayer acknowledgments are excluded from trust interactions at MVP.
  SELECT
    (SELECT COUNT(*) FROM public.gathering_discussion_threads WHERE author_id = uid)
    + (SELECT COUNT(*) FROM public.gathering_discussion_replies
       WHERE author_id = uid AND length(body) >= 20)
    + (SELECT COUNT(*) FROM public.gathering_prayer_requests WHERE author_id = uid)
  INTO v_interaction_count;

  SELECT COUNT(*) INTO v_active_strikes
    FROM public.user_strikes WHERE user_id = uid AND expires_at > now();

  SELECT COUNT(*) INTO v_open_serious_reports
    FROM public.content_reports
    WHERE reported_user_id = uid
      AND status IN ('open', 'under_review')
      AND category IN (
        'harassment', 'exploitation', 'sexual_misconduct',
        'scam', 'abuse_or_hate'
      );

  v_all_pass := (
    v_account_age_days >= 14
    AND v_email_confirmed_at IS NOT NULL
    AND p.display_name IS NOT NULL AND length(trim(p.display_name)) > 0
    AND v_gathering_count >= 1
    AND v_interaction_count >= 5
    AND v_active_strikes = 0
    AND v_open_serious_reports = 0
    AND p.account_status = 'active'
  );

  RETURN jsonb_build_object(
    'user_id',          uid,
    'trust_state',      p.trust_state,
    'account_status',   p.account_status,
    'all_signals_pass', v_all_pass,
    'signals', jsonb_build_object(
      'account_age_days',          v_account_age_days,
      'account_age_ok',            (v_account_age_days >= 14),
      'email_verified',            (v_email_confirmed_at IS NOT NULL),
      'display_name_set',          (p.display_name IS NOT NULL AND length(trim(p.display_name)) > 0),
      'gathering_count',           v_gathering_count,
      'gathering_participation_ok',(v_gathering_count >= 1),
      'interaction_count',         v_interaction_count,
      'interaction_count_ok',      (v_interaction_count >= 5),
      'active_strikes',            v_active_strikes,
      'no_active_strikes',         (v_active_strikes = 0),
      'open_serious_reports',      v_open_serious_reports,
      'no_open_serious_reports',   (v_open_serious_reports = 0),
      'account_active',            (p.account_status = 'active')
    )
  );
END;
$$;


-- ── 7b. refresh_eligible_users ───────────────────────────────────────────────
--
-- Transitions users between standard_user ↔ eligible_for_review.
-- Never touches trusted_user — only explicit admin action changes that state.
-- Called manually by admin before reviewing the queue. Not a cron job at MVP.
-- Returns the number of users moved to eligible_for_review.

CREATE OR REPLACE FUNCTION refresh_eligible_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_newly_eligible integer := 0;
BEGIN
  -- standard_user → eligible_for_review
  -- All signals must pass. email_confirmed_at from auth.users.
  UPDATE public.profiles SET
    trust_state    = 'eligible_for_review',
    eligible_since = COALESCE(eligible_since, now())
  WHERE
    trust_state    = 'standard_user'
    AND account_status = 'active'
    AND display_name IS NOT NULL AND length(trim(display_name)) > 0
    AND (EXTRACT(EPOCH FROM (now() - created_at)) / 86400) >= 14
    AND id IN (SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL)
    AND id IN (
      SELECT user_id FROM public.gathering_members
      GROUP BY user_id HAVING COUNT(*) >= 1
    )
    AND id IN (
      SELECT author_id FROM (
        SELECT author_id FROM public.gathering_discussion_threads
        UNION ALL
        SELECT author_id FROM public.gathering_discussion_replies
          WHERE length(body) >= 20
        UNION ALL
        SELECT author_id FROM public.gathering_prayer_requests
      ) sub
      GROUP BY author_id HAVING COUNT(*) >= 5
    )
    AND id NOT IN (
      SELECT user_id FROM public.user_strikes WHERE expires_at > now()
    )
    AND id NOT IN (
      SELECT reported_user_id FROM public.content_reports
      WHERE status IN ('open', 'under_review')
        AND category IN (
          'harassment', 'exploitation', 'sexual_misconduct',
          'scam', 'abuse_or_hate'
        )
    );

  GET DIAGNOSTICS v_newly_eligible = ROW_COUNT;

  -- eligible_for_review → standard_user (lost eligibility)
  -- Triggers: new active strike, or new open serious report, or account no longer active
  UPDATE public.profiles SET
    trust_state    = 'standard_user',
    eligible_since = NULL
  WHERE
    trust_state = 'eligible_for_review'
    AND (
      account_status != 'active'
      OR id IN (SELECT user_id FROM public.user_strikes WHERE expires_at > now())
      OR id IN (
        SELECT reported_user_id FROM public.content_reports
        WHERE status IN ('open', 'under_review')
          AND category IN (
            'harassment', 'exploitation', 'sexual_misconduct',
            'scam', 'abuse_or_hate'
          )
      )
    );

  RETURN v_newly_eligible;
END;
$$;


-- ── 7c. approve_trust_user ───────────────────────────────────────────────────
--
-- Admin approves an eligible_for_review candidate.
-- Writes trust_promoted to moderation_log.
-- Note is optional on approve.

CREATE OR REPLACE FUNCTION approve_trust_user(
  uid      uuid,
  admin_id uuid,
  note     text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET
    trust_state       = 'trusted_user',
    trust_reviewed_at = now(),
    trust_reviewed_by = admin_id,
    trust_review_note = note
  WHERE id = uid AND trust_state = 'eligible_for_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % is not in eligible_for_review state', uid;
  END IF;

  INSERT INTO public.moderation_log (action_type, actor_id, target_user_id, note)
  VALUES ('trust_promoted', admin_id, uid, note);
END;
$$;


-- ── 7d. decline_trust_user ───────────────────────────────────────────────────
--
-- Admin declines an eligible_for_review candidate.
-- Writes trust_review_declined to moderation_log — NOT trust_revoked.
-- trust_revoked is reserved for removing trust from an already-trusted user.
-- Note is required on decline.
-- Declined user returns to standard_user. eligible_since is cleared.
-- They may re-enter the pool by continued participation.

CREATE OR REPLACE FUNCTION decline_trust_user(
  uid      uuid,
  admin_id uuid,
  note     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF note IS NULL OR length(trim(note)) = 0 THEN
    RAISE EXCEPTION 'A note is required when declining a trust review';
  END IF;

  UPDATE public.profiles SET
    trust_state       = 'standard_user',
    eligible_since    = NULL,
    trust_reviewed_at = now(),
    trust_reviewed_by = admin_id,
    trust_review_note = note
  WHERE id = uid AND trust_state = 'eligible_for_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % is not in eligible_for_review state', uid;
  END IF;

  -- trust_review_declined ≠ trust_revoked.
  -- This event records a review decision, not the removal of an active trust grant.
  INSERT INTO public.moderation_log (action_type, actor_id, target_user_id, note)
  VALUES ('trust_review_declined', admin_id, uid, note);
END;
$$;


-- ── 7e. file_content_report ──────────────────────────────────────────────────
--
-- The only permitted path for inserting a content_reports row.
-- reported_user_id and gathering_id are derived from the content.
-- They are never accepted from the caller — this prevents spoofing.
-- Returns the new report id.
--
-- Duplicate protection: the partial unique indexes prevent a second report
-- from the same reporter on the same content while status is open or
-- under_review. After resolution or dismissal, re-reporting is allowed.

CREATE OR REPLACE FUNCTION file_content_report(
  p_content_type text,             -- 'thread' | 'reply' | 'prayer_request' | 'study_post'
  p_content_id   uuid,
  p_category     report_category,
  p_note         text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reporter_id       uuid := auth.uid();
  v_reported_user_id  uuid;
  v_gathering_id      uuid;
  v_thread_id         uuid;
  v_reply_id          uuid;
  v_prayer_request_id uuid;
  v_study_post_id     uuid;
  v_report_id         uuid;
BEGIN
  IF v_reporter_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Derive author and gathering from content. Never trust caller-supplied values.
  IF p_content_type = 'thread' THEN
    SELECT author_id, gathering_id
      INTO v_reported_user_id, v_gathering_id
      FROM public.gathering_discussion_threads
      WHERE id = p_content_id;
    v_thread_id := p_content_id;

  ELSIF p_content_type = 'reply' THEN
    SELECT r.author_id, t.gathering_id
      INTO v_reported_user_id, v_gathering_id
      FROM public.gathering_discussion_replies r
      JOIN public.gathering_discussion_threads t ON t.id = r.thread_id
      WHERE r.id = p_content_id;
    v_reply_id := p_content_id;

  ELSIF p_content_type = 'prayer_request' THEN
    SELECT author_id, gathering_id
      INTO v_reported_user_id, v_gathering_id
      FROM public.gathering_prayer_requests
      WHERE id = p_content_id;
    v_prayer_request_id := p_content_id;

  ELSIF p_content_type = 'study_post' THEN
    SELECT author_id, gathering_id
      INTO v_reported_user_id, v_gathering_id
      FROM public.gathering_study_posts
      WHERE id = p_content_id;
    v_study_post_id := p_content_id;

  ELSE
    RAISE EXCEPTION 'Invalid content_type: %', p_content_type;
  END IF;

  IF v_reported_user_id IS NULL THEN
    RAISE EXCEPTION 'Content not found';
  END IF;

  IF v_reported_user_id = v_reporter_id THEN
    RAISE EXCEPTION 'Cannot report your own content';
  END IF;

  INSERT INTO public.content_reports (
    reporter_id, reported_user_id, gathering_id,
    thread_id, reply_id, prayer_request_id, study_post_id,
    category, note, status
  ) VALUES (
    v_reporter_id, v_reported_user_id, v_gathering_id,
    v_thread_id, v_reply_id, v_prayer_request_id, v_study_post_id,
    p_category, p_note, 'open'
  )
  RETURNING id INTO v_report_id;

  RETURN v_report_id;
END;
$$;


-- ── 7f. set_report_under_review ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_report_under_review(
  p_report_id uuid,
  p_admin_id  uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.content_reports SET
    status      = 'under_review',
    reviewed_by = p_admin_id,
    reviewed_at = now()
  WHERE id = p_report_id AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report % is not in open state', p_report_id;
  END IF;

  INSERT INTO public.moderation_log (action_type, actor_id, related_report_id, note)
  VALUES ('report_status_changed', p_admin_id, p_report_id, 'under_review');
END;
$$;


-- ── 7g. resolve_report ───────────────────────────────────────────────────────
--
-- Action was taken (strike issued, content removed, etc.).
-- Note is required.

CREATE OR REPLACE FUNCTION resolve_report(
  p_report_id uuid,
  p_admin_id  uuid,
  p_note      text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_note IS NULL OR length(trim(p_note)) = 0 THEN
    RAISE EXCEPTION 'A note is required when resolving a report';
  END IF;

  UPDATE public.content_reports SET
    status          = 'resolved',
    reviewed_by     = p_admin_id,
    reviewed_at     = now(),
    resolution_note = p_note
  WHERE id = p_report_id AND status IN ('open', 'under_review');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report % is not in open or under_review state', p_report_id;
  END IF;

  INSERT INTO public.moderation_log (action_type, actor_id, related_report_id, note)
  VALUES ('report_status_changed', p_admin_id, p_report_id, 'resolved: ' || p_note);
END;
$$;


-- ── 7h. dismiss_report ───────────────────────────────────────────────────────
--
-- No action taken. Note is required.
-- After dismissal, re-reporting by the same reporter is permitted (partial
-- unique indexes only cover open/under_review rows).

CREATE OR REPLACE FUNCTION dismiss_report(
  p_report_id uuid,
  p_admin_id  uuid,
  p_note      text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_note IS NULL OR length(trim(p_note)) = 0 THEN
    RAISE EXCEPTION 'A note is required when dismissing a report';
  END IF;

  UPDATE public.content_reports SET
    status          = 'dismissed',
    reviewed_by     = p_admin_id,
    reviewed_at     = now(),
    resolution_note = p_note
  WHERE id = p_report_id AND status IN ('open', 'under_review');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report % is not in open or under_review state', p_report_id;
  END IF;

  INSERT INTO public.moderation_log (action_type, actor_id, related_report_id, note)
  VALUES ('report_status_changed', p_admin_id, p_report_id, 'dismissed: ' || p_note);
END;
$$;
