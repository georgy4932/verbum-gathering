import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminInsightsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("host_profiles")
    .select("is_host")
    .eq("id", user.id)
    .single();

  if (!profile?.is_host) {
    redirect("/");
  }

  const [{ data: sessions }, { data: hiddenPosts }, { data: bans }] = await Promise.all([
    supabase
      .from("room_sessions")
      .select("room_slug, started_at, ended_at, peak_attendance, joins_count, leaves_count")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("moderated_prayer_posts")
      .select("room_slug, action, created_at")
      .eq("action", "hidden")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("room_bans")
      .select("room_slug, reason, banned_until, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 }}>
        <h1>Ministry insights</h1>

        <section>
          <h2>Recent sessions</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {(sessions ?? []).map((s, i) => (
              <div key={i} style={{ padding: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
                <strong>{s.room_slug}</strong>
                <div>Peak attendance: {s.peak_attendance}</div>
                <div>Joins: {s.joins_count}</div>
                <div>Leaves: {s.leaves_count}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Recent hidden prayer posts</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {(hiddenPosts ?? []).map((p, i) => (
              <div key={i} style={{ padding: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
                <strong>{p.room_slug}</strong>
                <div>{p.action}</div>
                <div>{new Date(p.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Recent bans</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {(bans ?? []).map((b, i) => (
              <div key={i} style={{ padding: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
                <strong>{b.room_slug}</strong>
                <div>{b.reason ?? "No reason provided"}</div>
                <div>{b.banned_until ? new Date(b.banned_until).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "No expiry"}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
