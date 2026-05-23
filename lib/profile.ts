import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getCurrentUserProfile() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, display_name, username, bio, avatar_url, is_public, preferred_bible_version, show_red_letter')
    .eq('id', user.id)
    .maybeSingle();

  return { user, profile };
}
