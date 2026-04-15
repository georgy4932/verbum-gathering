import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const {
      roomSlug,
      focusText,
      pinnedScripture,
      pinnedPrayer,
      closingText,
      isClosing,
    } = await request.json();

    if (!roomSlug) {
      return Response.json({ error: "roomSlug is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const [{ data: moderator }, { data: hostProfile }] = await Promise.all([
      supabase
        .from("room_moderators")
        .select("room_slug")
        .eq("room_slug", roomSlug)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("host_profiles")
        .select("is_host")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    const isAllowed = Boolean(moderator) || Boolean(hostProfile?.is_host);

    if (!isAllowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = {
      room_slug: roomSlug,
      focus_text: focusText?.trim() || null,
      pinned_scripture: pinnedScripture?.trim() || null,
      pinned_prayer: pinnedPrayer?.trim() || null,
      closing_text: closingText?.trim() || null,
      is_closing: Boolean(isClosing),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("room_guidance").upsert(payload, {
      onConflict: "room_slug",
    });

    if (error) {
      return Response.json({ error: "Unable to save guidance" }, { status: 500 });
    }

    return Response.json({ ok: true, guidance: payload });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
