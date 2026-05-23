'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanDay {
  day: number;
  passages: string[];
}

export interface ReadingPlan {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  total_days: number;
  passages: PlanDay[];
  is_public: boolean;
  created_at: string;
}

export interface UserPlanProgress {
  id: string;
  user_id: string;
  plan_id: string;
  current_day: number;
  completed_days: number[];
  started_at: string;
  last_read_at: string | null;
}

export interface ActivePlan extends UserPlanProgress {
  plan: ReadingPlan;
}

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getPublicPlans(): Promise<Omit<ReadingPlan, 'passages'>[]> {
  const { supabase } = await getAuthUser();
  const { data } = await supabase
    .from('reading_plans')
    .select('id, slug, title, description, total_days, is_public, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: true });
  return (data ?? []) as Omit<ReadingPlan, 'passages'>[];
}

export async function getPlanWithProgress(
  planId: string,
): Promise<{ plan: ReadingPlan | null; progress: UserPlanProgress | null }> {
  const { supabase, user } = await getAuthUser();

  const { data: plan } = await supabase
    .from('reading_plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle();

  if (!plan) return { plan: null, progress: null };

  if (!user) return { plan: plan as ReadingPlan, progress: null };

  const { data: progress } = await supabase
    .from('user_reading_plan_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_id', planId)
    .maybeSingle();

  return {
    plan: plan as ReadingPlan,
    progress: progress as UserPlanProgress | null,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function startReadingPlan(planId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: 'Sign in to start a reading plan.' };

  const { error } = await supabase
    .from('user_reading_plan_progress')
    .insert({ user_id: user.id, plan_id: planId });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'already_enrolled' };
    return { success: false, error: 'Could not start plan.' };
  }

  revalidatePath('/companion');
  revalidatePath('/companion/plans');
  return { success: true };
}

export async function markDayComplete(
  planId: string,
  day: number,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: 'Sign in to track progress.' };

  const { data: progress, error: fetchErr } = await supabase
    .from('user_reading_plan_progress')
    .select('current_day, completed_days, plan:reading_plans(total_days)')
    .eq('user_id', user.id)
    .eq('plan_id', planId)
    .single();

  if (fetchErr || !progress) return { success: false, error: 'Progress not found.' };

  const completedDays = progress.completed_days as number[];
  const totalDays = (progress.plan as unknown as { total_days: number }).total_days;
  const currentDay = progress.current_day as number;

  const newCompleted = completedDays.includes(day)
    ? completedDays
    : [...completedDays, day];
  const newCurrentDay =
    day === currentDay && currentDay < totalDays ? currentDay + 1 : currentDay;

  const { error } = await supabase
    .from('user_reading_plan_progress')
    .update({
      completed_days: newCompleted,
      current_day: newCurrentDay,
      last_read_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('plan_id', planId);

  if (error) return { success: false, error: 'Could not update progress.' };

  revalidatePath('/companion');
  revalidatePath(`/companion/plans/${planId}`);
  return { success: true };
}

export async function jumpToPlanDay(
  planId: string,
  day: number,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const { error } = await supabase
    .from('user_reading_plan_progress')
    .update({ current_day: day })
    .eq('user_id', user.id)
    .eq('plan_id', planId);

  if (error) return { success: false, error: 'Could not update day.' };

  revalidatePath(`/companion/plans/${planId}`);
  return { success: true };
}

export async function leavePlan(planId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const { error } = await supabase
    .from('user_reading_plan_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('plan_id', planId);

  if (error) return { success: false, error: 'Could not leave plan.' };

  revalidatePath('/companion');
  revalidatePath('/companion/plans');
  return { success: true };
}
