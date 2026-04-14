import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { roomSlug, message } = await request.json();

    if (!roomSlug || !message?.trim()) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    const { data: ban } = await supabase
      .from("room_bans")
      .select("reason, banned_until")
      .eq("room_slug", roomSlug)
      .eq("user_id", user.id)
      .or(`banned_until.is.null,banned_until.gt.${nowIso}`)
      .maybeSingle();

    if (ban) {
      return Response.json(
        { error: ban.reason ? `You cannot post in this room right now: ${ban.reason}` : "You cannot post in this room right now." },
        { status: 403 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (!profile?.display_name) {
      return Response.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    const { data: cooldown } = await supabase
      .from("user_cooldowns")
      .select("expires_at")
      .eq("user_id", user.id)
      .eq("room_slug", roomSlug)
      .eq("action_type", "prayer_post")
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (cooldown) {
      return Response.json(
        { error: "Please wait a little before posting again." },
        { status: 429 }
      );
    }

    const { error } = await supabase.from("prayer_posts").insert({
      room_slug: roomSlug,
      user_id: user.id,
      author_name: profile.display_name,
      message: message.trim(),
    });

    if (error) {
      return Response.json({ error: "Unable to share prayer" }, { status: 500 });
    }

    await supabaseAdmin.from("user_cooldowns").upsert(
      {
        user_id: user.id,
        room_slug: roomSlug,
        action_type: "prayer_post",
        expires_at: new Date(Date.now() + 30_000).toISOString(),
      },
      {
        onConflict: "user_id,room_slug,action_type",
      }
    );

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
