import Link from "next/link";
import { supabase } from "@/lib/supabase";
export const dynamic = "force-dynamic";

type LiveRoom = {
  slug: string;
  title: string;
  description: string;
  status: "live" | "soon" | "scheduled";
  time_label: string;
  host: string;
  kind: "prayer" | "worship" | "study";
};

function badgeStyles(status: LiveRoom["status"]) {
  if (status === "live") {
    return {
      color: "#86efac",
      border: "1px solid rgba(134,239,172,0.35)",
      background: "rgba(134,239,172,0.08)",
    };
  }
  if (status === "soon") {
    return {
      color: "#fcd34d",
      border: "1px solid rgba(252,211,77,0.35)",
      background: "rgba(252,211,77,0.08)",
    };
  }
  return {
    color: "#cbd5e1",
    border: "1px solid rgba(203,213,225,0.22)",
    background: "rgba(203,213,225,0.06)",
  };
}

export default async function LivePage() {
  const { data, error } = await supabase
    .from("live_rooms")
    .select("slug, title, description, status, time_label, host, kind")
    .order("sort_order", { ascending: true });

  const rooms = data ?? [];

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <p style={{ opacity: 0.6, marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Live
        </p>

        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", marginBottom: 16, lineHeight: 1.05 }}>
          Gather live
        </h1>

        <p style={{ maxWidth: 760, opacity: 0.75, lineHeight: 1.7, marginBottom: 40 }}>
          Prayer, worship, and study happening in real time. Enter a room and join what God is doing now.
        </p>

        {error ? <p style={{ color: "#f87171" }}>Unable to load live rooms.</p> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {rooms.map((room) => {
            const badge = badgeStyles(room.status);
            const isLive = room.status === "live";

            return (
              <article
                key={room.slug}
                style={{
                  borderRadius: 24, padding: 24,
                  display: "flex", flexDirection: "column",
                  border: isLive ? "1px solid rgba(134,239,172,0.2)" : "1px solid rgba(255,255,255,0.08)",
                  background: isLive ? "linear-gradient(160deg, rgba(94,167,115,0.08) 0%, rgba(255,255,255,0.02) 100%)" : "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "0.35rem 0.7rem", borderRadius: 999,
                  fontSize: 13, marginBottom: 16, width: "fit-content",
                  color: badge.color, border: badge.border, background: badge.background,
                }}>
                  {isLive && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#86efac", display: "inline-block", animation: "pulse 2s ease infinite" }} />
                  )}
                  {room.time_label}
                </div>

                <h2 style={{ fontSize: "1.35rem", marginBottom: 10 }}>{room.title}</h2>
                <p style={{ opacity: 0.8, lineHeight: 1.7, marginBottom: 10 }}>{room.description}</p>
                <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 24 }}>Hosted by {room.host}</p>

                {isLive ? (
                  <Link href={`/live/${room.slug}`} style={{ display: "inline-block", padding: "0.9rem 1.4rem", borderRadius: 999, background: "#5ea773", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none", marginTop: "auto", textAlign: "center" }}>
                    Enter room →
                  </Link>
                ) : (
                  <span style={{ display: "inline-block", padding: "0.9rem 1.4rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: "auto", textAlign: "center" }}>
                    {room.time_label}
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.75); }
        }
      `}</style>
    </main>
  );
}
