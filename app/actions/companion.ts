"use server";

import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompanionNote, SavedPassage } from "@/lib/types/domain";

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

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

export async function updateRedLetterPreference(enabled: boolean): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ show_red_letter: enabled })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not update preference." };
  return { success: true };
}

// ── Highlight actions ─────────────────────────────────────────────────────────

const VALID_COLORS = new Set(['yellow', 'blue', 'green', 'pink', 'orange']);
const PASSAGE_REF_RE = /^[\w\s]+ \d+:\d+$/; // e.g. "John 3:16"

export async function addHighlight(
  passageRef: string,
  color: string,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to highlight verses." };
  if (!PASSAGE_REF_RE.test(passageRef)) return { success: false, error: "Invalid passage reference." };
  if (!VALID_COLORS.has(color)) return { success: false, error: "Invalid highlight color." };

  const { error } = await supabase
    .from("verse_highlights")
    .upsert(
      { user_id: user.id, passage_ref: passageRef, color },
      { onConflict: "user_id,passage_ref" },
    );

  if (error) return { success: false, error: "Could not save highlight." };
  return { success: true };
}

export async function removeHighlight(passageRef: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (!PASSAGE_REF_RE.test(passageRef)) return { success: false, error: "Invalid passage reference." };

  const { error } = await supabase
    .from("verse_highlights")
    .delete()
    .eq("user_id", user.id)
    .eq("passage_ref", passageRef);

  if (error) return { success: false, error: "Could not remove highlight." };
  return { success: true };
}

// bookName is the display name, e.g. "John". passage_refs are stored as "John 3:16".
export async function getHighlightsForChapter(
  bookName: string,
  chapter: number,
): Promise<Map<number, string>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return new Map();

  const { data } = await supabase
    .from("verse_highlights")
    .select("passage_ref, color")
    .eq("user_id", user.id)
    .like("passage_ref", `${bookName} ${chapter}:%`);

  if (!data) return new Map();

  const map = new Map<number, string>();
  for (const row of data) {
    const match = (row.passage_ref as string).match(/:(\d+)$/);
    if (match) map.set(parseInt(match[1], 10), row.color as string);
  }
  return map;
}

// ── Study panel actions ───────────────────────────────────────────────────────

export async function getNotesForVerse(
  passageRef: string,
): Promise<ActionResult<CompanionNote[]>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to view notes." };
  if (!PASSAGE_REF_RE.test(passageRef)) return { success: false, error: "Invalid passage reference." };

  const { data, error } = await supabase
    .from("companion_notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("passage_ref", passageRef)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: "Could not load notes." };
  return { success: true, data: (data ?? []) as CompanionNote[] };
}

export async function generateStudyInsight(
  passageRef: string,
  verseText: string,
): Promise<ActionResult<string>> {
  const { user } = await getAuthUser();
  if (!user) return { success: false, error: "Sign in to use study insights." };
  if (!PASSAGE_REF_RE.test(passageRef)) return { success: false, error: "Invalid passage reference." };

  const client = getAnthropicClient();
  if (!client) return { success: false, error: "ai_unavailable" };

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      messages: [
        {
          role: "user",
          content: `You are a Bible study companion. Provide a brief study note for this verse.

Verse: ${passageRef}
Text: "${verseText}"

Provide:
1. Historical/cultural context (1-2 sentences)
2. Key theological point (1-2 sentences)
3. Practical application (1 sentence)

Keep the response under 150 words. Serve the text, never replace it.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return { success: true, data: text };
  } catch {
    return { success: false, error: "Could not generate insight." };
  }
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
