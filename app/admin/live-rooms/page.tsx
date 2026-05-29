import { requirePlatformAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLiveRoomsPage() {
  await requirePlatformAdmin();

  // gathering_live_sessions replaces the old live_rooms table.
  const supabase = await createSupabaseServerClient();
  const { data: sessions } = await supabase
    .from("gathering_live_sessions")
    .select("id, gathering_id, title, scheduled_at, is_cancelled, stream_url")
    .order("scheduled_at", { ascending: false })
    .limit(50);

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12, margin: 0 }}>
          Admin
        </p>
        <h1 style={{ margin: "8px 0 32px" }}>Live sessions</h1>

        {(sessions ?? []).length === 0 ? (
          <p style={{ opacity: 0.5 }}>No live sessions scheduled.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {(sessions ?? []).map((s) => (
              <article
                key={s.id}
                style={{
                  padding: 20,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <h2 style={{ margin: "0 0 8px" }}>{s.title ?? "Untitled session"}</h2>
                <p style={{ margin: "0 0 4px", opacity: 0.6, fontSize: 13 }}>
                  {s.scheduled_at
                    ? new Date(s.scheduled_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Not scheduled"}
                </p>
                <p style={{ margin: 0, opacity: 0.5, fontSize: 12 }}>
                  {s.is_cancelled ? "Cancelled" : "Scheduled"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
