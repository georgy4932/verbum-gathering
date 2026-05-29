-- ================================================================
-- MORNING STEWARD DIGEST — v2
-- Run once per day in the Supabase SQL editor.
-- Review sections top to bottom.
-- ================================================================
--
-- SCHEMA VERIFIED: 2026-05-29 (v1); updated 2026-05-29 (v2)
--
-- Prayer request acknowledgment (ADR-004):
--   A written reply from a gathering member OTHER than the request
--   author counts as acknowledgment. Self-replies (the request author
--   adding an update to their own request) are stored but excluded
--   from the acknowledgment count.
--   Source table: gathering_prayer_replies (migration 017).
--   praying_count (tap) is shown as context — not acknowledgment.
--
--   NOTE: prayer_posts / prayer_reactions are legacy fellowship-room
--   tables (keyed by room_slug). They are a different system and are
--   excluded from this digest.
--
-- Thread reply counting:
--   Section 2 uses live counts from gathering_discussion_replies.
--   stored reply_count is shown beside live count for audit purposes
--   but the queue logic (HAVING COUNT = 0) uses the live count.
-- ================================================================


-- ── SECTION 1: NEEDS RESPONSE ──────────────────────────────────
-- Prayer requests older than 24h with zero written replies from
-- anyone other than the request author (ADR-004 acknowledgment).
--
-- Self-replies excluded: JOIN filters rpl.author_id != pr.author_id
-- praying_count is shown as context — not acknowledgment.
-- Sorted: zero taps first (most isolated), then by age.

SELECT
  g.name                                                          AS gathering,
  p.display_name                                                  AS author,
  LEFT(pr.body, 140)
    || CASE WHEN LENGTH(pr.body) > 140 THEN '…' ELSE '' END      AS body_preview,
  pr.praying_count,
  COUNT(rpl.id)                                                   AS reply_count,
  FLOOR(
    EXTRACT(EPOCH FROM (now() - pr.created_at)) / 3600
  )::int                                                          AS hours_old,
  pr.created_at,
  pr.id                                                           AS request_id
FROM public.gathering_prayer_requests pr
JOIN public.gatherings g ON g.id  = pr.gathering_id
JOIN public.profiles   p ON p.id  = pr.author_id
LEFT JOIN public.gathering_prayer_replies rpl
  ON  rpl.request_id = pr.id
  AND rpl.author_id != pr.author_id   -- self-replies excluded per ADR-004
WHERE pr.created_at  < now() - INTERVAL '24 hours'
  AND pr.is_answered = false
GROUP BY
  g.name, pr.id, p.display_name, pr.body, pr.praying_count, pr.created_at
HAVING COUNT(rpl.id) = 0
ORDER BY pr.praying_count ASC, pr.created_at ASC;


-- ── SECTION 2: NEEDS PRESENCE ──────────────────────────────────
-- Threads in Daily Scripture Reflection and Questions About the
-- Bible that are older than 24h with zero live replies.
--
-- Queue condition: HAVING COUNT(r.id) = 0  (live count from table)
-- stored_reply_count shown alongside for audit — do not use it
-- to gate which rows appear here.

SELECT
  g.name                                                          AS gathering,
  t.title,
  t.passage_ref,
  COUNT(r.id)                                                     AS live_reply_count,
  t.reply_count                                                   AS stored_reply_count,
  FLOOR(
    EXTRACT(EPOCH FROM (now() - t.created_at)) / 3600
  )::int                                                          AS hours_old,
  t.created_at,
  t.id                                                            AS thread_id
FROM public.gathering_discussion_threads t
JOIN public.gatherings g
  ON  g.id   = t.gathering_id
LEFT JOIN public.gathering_discussion_replies r
  ON  r.thread_id = t.id
WHERE g.slug IN (
    'daily-scripture-reflection',
    'questions-about-the-bible'
  )
  AND t.created_at < now() - INTERVAL '24 hours'
GROUP BY
  g.name, t.id, t.title, t.passage_ref, t.reply_count, t.created_at
HAVING COUNT(r.id) = 0
ORDER BY g.name, t.created_at ASC;


-- ── SECTION 3: COMMUNITY SNAPSHOT ─────────────────────────────
-- Counts for the last 24h. No action required here — context for
-- the steward reviewing Sections 1 and 2.

SELECT
  (
    SELECT COUNT(*)
    FROM public.gathering_members
    WHERE joined_at > now() - INTERVAL '24 hours'
      AND role = 'member'
  )::int AS new_members,
  (
    SELECT COUNT(*)
    FROM public.gathering_discussion_threads
    WHERE created_at > now() - INTERVAL '24 hours'
  )::int AS new_threads,
  (
    SELECT COUNT(*)
    FROM public.gathering_prayer_requests
    WHERE created_at > now() - INTERVAL '24 hours'
  )::int AS new_prayer_requests,
  (
    SELECT COUNT(*)
    FROM public.gathering_discussion_replies
    WHERE created_at > now() - INTERVAL '24 hours'
  )::int AS new_replies,
  (
    SELECT COUNT(*)
    FROM public.content_reports
    WHERE status IN ('open', 'under_review')
  )::int AS open_reports;


-- New members detail (who joined which gathering):

SELECT
  g.name         AS gathering,
  p.display_name AS new_member,
  gm.role,
  gm.joined_at
FROM public.gathering_members gm
JOIN public.profiles   p ON p.id = gm.user_id
JOIN public.gatherings g ON g.id = gm.gathering_id
WHERE gm.joined_at > now() - INTERVAL '24 hours'
  AND gm.role = 'member'
ORDER BY gm.joined_at DESC;
