'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  reminders_enabled: boolean;
  reminder_time: string; // HH:MM
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return data as NotificationPreferences | null;
}

function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function upsertNotificationPreferences(
  prefs: Partial<Pick<NotificationPreferences, 'reminders_enabled' | 'reminder_time' | 'timezone'>>
): Promise<ActionResult<NotificationPreferences>> {
  if (prefs.timezone !== undefined && !isValidIANATimezone(prefs.timezone)) {
    return { success: false, error: `"${prefs.timezone}" is not a recognised timezone. Try something like America/Chicago or Europe/London.` };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('user_notification_preferences')
    .upsert(
      { user_id: user.id, ...prefs },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/companion');
  revalidatePath('/companion/settings');
  return { success: true, data: data as NotificationPreferences };
}
