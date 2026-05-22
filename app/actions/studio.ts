"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TeachingKind } from "@/lib/types/domain";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getMinisterUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isMinister: false };

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = roleRow?.role ?? "member";
  const isMinister = ["minister", "admin"].includes(role);
  return { supabase, user, isMinister };
}

export async function createTeaching(params: {
  title: string;
  slug: string;
  kind: TeachingKind;
  passageRef: string;
  scriptureRefs: string[];
  body: string;
  seriesId: string | null;
  isPublished: boolean;
}): Promise<ActionResult<{ slug: string }>> {
  const { supabase, user, isMinister } = await getMinisterUser();
  if (!user) return { success: false, error: "Sign in required." };
  if (!isMinister) return { success: false, error: "Minister role required to create teachings." };
  if (!params.title.trim()) return { success: false, error: "Title is required." };
  if (!params.slug.trim()) return { success: false, error: "Slug is required." };

  const { data, error } = await supabase
    .from("teachings")
    .insert({
      title: params.title.trim(),
      slug: params.slug.trim(),
      kind: params.kind,
      minister_id: user.id,
      passage_ref: params.passageRef.trim() || null,
      scripture_refs: params.scriptureRefs,
      body: params.body.trim() || null,
      series_id: params.seriesId || null,
      is_published: params.isPublished,
      published_at: params.isPublished ? new Date().toISOString() : null,
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A teaching with that slug already exists." };
    return { success: false, error: error.message };
  }

  revalidatePath("/studio");
  return { success: true, data: { slug: data.slug } };
}

export async function updateTeaching(params: {
  id: string;
  title: string;
  slug: string;
  kind: TeachingKind;
  passageRef: string;
  scriptureRefs: string[];
  body: string;
  seriesId: string | null;
  isPublished: boolean;
  existingPublishedAt: string | null;
}): Promise<ActionResult<{ slug: string }>> {
  const { supabase, user, isMinister } = await getMinisterUser();
  if (!user) return { success: false, error: "Sign in required." };
  if (!isMinister) return { success: false, error: "Minister role required." };

  const publishedAt =
    params.isPublished ? (params.existingPublishedAt ?? new Date().toISOString()) : null;

  const { data, error } = await supabase
    .from("teachings")
    .update({
      title: params.title.trim(),
      slug: params.slug.trim(),
      kind: params.kind,
      passage_ref: params.passageRef.trim() || null,
      scripture_refs: params.scriptureRefs,
      body: params.body.trim() || null,
      series_id: params.seriesId || null,
      is_published: params.isPublished,
      published_at: publishedAt,
    })
    .eq("id", params.id)
    .eq("minister_id", user.id)
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A teaching with that slug already exists." };
    return { success: false, error: error.message };
  }

  revalidatePath("/studio");
  revalidatePath(`/studio/${data.slug}`);
  return { success: true, data: { slug: data.slug } };
}

export async function createSeries(params: {
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
}): Promise<ActionResult<{ slug: string }>> {
  const { supabase, user, isMinister } = await getMinisterUser();
  if (!user) return { success: false, error: "Sign in required." };
  if (!isMinister) return { success: false, error: "Minister role required to create series." };
  if (!params.title.trim()) return { success: false, error: "Title is required." };
  if (!params.slug.trim()) return { success: false, error: "Slug is required." };

  const { data, error } = await supabase
    .from("teaching_series")
    .insert({
      title: params.title.trim(),
      slug: params.slug.trim(),
      description: params.description.trim() || null,
      minister_id: user.id,
      is_published: params.isPublished,
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A series with that slug already exists." };
    return { success: false, error: error.message };
  }

  revalidatePath("/studio");
  return { success: true, data: { slug: data.slug } };
}
