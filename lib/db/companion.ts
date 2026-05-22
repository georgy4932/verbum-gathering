import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompanionNote, CompanionThread, CompanionMessage, SavedPassage } from "@/lib/types/domain";

export async function getNotesForPassage(
  userId: string,
  passageRef: string
): Promise<CompanionNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("companion_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("passage_ref", passageRef)
    .order("created_at", { ascending: false });
  return (data ?? []) as CompanionNote[];
}

export async function getAllNotesByUser(userId: string): Promise<CompanionNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("companion_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as CompanionNote[];
}

export async function getSavedPassagesByUser(userId: string): Promise<SavedPassage[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("saved_passages")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });
  return (data ?? []) as SavedPassage[];
}

export async function getPassageSavedStatus(
  userId: string,
  passageRef: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("saved_passages")
    .select("id")
    .eq("user_id", userId)
    .eq("passage_ref", passageRef)
    .maybeSingle();
  return data !== null;
}

export async function getThreadForPassage(
  userId: string,
  passageRef: string
): Promise<(CompanionThread & { messages: CompanionMessage[] }) | null> {
  const supabase = await createSupabaseServerClient();
  const { data: thread } = await supabase
    .from("companion_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("passage_ref", passageRef)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!thread) return null;

  const { data: messages } = await supabase
    .from("companion_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  return { ...(thread as CompanionThread), messages: (messages ?? []) as CompanionMessage[] };
}
