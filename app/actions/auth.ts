'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Username availability ────────────────────────────────────────────

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!username || !/^[a-z0-9_-]{3,20}$/.test(username)) return false;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  return data === null;
}

// ── Profile update ───────────────────────────────────────────────────

export async function updateProfile(data: {
  display_name?: string;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  is_public?: boolean;
}): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { success: false, error: 'Not signed in.' };

  // Validate username if provided
  if (data.username !== undefined && data.username !== null) {
    if (!/^[a-z0-9_-]{3,20}$/.test(data.username)) {
      return { success: false, error: 'Username must be 3–20 characters: lowercase letters, numbers, _ or -.' };
    }
    // Check uniqueness (excluding self)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', data.username)
      .neq('id', user.id)
      .maybeSingle();
    if (existing) return { success: false, error: 'That username is already taken.' };
  }

  if (data.display_name !== undefined && data.display_name !== null) {
    const trimmed = data.display_name.trim();
    if (trimmed.length < 1) return { success: false, error: 'Display name is required.' };
    if (trimmed.length > 60) return { success: false, error: 'Display name must be 60 characters or fewer.' };
    data.display_name = trimmed;
  }

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id);

  if (error) return { success: false, error: 'Could not save profile.' };

  revalidatePath('/settings/profile');
  return { success: true };
}

// ── Sign out ─────────────────────────────────────────────────────────

export async function signOutAction(): Promise<ActionResult> {
  const { supabase } = await getAuthUser();
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  return { success: true };
}
