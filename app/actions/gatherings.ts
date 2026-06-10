"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logGatheringEvent } from "@/lib/monitoring";
import type {
  Gathering,
  GatheringMember,
  GatheringStudyPost,
  GatheringDiscussionThread,
  GatheringDiscussionReply,
  GatheringPrayerRequest,
  GatheringLiveSession,
  CompanionNoteKind,
} from "@/lib/types/domain";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Gatherings ────────────────────────────────────────────────────────────

export async function listGatherings(visibility?: "public" | "community"): Promise<Gathering[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("gatherings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (visibility) query = query.eq("visibility", visibility);
  const { data } = await query;
  return (data ?? []) as Gathering[];
}

export async function getGathering(slug: string): Promise<Gathering | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("gatherings")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Gathering | null;
}

export async function createGathering(formData: FormData): Promise<never> {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/auth/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("trust_state")
    .eq("id", user.id)
    .single();

  if (profile?.trust_state !== "trusted_user") {
    redirect("/gatherings/new?error=Gathering+creation+requires+trusted+member+status.");
  }

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const visibility = (formData.get("visibility") as string) || "public";
  const passage_ref = (formData.get("passage_ref") as string | null)?.trim() || null;

  if (!name) redirect("/gatherings/new?error=Name+is+required");

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  const { data, error } = await supabase
    .from("gatherings")
    .insert({ slug, name, description, host_id: user.id, visibility, passage_ref })
    .select()
    .single();

  if (error || !data) redirect("/gatherings/new?error=Could+not+create+gathering");

  logGatheringEvent("gathering_created", user.id, (data as Gathering).id, { visibility, slug: (data as Gathering).slug });

  redirect(`/gatherings/${(data as Gathering).slug}`);
}

// ── Membership ─────────────────────────────────────────────────────────────

export async function getMyMembership(gatheringId: string): Promise<GatheringMember | null> {
  const { supabase, user } = await getAuthUser();
  if (!user) return null;
  const { data } = await supabase
    .from("gathering_members")
    .select("*")
    .eq("gathering_id", gatheringId)
    .eq("user_id", user.id)
    .single();
  return data as GatheringMember | null;
}

export async function joinGathering(gatheringId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to join gatherings." };

  const { error } = await supabase
    .from("gathering_members")
    .insert({ gathering_id: gatheringId, user_id: user.id, role: "member" });

  if (error) return { success: false, error: "Could not join gathering." };
  logGatheringEvent("gathering_joined", user.id, gatheringId);
  revalidatePath("/gatherings");
  return { success: true };
}

export async function leaveGathering(gatheringId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("gathering_members")
    .delete()
    .eq("gathering_id", gatheringId)
    .eq("user_id", user.id)
    .neq("role", "host");

  if (error) return { success: false, error: "Could not leave gathering." };
  logGatheringEvent("gathering_left", user.id, gatheringId);
  revalidatePath("/gatherings");
  return { success: true };
}

// ── Study Posts ───────────────────────────────────────────────────────────

export async function listStudyPosts(gatheringId: string): Promise<GatheringStudyPost[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("gathering_study_posts")
    .select("*")
    .eq("gathering_id", gatheringId)
    .order("created_at", { ascending: false });
  return (data ?? []) as GatheringStudyPost[];
}

export async function createStudyPost(
  gatheringId: string,
  gatheringSlug: string,
  formData: FormData,
): Promise<ActionResult<GatheringStudyPost>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to post." };

  const title = (formData.get("title") as string).trim();
  const body = (formData.get("body") as string).trim();
  const passage_ref = (formData.get("passage_ref") as string | null)?.trim() || null;

  if (!title || !body) return { success: false, error: "Title and content are required." };

  const { data, error } = await supabase
    .from("gathering_study_posts")
    .insert({ gathering_id: gatheringId, author_id: user.id, title, body, passage_ref })
    .select()
    .single();

  if (error || !data) return { success: false, error: "Could not create study post." };
  logGatheringEvent("study_post_created", user.id, gatheringId, { title });
  revalidatePath(`/gatherings/${gatheringSlug}/study`);
  return { success: true, data: data as GatheringStudyPost };
}

// ── Discussion Threads ────────────────────────────────────────────────────

export async function listThreads(gatheringId: string): Promise<GatheringDiscussionThread[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("gathering_discussion_threads")
    .select("*")
    .eq("gathering_id", gatheringId)
    .order("created_at", { ascending: false });
  return (data ?? []) as GatheringDiscussionThread[];
}

export async function getThread(threadId: string): Promise<GatheringDiscussionThread | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("gathering_discussion_threads")
    .select("*")
    .eq("id", threadId)
    .single();
  return data as GatheringDiscussionThread | null;
}

export async function createThread(
  gatheringId: string,
  gatheringSlug: string,
  formData: FormData,
): Promise<ActionResult<GatheringDiscussionThread>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to start a discussion." };

  const title = (formData.get("title") as string).trim();
  const body = (formData.get("body") as string | null)?.trim() || null;

  if (!title) return { success: false, error: "A title is required." };

  const { data, error } = await supabase
    .from("gathering_discussion_threads")
    .insert({ gathering_id: gatheringId, author_id: user.id, title, body })
    .select()
    .single();

  if (error || !data) return { success: false, error: "Could not start discussion." };
  logGatheringEvent("discussion_thread_created", user.id, gatheringId, { title });
  revalidatePath(`/gatherings/${gatheringSlug}/discussion`);
  return { success: true, data: data as GatheringDiscussionThread };
}

export async function listReplies(threadId: string): Promise<GatheringDiscussionReply[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("gathering_discussion_replies")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  return (data ?? []) as GatheringDiscussionReply[];
}

export async function createReply(
  threadId: string,
  gatheringSlug: string,
  formData: FormData,
): Promise<ActionResult<GatheringDiscussionReply>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to reply." };

  const body = (formData.get("body") as string).trim();
  if (!body) return { success: false, error: "Reply cannot be empty." };

  const { data, error } = await supabase
    .from("gathering_discussion_replies")
    .insert({ thread_id: threadId, author_id: user.id, body })
    .select()
    .single();

  if (error || !data) return { success: false, error: "Could not add reply." };
  revalidatePath(`/gatherings/${gatheringSlug}/discussion/${threadId}`);
  return { success: true, data: data as GatheringDiscussionReply };
}

// ── Prayer Requests ───────────────────────────────────────────────────────

export async function listPrayerRequests(gatheringId: string): Promise<GatheringPrayerRequest[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("gathering_prayer_requests")
    .select("*")
    .eq("gathering_id", gatheringId)
    .order("created_at", { ascending: false });
  return (data ?? []) as GatheringPrayerRequest[];
}

export async function createPrayerRequest(
  gatheringId: string,
  gatheringSlug: string,
  formData: FormData,
): Promise<ActionResult<GatheringPrayerRequest>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to share a prayer request." };

  const body = (formData.get("body") as string).trim();
  if (!body) return { success: false, error: "Please share what you need prayer for." };

  const { data, error } = await supabase
    .from("gathering_prayer_requests")
    .insert({ gathering_id: gatheringId, author_id: user.id, body })
    .select()
    .single();

  if (error || !data) return { success: false, error: "Could not share prayer request." };
  logGatheringEvent("prayer_request_created", user.id, gatheringId);
  revalidatePath(`/gatherings/${gatheringSlug}/prayer`);
  return { success: true, data: data as GatheringPrayerRequest };
}

export async function acknowledgePrayer(
  requestId: string,
  gatheringSlug: string,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to pray." };

  const { error } = await supabase
    .from("gathering_prayer_acknowledgments")
    .upsert({ request_id: requestId, user_id: user.id }, {
      onConflict: "request_id,user_id",
    });

  if (error) return { success: false, error: "Could not record." };
  logGatheringEvent("prayer_acknowledged", user.id, null, { requestId });
  revalidatePath(`/gatherings/${gatheringSlug}/prayer`);
  return { success: true };
}

export async function getMyPrayerAcks(requestIds: string[]): Promise<string[]> {
  const { supabase, user } = await getAuthUser();
  if (!user || requestIds.length === 0) return [];
  const { data } = await supabase
    .from("gathering_prayer_acknowledgments")
    .select("request_id")
    .eq("user_id", user.id)
    .in("request_id", requestIds);
  return (data ?? []).map((r: { request_id: string }) => r.request_id);
}

// ── Live Sessions ─────────────────────────────────────────────────────────

export async function listLiveSessions(gatheringId: string): Promise<GatheringLiveSession[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("gathering_live_sessions")
    .select("*")
    .eq("gathering_id", gatheringId)
    .order("scheduled_at", { ascending: true });
  return (data ?? []) as GatheringLiveSession[];
}

export async function createLiveSession(
  gatheringId: string,
  gatheringSlug: string,
  formData: FormData,
): Promise<ActionResult<GatheringLiveSession>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const title = (formData.get("title") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const scheduled_at = formData.get("scheduled_at") as string;

  if (!title || !scheduled_at) return { success: false, error: "Title and start time are required." };

  const { data, error } = await supabase
    .from("gathering_live_sessions")
    .insert({ gathering_id: gatheringId, title, description, scheduled_at })
    .select()
    .single();

  if (error || !data) return { success: false, error: "Could not schedule session." };
  logGatheringEvent("live_session_scheduled", user.id, gatheringId, { title, scheduled_at });
  revalidatePath(`/gatherings/${gatheringSlug}/live`);
  return { success: true, data: data as GatheringLiveSession };
}

// ── Companion → Gathering (Copy/Publish) ─────────────────────────────────
//
// Shared content is a one-time snapshot of a private Companion item — never
// a live reference. Re-sharing the same Companion item creates another,
// independent Gathering row (no dedupe, no last_shared_at, no back-link).

const THREAD_TITLE_MAX = 200;
const THREAD_BODY_MAX = 5000;
const PRAYER_BODY_MAX = 1000;

export type ShareableGathering = Pick<Gathering, "id" | "slug" | "name" | "visibility">;

// Gatherings the current user is a member of — used to populate the
// "Share to Gathering" picker. RLS-scoped: only returns gatherings this
// user can actually post into.
export async function listMyGatheringsForSharing(): Promise<ShareableGathering[]> {
  const { supabase, user } = await getAuthUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("gathering_members")
    .select("gathering_id")
    .eq("user_id", user.id);

  const gatheringIds = (memberships ?? []).map((m: { gathering_id: string }) => m.gathering_id);
  if (gatheringIds.length === 0) return [];

  const { data } = await supabase
    .from("gatherings")
    .select("id, slug, name, visibility")
    .in("id", gatheringIds)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (data ?? []) as ShareableGathering[];
}

export async function publishCompanionNoteToGathering(
  noteId: string,
  gatheringId: string,
  options?: {
    titleOverride?: string;
    scriptureContext?: {
      translationVersion?: string;
      scriptureTextSnapshot?: string;
    };
  },
): Promise<ActionResult<{ gatheringSlug: string; gatheringName: string; kind: CompanionNoteKind }>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to share to a Gathering." };

  // Re-fetch the source note inside the action — never trust a
  // client-supplied kind/body/passage. Ownership is enforced both here
  // and by RLS ("Companion notes: owner").
  const { data: note, error: noteError } = await supabase
    .from("companion_notes")
    .select("*")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .single();

  if (noteError || !note) return { success: false, error: "Note not found." };

  // Membership pre-check (also enforced by RLS on the insert below).
  const membership = await getMyMembership(gatheringId);
  if (!membership) return { success: false, error: "You must be a member of this Gathering to share here." };

  const { data: gathering } = await supabase
    .from("gatherings")
    .select("id, slug, name")
    .eq("id", gatheringId)
    .single();

  if (!gathering) return { success: false, error: "Gathering not found." };

  const passage_ref = note.passage_ref as string;
  const body = (note.body as string).trim();
  const translation_version = options?.scriptureContext?.translationVersion ?? null;
  const scripture_text_snapshot = options?.scriptureContext?.scriptureTextSnapshot ?? null;

  // Branch on the persisted DB kind — never on a client-provided value.
  if (note.kind === "prayer") {
    if (body.length > PRAYER_BODY_MAX) {
      return { success: false, error: `Prayer point is too long to share (max ${PRAYER_BODY_MAX} characters).` };
    }

    const { error } = await supabase
      .from("gathering_prayer_requests")
      .insert({
        gathering_id: gatheringId,
        author_id: user.id,
        body,
        passage_ref,
        translation_version,
        scripture_text_snapshot,
        source_context: "companion_prayer",
        publication_state: "shared",
      });

    if (error) return { success: false, error: "Could not share prayer point." };

    logGatheringEvent("companion_note_published", user.id, gatheringId, { kind: "prayer" });
    revalidatePath(`/gatherings/${gathering.slug}/prayer`);
    return { success: true, data: { gatheringSlug: gathering.slug, gatheringName: gathering.name, kind: "prayer" } };
  }

  // kind === "note" → discussion thread, with a server-generated title.
  if (body.length > THREAD_BODY_MAX) {
    return { success: false, error: `Reflection is too long to share (max ${THREAD_BODY_MAX} characters).` };
  }

  let title = (options?.titleOverride ?? "").trim();
  if (!title) {
    title = passage_ref ? `Reflection on ${passage_ref}` : "Shared reflection";
  }
  if (title.length > THREAD_TITLE_MAX) {
    return { success: false, error: `Title is too long to share (max ${THREAD_TITLE_MAX} characters).` };
  }

  const { error } = await supabase
    .from("gathering_discussion_threads")
    .insert({
      gathering_id: gatheringId,
      author_id: user.id,
      title,
      body,
      passage_ref,
      translation_version,
      scripture_text_snapshot,
      source_context: "companion_note",
      publication_state: "shared",
    });

  if (error) return { success: false, error: "Could not share reflection." };

  logGatheringEvent("companion_note_published", user.id, gatheringId, { kind: "note" });
  revalidatePath(`/gatherings/${gathering.slug}/discussion`);
  return { success: true, data: { gatheringSlug: gathering.slug, gatheringName: gathering.name, kind: "note" } };
}
