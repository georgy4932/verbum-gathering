"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Gathering,
  GatheringMember,
  GatheringStudyPost,
  GatheringDiscussionThread,
  GatheringDiscussionReply,
  GatheringPrayerRequest,
  GatheringLiveSession,
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
  revalidatePath(`/gatherings/${gatheringSlug}/live`);
  return { success: true, data: data as GatheringLiveSession };
}
