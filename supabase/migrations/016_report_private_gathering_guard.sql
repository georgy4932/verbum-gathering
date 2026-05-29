-- ── 016: Add private-gathering membership check to file_content_report ───────
--
-- file_content_report() is SECURITY DEFINER and runs as postgres, bypassing
-- RLS. Without a membership check, an authenticated user with a known content
-- UUID from a private gathering could file a report on content they cannot
-- legitimately see through the application.
--
-- Fix: after deriving gathering_id from the content, check visibility. If the
-- gathering is private, the reporter must be a member. Public and community
-- gatherings are visible to all authenticated users — no membership check there.

CREATE OR REPLACE FUNCTION file_content_report(
  p_content_type text,
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
  v_reporter_id          uuid := auth.uid();
  v_reported_user_id     uuid;
  v_gathering_id         uuid;
  v_gathering_visibility text;
  v_thread_id            uuid;
  v_reply_id             uuid;
  v_prayer_request_id    uuid;
  v_study_post_id        uuid;
  v_report_id            uuid;
BEGIN
  IF v_reporter_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_content_type = 'thread' THEN
    SELECT author_id, gathering_id INTO v_reported_user_id, v_gathering_id
      FROM public.gathering_discussion_threads WHERE id = p_content_id;
    v_thread_id := p_content_id;

  ELSIF p_content_type = 'reply' THEN
    SELECT r.author_id, t.gathering_id INTO v_reported_user_id, v_gathering_id
      FROM public.gathering_discussion_replies r
      JOIN public.gathering_discussion_threads t ON t.id = r.thread_id
      WHERE r.id = p_content_id;
    v_reply_id := p_content_id;

  ELSIF p_content_type = 'prayer_request' THEN
    SELECT author_id, gathering_id INTO v_reported_user_id, v_gathering_id
      FROM public.gathering_prayer_requests WHERE id = p_content_id;
    v_prayer_request_id := p_content_id;

  ELSIF p_content_type = 'study_post' THEN
    SELECT author_id, gathering_id INTO v_reported_user_id, v_gathering_id
      FROM public.gathering_study_posts WHERE id = p_content_id;
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

  -- For private gatherings, verify the reporter is a member.
  -- Public and community gatherings are visible to all authenticated users.
  IF v_gathering_id IS NOT NULL THEN
    SELECT visibility INTO v_gathering_visibility
      FROM public.gatherings WHERE id = v_gathering_id;

    IF v_gathering_visibility = 'private' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.gathering_members
        WHERE gathering_id = v_gathering_id AND user_id = v_reporter_id
      ) THEN
        RAISE EXCEPTION 'Not a member of this gathering';
      END IF;
    END IF;
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
