import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (!profile?.display_name) {
      return Response.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    const since = new Date(Date.now() - 30_000).toISOString();

    const { count } = await supabase
      .from("prayer_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);

    if ((count ?? 0) >= 1) {
      return Response.json(
        { error: "Please wait a few moments before posting again." },
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

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
