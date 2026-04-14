import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { prayerPostId, roomSlug, action, reason } = await request.json();

    if (!prayerPostId || !roomSlug || !action) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
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
      .select("can_moderate_prayers")
      .eq("room_slug", roomSlug)
      .eq("user_id", user.id)
      .single();

    if (!moderator?.can_moderate_prayers) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "hidden") {
      await supabase
        .from("prayer_posts")
        .update({ is_hidden: true, moderation_note: reason ?? null })
        .eq("id", prayerPostId)
        .eq("room_slug", roomSlug);
    }

    if (action === "approved") {
      await supabase
        .from("prayer_posts")
        .update({ is_hidden: false, moderation_note: reason ?? null })
        .eq("id", prayerPostId)
        .eq("room_slug", roomSlug);
    }

    await supabase.from("moderated_prayer_posts").insert({
      prayer_post_id: prayerPostId,
      room_slug: roomSlug,
      moderator_user_id: user.id,
      action,
      reason: reason ?? null,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to moderate prayer post" }, { status: 500 });
  }
}
