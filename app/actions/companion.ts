"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompanionNote, SavedPassage } from "@/lib/types/domain";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addCompanionNote(
  passageRef: string,
  body: string
): Promise<ActionResult<CompanionNote>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to save notes." };
  if (!body.trim()) return { success: false, error: "Note cannot be empty." };

  const { data, error } = await supabase
    .from("companion_notes")
    .insert({ user_id: user.id, passage_ref: passageRef, body: body.trim() })
    .select()
    .single();

  if (error) return { success: false, error: "Could not save note." };

  revalidatePath(`/companion/read/${passageRef}`);
  revalidatePath("/companion/notes");
  return { success: true, data: data as CompanionNote };
}

export async function updateCompanionNote(
  noteId: string,
  body: string
): Promise<ActionResult<CompanionNote>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to update notes." };
  if (!body.trim()) return { success: false, error: "Note cannot be empty." };

  const { data, error } = await supabase
    .from("companion_notes")
    .update({ body: body.trim(), updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { success: false, error: "Could not update note." };

  revalidatePath("/companion/notes");
  return { success: true, data: data as CompanionNote };
}

export async function deleteCompanionNote(noteId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("companion_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not remove note." };

  revalidatePath("/companion/notes");
  return { success: true };
}

export async function savePassage(
  passageRef: string
): Promise<ActionResult<SavedPassage>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to save passages." };

  const { data, error } = await supabase
    .from("saved_passages")
    .upsert({ user_id: user.id, passage_ref: passageRef }, { onConflict: "user_id,passage_ref" })
    .select()
    .single();

  if (error) return { success: false, error: "Could not save passage." };

  // Cross-movement saved_items record
  await supabase
    .from("saved_items")
    .upsert(
      { user_id: user.id, entity_type: "passage", entity_id: passageRef },
      { onConflict: "user_id,entity_type,entity_id" }
    );

  revalidatePath("/companion/saved");
  return { success: true, data: data as SavedPassage };
}

export async function unsavePassage(passageRef: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated." };

  await supabase
    .from("saved_passages")
    .delete()
    .eq("user_id", user.id)
    .eq("passage_ref", passageRef);

  await supabase
    .from("saved_items")
    .delete()
    .eq("user_id", user.id)
    .eq("entity_type", "passage")
    .eq("entity_id", passageRef);

  revalidatePath("/companion/saved");
  return { success: true };
}

export async function updatePreferredVersion(version: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_bible_version: version })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not update preference." };
  return { success: true };
}

export async function getOrCreateCompanionThread(
  passageRef: string
): Promise<ActionResult<{ threadId: string }>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to use the companion." };

  // Return existing thread for this passage if one exists
  const { data: existing } = await supabase
    .from("companion_threads")
    .select("id")
    .eq("user_id", user.id)
    .eq("passage_ref", passageRef)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { success: true, data: { threadId: existing.id } };

  const { data, error } = await supabase
    .from("companion_threads")
    .insert({ user_id: user.id, passage_ref: passageRef })
    .select("id")
    .single();

  if (error) return { success: false, error: "Could not start companion thread." };
  return { success: true, data: { threadId: data.id } };
}
