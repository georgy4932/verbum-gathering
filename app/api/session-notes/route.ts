import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { roomSlug, sessionStartedAt, summary, keyScripture, closingPrayer } =
      await request.json();

    if (!roomSlug || !summary?.trim()) {
      return Response.json(
        { error: "roomSlug and summary are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data: moderator } = await supabase
      .from("room_moderators")
      .select("room_slug")
      .eq("room_slug", roomSlug)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: hostProfile } = await supabase
      .from("host_profiles")
      .select("is_host")
      .eq("id", user.id)
      .maybeSingle();

    const isAllowed = Boolean(moderator) || Boolean(hostProfile?.is_host);

    if (!isAllowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("room_session_notes").insert({
      room_slug: roomSlug,
      session_started_at: sessionStartedAt || null,
      summary: summary.trim(),
      key_scripture: keyScripture?.trim() || null,
      closing_prayer: closingPrayer?.trim() || null,
      created_by: user.id,
    });

    if (error) {
      return Response.json(
        { error: "Unable to save session note" },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
