"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorshipSetKind, WorshipMomentKind, DevotionalPracticeKind } from "@/lib/types/domain";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getMinisterUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isMinister: false };
  const { data: roleRow } = await supabase
    .from("user_roles").select("role").eq("id", user.id).maybeSingle();
  const role = roleRow?.role ?? "member";
  const isMinister = ["minister", "admin"].includes(role);
  return { supabase, user, isMinister };
}

export async function createWorshipSet(params: {
  title: string;
  slug: string;
  kind: WorshipSetKind;
  passageRef: string;
  scriptureRefs: string[];
  description: string;
  isPublished: boolean;
}): Promise<ActionResult<{ slug: string; id: string }>> {
  const { supabase, user, isMinister } = await getMinisterUser();
  if (!user) return { success: false, error: "Sign in required." };
  if (!isMinister) return { success: false, error: "Minister role required." };
  if (!params.title.trim()) return { success: false, error: "Title is required." };
  if (!params.slug.trim()) return { success: false, error: "Slug is required." };

  const { data, error } = await supabase
    .from("worship_sets")
    .insert({
      title: params.title.trim(),
      slug: params.slug.trim(),
      kind: params.kind,
      curator_id: user.id,
      passage_ref: params.passageRef.trim() || null,
      scripture_refs: params.scriptureRefs,
      description: params.description.trim() || null,
      is_published: params.isPublished,
    })
    .select("slug, id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A worship set with that slug already exists." };
    return { success: false, error: error.message };
  }

  revalidatePath("/worship");
  return { success: true, data: { slug: data.slug, id: data.id } };
}

export async function updateWorshipSet(params: {
  id: string;
  title: string;
  slug: string;
  kind: WorshipSetKind;
  passageRef: string;
  scriptureRefs: string[];
  description: string;
  isPublished: boolean;
}): Promise<ActionResult<{ slug: string }>> {
  const { supabase, user, isMinister } = await getMinisterUser();
  if (!user) return { success: false, error: "Sign in required." };
  if (!isMinister) return { success: false, error: "Minister role required." };

  const { data, error } = await supabase
    .from("worship_sets")
    .update({
      title: params.title.trim(),
      slug: params.slug.trim(),
      kind: params.kind,
      passage_ref: params.passageRef.trim() || null,
      scripture_refs: params.scriptureRefs,
      description: params.description.trim() || null,
      is_published: params.isPublished,
    })
    .eq("id", params.id)
    .eq("curator_id", user.id)
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A worship set with that slug already exists." };
    return { success: false, error: error.message };
  }

  revalidatePath("/worship");
  revalidatePath(`/worship/${data.slug}`);
  return { success: true, data: { slug: data.slug } };
}

export async function addWorshipMoment(params: {
  setId: string;
  setSlug: string;
  kind: WorshipMomentKind;
  title: string;
  body: string;
  passageRef: string;
  mediaUrl: string;
  durationSeconds: number | null;
  position: number;
}): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, isMinister } = await getMinisterUser();
  if (!user) return { success: false, error: "Sign in required." };
  if (!isMinister) return { success: false, error: "Minister role required." };

  const { data: set } = await supabase
    .from("worship_sets")
    .select("id")
    .eq("id", params.setId)
    .eq("curator_id", user.id)
    .maybeSingle();
  if (!set) return { success: false, error: "Worship set not found or access denied." };

  const { data, error } = await supabase
    .from("worship_moments")
    .insert({
      set_id: params.setId,
      kind: params.kind,
      title: params.title.trim() || null,
      body: params.body.trim() || null,
      passage_ref: params.passageRef.trim() || null,
      media_url: params.mediaUrl.trim() || null,
      duration_seconds: params.durationSeconds,
      position: params.position,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/worship/${params.setSlug}/edit`);
  revalidatePath(`/worship/${params.setSlug}`);
  return { success: true, data: { id: data.id } };
}

export async function deleteWorshipMoment(
  momentId: string,
  setSlug: string
): Promise<ActionResult> {
  const { supabase, user, isMinister } = await getMinisterUser();
  if (!user) return { success: false, error: "Sign in required." };
  if (!isMinister) return { success: false, error: "Minister role required." };

  const { error } = await supabase
    .from("worship_moments")
    .delete()
    .eq("id", momentId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/worship/${setSlug}/edit`);
  revalidatePath(`/worship/${setSlug}`);
  return { success: true };
}

export async function createPractice(params: {
  title: string;
  slug: string;
  kind: DevotionalPracticeKind;
  passageRef: string;
  scriptureRefs: string[];
  description: string;
  isPublished: boolean;
}): Promise<ActionResult<{ slug: string }>> {
  const { supabase, user, isMinister } = await getMinisterUser();
  if (!user) return { success: false, error: "Sign in required." };
  if (!isMinister) return { success: false, error: "Minister role required." };
  if (!params.title.trim()) return { success: false, error: "Title is required." };
  if (!params.slug.trim()) return { success: false, error: "Slug is required." };

  const { data, error } = await supabase
    .from("devotional_practices")
    .insert({
      title: params.title.trim(),
      slug: params.slug.trim(),
      kind: params.kind,
      passage_ref: params.passageRef.trim() || null,
      scripture_refs: params.scriptureRefs,
      description: params.description.trim() || null,
      is_published: params.isPublished,
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A practice with that slug already exists." };
    return { success: false, error: error.message };
  }

  revalidatePath("/worship");
  return { success: true, data: { slug: data.slug } };
}
