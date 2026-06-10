-- ================================================================
-- 018 — Companion → Gathering: publish-ready columns (Phase 1)
--
-- Phase 1 of the Companion → Gathering refactor (Copy → Publish
-- sharing model: shared content is a snapshot, never a live
-- reference back to a private Companion item). Additive schema
-- only — no UI, RLS, or behavior changes in this phase. Existing
-- rows are unaffected.
--
-- Scope decisions (reviewed):
--
-- 1. No `visibility` column. Gathering content is always
--    group-scoped via the existing `gathering_id` + RLS
--    (is_gathering_member / can_see_gathering). Private content
--    belongs in Companion, not Gathering. A narrower "host-only"
--    visibility, if ever needed, should be designed later with its
--    own RLS review — not bundled here.
--
-- 2. publication_state supports only 'shared' | 'archived'.
--    'draft' belongs to the Companion-side private creation flow —
--    a row simply does not exist in the Gathering table until it
--    is published (= 'shared'). 'removed' is deferred: author
--    withdrawal vs. moderator suppression are different operations
--    that may need different states/audit trails, and should be
--    designed once those semantics are explicit (see
--    docs/governance-and-moderation.md, content_reports,
--    moderation_log).
--
-- 3. companion_notes.kind ('note' | 'prayer') — MVP COMPROMISE.
--    This unifies note and prayer storage temporarily for minimal
--    change; revisit if prayer acquires a distinct lifecycle,
--    reminders, answered-state, confidentiality flags, or pastoral
--    escalation.
--
-- 4. Scripture attachment fields (passage_start, passage_end,
--    translation_version, scripture_text_snapshot) are added to
--    BOTH gathering_discussion_threads and gathering_prayer_requests.
--    No reusable "scripture attachment" structure exists elsewhere,
--    so this is pragmatic duplication for MVP, not a final content
--    model — a shared scripture_attachments table may be worth
--    extracting later if a third Gathering content type needs the
--    same shape.
--
--    The "reference" half of the attachment reuses the existing
--    `passage_ref` convention already used by gatherings,
--    gathering_study_posts, gathering_discussion_threads, and
--    gathering_live_sessions — no new `scripture_reference` column
--    is introduced. gathering_prayer_requests gains `passage_ref`
--    for the same purpose; it did not previously have one.
--
-- 5. Every row in scope keeps gathering_id NOT NULL (unchanged).
--    No standalone, public, or cross-group Gathering content is
--    introduced in MVP.
--
-- source_context records WHERE a published item's scripture
-- attachment originated from, set by the future publish flow
-- (Phase 3+). Nullable — existing rows, and anything inserted
-- before that flow exists, simply have no provenance recorded.
-- ================================================================


-- ── 1. Companion: prayer points as a kind of companion_notes ──────

ALTER TABLE public.companion_notes
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'note';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_companion_notes_kind'
  ) THEN
    ALTER TABLE public.companion_notes
      ADD CONSTRAINT chk_companion_notes_kind CHECK (kind IN ('note', 'prayer'));
  END IF;
END $$;


-- ── 2. gathering_discussion_threads: scripture attachment + state ─

ALTER TABLE public.gathering_discussion_threads
  ADD COLUMN IF NOT EXISTS passage_start           text,
  ADD COLUMN IF NOT EXISTS passage_end             text,
  ADD COLUMN IF NOT EXISTS translation_version     text,
  ADD COLUMN IF NOT EXISTS scripture_text_snapshot text,
  ADD COLUMN IF NOT EXISTS source_context          text,
  ADD COLUMN IF NOT EXISTS publication_state       text NOT NULL DEFAULT 'shared';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_discussion_threads_source_context'
  ) THEN
    ALTER TABLE public.gathering_discussion_threads
      ADD CONSTRAINT chk_discussion_threads_source_context
        CHECK (source_context IS NULL OR source_context IN
          ('companion_highlight', 'companion_note', 'companion_prayer', 'manual'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_discussion_threads_publication_state'
  ) THEN
    ALTER TABLE public.gathering_discussion_threads
      ADD CONSTRAINT chk_discussion_threads_publication_state
        CHECK (publication_state IN ('shared', 'archived'));
  END IF;
END $$;


-- ── 3. gathering_prayer_requests: scripture attachment + state ────

ALTER TABLE public.gathering_prayer_requests
  ADD COLUMN IF NOT EXISTS passage_ref             text,
  ADD COLUMN IF NOT EXISTS passage_start           text,
  ADD COLUMN IF NOT EXISTS passage_end             text,
  ADD COLUMN IF NOT EXISTS translation_version     text,
  ADD COLUMN IF NOT EXISTS scripture_text_snapshot text,
  ADD COLUMN IF NOT EXISTS source_context          text,
  ADD COLUMN IF NOT EXISTS publication_state       text NOT NULL DEFAULT 'shared';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_prayer_requests_source_context'
  ) THEN
    ALTER TABLE public.gathering_prayer_requests
      ADD CONSTRAINT chk_prayer_requests_source_context
        CHECK (source_context IS NULL OR source_context IN
          ('companion_highlight', 'companion_note', 'companion_prayer', 'manual'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_prayer_requests_publication_state'
  ) THEN
    ALTER TABLE public.gathering_prayer_requests
      ADD CONSTRAINT chk_prayer_requests_publication_state
        CHECK (publication_state IN ('shared', 'archived'));
  END IF;
END $$;
