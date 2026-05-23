'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface StudyNote {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  passage_ref: string | null;
  book: string | null;
  chapter: number | null;
  verse_start: number | null;
  verse_end: number | null;
  note_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateInput {
  title?: string | null;
  content: string;           // required — DB enforces btrim(content) >= 1 char
  passage_ref?: string | null;
  note_date?: string | null;
}

interface UpdateInput {
  title?: string | null;
  content?: string;
  passage_ref?: string | null;
  note_date?: string | null;
}

export async function createStudyNote(
  input: CreateInput
): Promise<ActionResult<StudyNote>> {
  if (!input.content.trim()) {
    return { success: false, error: 'Content cannot be empty.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('study_notes')
    .insert({
      user_id:     user.id,
      title:       input.title?.trim() || null,
      content:     input.content,
      passage_ref: input.passage_ref?.trim() || null,
      note_date:   input.note_date ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/companion/notes');
  return { success: true, data: data as StudyNote };
}

export async function updateStudyNote(
  id: string,
  input: UpdateInput
): Promise<ActionResult<StudyNote>> {
  // If content is provided it must be non-empty after trimming
  if (input.content !== undefined && !input.content.trim()) {
    return { success: false, error: 'Content cannot be empty.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const patch: Record<string, unknown> = {};
  if (input.title       !== undefined) patch.title       = input.title?.trim() || null;
  if (input.content     !== undefined) patch.content     = input.content;
  if (input.passage_ref !== undefined) patch.passage_ref = input.passage_ref?.trim() || null;
  if (input.note_date   !== undefined) patch.note_date   = input.note_date || null;

  const { data, error } = await supabase
    .from('study_notes')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/companion/notes');
  revalidatePath(`/companion/notes/${id}`);
  return { success: true, data: data as StudyNote };
}

export async function deleteStudyNote(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('study_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/companion/notes');
  return { success: true };
}

export async function getRecentStudyNotes(limit = 50): Promise<StudyNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('study_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as StudyNote[];
}

export async function getStudyNote(id: string): Promise<StudyNote | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('study_notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  return (data ?? null) as StudyNote | null;
}

export async function getStudyNotesForPassage(
  passageRef: string
): Promise<StudyNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('study_notes')
    .select('*')
    .eq('user_id', user.id)
    .ilike('passage_ref', `%${passageRef}%`)
    .order('updated_at', { ascending: false })
    .limit(20);

  return (data ?? []) as StudyNote[];
}
