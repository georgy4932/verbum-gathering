import { requirePlatformAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage() {
  await requirePlatformAdmin();

  // gathering_events replaces the old room_sessions / room_bans tables.
  // These queries will expand as the governance schema matures.
  const supabase = await createSupabaseServerClient();
  const { data: recentEvents } = await supabase
    .from("gathering_events")
    .select("event_type, user_id, gathering_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 }}>
        <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12, margin: 0 }}>
          Admin
        </p>
        <h1 style={{ margin: 0 }}>Platform insights</h1>

        <section>
          <h2>Recent gathering events</h2>
          {(recentEvents ?? []).length === 0 ? (
            <p style={{ opacity: 0.5 }}>No events recorded yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {(recentEvents ?? []).map((e, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: "monospace", fontSize: 13 }}>{e.event_type}</span>
                  <span style={{ opacity: 0.4, fontSize: 12 }}>
                    {new Date(e.created_at).toLocaleString("en-GB", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
