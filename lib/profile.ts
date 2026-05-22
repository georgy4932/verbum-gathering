import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUserProfile() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, bio, preferred_bible_version")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}
