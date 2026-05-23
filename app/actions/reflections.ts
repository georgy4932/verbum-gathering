'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserReflection {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_day: number | null;
  passage_ref: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Queries ────────────────────────────────────────────────────────────────────

/** All reflections for one plan, ordered by day — used to build dot indicators. */
export async function getReflectionsForPlan(
  planId: string,
): Promise<UserReflection[]> {
  const { supabase, user } = await getAuthUser();
  if (!user) return [];

  const { data } = await supabase
    .from('user_reflections')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_id', planId)
    .order('plan_day', { ascending: true });

  return (data ?? []) as UserReflection[];
}

/** Single reflection for a specific plan day — used on the Today card. */
export async function getReflectionForPlanDay(
  planId: string,
  day: number,
): Promise<UserReflection | null> {
  const { supabase, user } = await getAuthUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_reflections')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_id', planId)
    .eq('plan_day', day)
    .maybeSingle();

  return data as UserReflection | null;
}

/** Most recent reflections across all plans — used on the Companion hub. */
export async function getRecentReflections(
  limit = 5,
): Promise<UserReflection[]> {
  const { supabase, user } = await getAuthUser();
  if (!user) return [];

  const { data } = await supabase
    .from('user_reflections')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as UserReflection[];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Create or update a plan-day reflection.
 * The UNIQUE (user_id, plan_id, plan_day) constraint ensures one entry per day.
 */
export async function upsertReflection({
  planId,
  planDay,
  passageRef,
  content,
}: {
  planId: string;
  planDay: number;
  passageRef?: string | null;
  content: string;
}): Promise<ActionResult<UserReflection>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: 'Sign in to save a reflection.' };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: 'Reflection cannot be empty.' };
  if (trimmed.length > 5000) return { success: false, error: 'Reflection too long (max 5 000 characters).' };

  const { data, error } = await supabase
    .from('user_reflections')
    .upsert(
      {
        user_id: user.id,
        plan_id: planId,
        plan_day: planDay,
        passage_ref: passageRef ?? null,
        content: trimmed,
      },
      { onConflict: 'user_id,plan_id,plan_day' },
    )
    .select()
    .single();

  if (error) return { success: false, error: 'Could not save reflection.' };

  revalidatePath(`/companion/plans/${planId}`);
  revalidatePath('/companion');
  return { success: true, data: data as UserReflection };
}

export async function deleteReflection(
  reflectionId: string,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const { error } = await supabase
    .from('user_reflections')
    .delete()
    .eq('id', reflectionId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'Could not delete reflection.' };

  revalidatePath('/companion');
  return { success: true };
}
