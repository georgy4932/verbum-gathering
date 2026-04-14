import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { prayerPostId, reaction } = await request.json();

    if (!prayerPostId || !["amen", "praying"].includes(reaction)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const { error } = await supabase.from("prayer_reactions").upsert(
      {
        prayer_post_id: prayerPostId,
        user_id: user.id,
        reaction,
      },
      {
        onConflict: "prayer_post_id,user_id,reaction",
      }
    );

    if (error) {
      return Response.json({ error: "Unable to save reaction" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
