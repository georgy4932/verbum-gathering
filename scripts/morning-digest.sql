-- ================================================================
-- MORNING STEWARD DIGEST
-- Run once per day in the Supabase SQL editor.
-- Review sections in order: top to bottom.
-- ================================================================
--
-- SCHEMA NOTE on prayer request acknowledgment:
--   The current schema has no written-reply mechanism for prayer
--   requests. The only engagement signal is praying_count (tap).
--   Per ADR-004, a tap alone is not meaningful acknowledgment.
--   Every prayer request in Section 1 requires human review,
--   regardless of praying_count.
--
-- Run each section separately or all at once.
-- The Supabase SQL editor returns each SELECT as its own result.
-- ================================================================


-- ── SECTION 1: NEEDS RESPONSE ───────────────────────────────────
-- Prayer requests older than 24h.
-- Sorted: zero-tap entries first (most isolated), then by age.
-- Column "praying_count" is context only — not acknowledgment.

SELECT
  g.name                                                        AS gathering,
  p.display_name                                                AS author,
  LEFT(pr.body, 120)
    || CASE WHEN LENGTH(pr.body) > 120 THEN '…' ELSE '' END    AS body_preview,
  pr.praying_count,
  FLOOR(
    EXTRACT(EPOCH FROM (now() - pr.created_at)) / 3600
  )::int                                                        AS hours_old,
  pr.created_at,
  pr.id                                                         AS request_id
FROM public.gathering_prayer_requests pr
JOIN public.gatherings g ON g.id = pr.gathering_id
JOIN public.profiles   p ON p.id = pr.author_id
WHERE pr.created_at  < now() - INTERVAL '24 hours'
  AND pr.is_answered = false
ORDER BY pr.praying_count ASC, pr.created_at ASC;


-- ── SECTION 2: NEEDS PRESENCE ───────────────────────────────────
-- Threads in Daily Scripture Reflection and Questions About the
-- Bible that are older than 24h with zero replies.
-- These spaces need a human voice before they go quiet.

SELECT
  g.name                                                        AS gathering,
  t.title,
  t.passage_ref,
  FLOOR(
    EXTRACT(EPOCH FROM (now() - t.created_at)) / 3600
  )::int                                                        AS hours_old,
  t.created_at,
  t.id                                                          AS thread_id
FROM public.gathering_discussion_threads t
JOIN public.gatherings g ON g.id = t.gathering_id
WHERE t.gathering_id IN (
  SELECT id FROM public.gatherings
  WHERE slug IN (
    'daily-scripture-reflection',
    'questions-about-the-bible'
  )
)
  AND t.reply_count = 0
  AND t.created_at < now() - INTERVAL '24 hours'
ORDER BY t.created_at ASC;


-- ── SECTION 3: COMMUNITY SNAPSHOT ──────────────────────────────
-- Summary counts for the last 24h. No action required — context
-- for the steward reviewing Sections 1 and 2.

SELECT
  (
    SELECT COUNT(*)
    FROM public.gathering_members
    WHERE joined_at > now() - INTERVAL '24 hours'
      AND role      = 'member'
  )                         AS new_members,

  (
    SELECT COUNT(*)
    FROM public.gathering_discussion_threads
    WHERE created_at > now() - INTERVAL '24 hours'
  )                         AS new_threads,

  (
    SELECT COUNT(*)
    FROM public.gathering_prayer_requests
    WHERE created_at > now() - INTERVAL '24 hours'
  )                         AS new_prayer_requests,

  (
    SELECT COUNT(*)
    FROM public.gathering_discussion_replies
    WHERE created_at > now() - INTERVAL '24 hours'
  )                         AS new_replies,

  (
    SELECT COUNT(*)
    FROM public.content_reports
    WHERE status IN ('open', 'under_review')
  )                         AS open_reports;


-- New members detail (names + which gathering):

SELECT
  g.name         AS gathering,
  p.display_name AS new_member,
  gm.joined_at
FROM public.gathering_members gm
JOIN public.profiles  p ON p.id  = gm.user_id
JOIN public.gatherings g ON g.id = gm.gathering_id
WHERE gm.joined_at > now() - INTERVAL '24 hours'
  AND gm.role      = 'member'
ORDER BY gm.joined_at DESC;
