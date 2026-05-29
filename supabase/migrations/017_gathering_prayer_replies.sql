-- ================================================================
-- 017 — gathering_prayer_replies
--
-- Adds written-reply support for prayer requests.
-- Enables the stewardship digest to enforce the "zero live written
-- replies" condition from ADR-004 instead of surfacing all requests.
--
-- Self-reply exclusion (request author replying to their own request
-- does not count as acknowledgment) is a digest/query concern, not
-- a schema constraint. The table stores all replies; the digest
-- filters with author_id != pr.author_id when counting.
--
-- No reply_count trigger: ADR-004 and the digest spec require live
-- counts. A denormalized count is not needed here.
-- ================================================================


-- ── TABLE ───────────────────────────────────────────────────────

CREATE TABLE public.gathering_prayer_replies (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id  uuid        NOT NULL
                REFERENCES public.gathering_prayer_requests(id) ON DELETE CASCADE,
  author_id   uuid        NOT NULL
                REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Index supports per-request reply lookups (digest COUNT, UI listing)
CREATE INDEX idx_prayer_replies_request_id
  ON public.gathering_prayer_replies(request_id);

-- updated_at trigger (reuses existing function)
CREATE TRIGGER trg_prayer_replies_updated_at
  BEFORE UPDATE ON public.gathering_prayer_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── RLS ─────────────────────────────────────────────────────────

ALTER TABLE public.gathering_prayer_replies ENABLE ROW LEVEL SECURITY;

-- SELECT: same visibility rule as the parent request
CREATE POLICY "Prayer replies: select"
  ON public.gathering_prayer_replies
  FOR SELECT
  USING (
    public.can_see_gathering((
      SELECT gathering_id
      FROM public.gathering_prayer_requests
      WHERE id = request_id
    ))
  );

-- INSERT: must be a gathering member; reply attributed to caller only
CREATE POLICY "Prayer replies: insert"
  ON public.gathering_prayer_replies
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_gathering_member((
      SELECT gathering_id
      FROM public.gathering_prayer_requests
      WHERE id = request_id
    ))
  );

-- DELETE: author removes their own; host/mod can remove any
-- (no moderation UI yet — policy is the access layer, not the UI)
CREATE POLICY "Prayer replies: delete"
  ON public.gathering_prayer_replies
  FOR DELETE
  USING (
    author_id = auth.uid()
    OR public.gathering_member_role((
      SELECT gathering_id
      FROM public.gathering_prayer_requests
      WHERE id = request_id
    )) = ANY (ARRAY['host'::text, 'moderator'::text])
  );

-- No UPDATE policy: replies are immutable at the application layer.
-- updated_at column is present for future use; it will equal created_at
-- until an UPDATE policy is explicitly added.
