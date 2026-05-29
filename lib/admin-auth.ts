import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Call at the top of every admin page and inside every admin server action.
 * Returns the authenticated admin user id or redirects — never throws.
 *
 * Calling it twice (once at page level, once inside the action) is intentional:
 * the page-level call provides the redirect UX; the action-level call is the
 * actual security boundary. Neither alone is sufficient.
 */
export async function requirePlatformAdmin(): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) redirect("/");

  return { id: user.id };
}
