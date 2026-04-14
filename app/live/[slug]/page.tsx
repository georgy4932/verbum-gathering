import Link from "next/link";
import { notFound } from "next/navigation";
import { liveRooms } from "@/lib/verbum-data";

type PageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return liveRooms.map((r) => ({ slug: r.slug }));
}

export default function LiveRoomPage({ params }: PageProps) {
  const room = liveRooms.find((item) => item.slug === params.slug);
  if (!room) notFound();

  const isLive = room.status === "live";
  const isSoon = room.status === "soon";
  const statusColour = isLive ? "#86efac" : isSoon ? "#fcd34d" : "#cbd5e1";

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        <Link href="/live" style={{ opacity: 0.6, textDecoration: "none", fontSize: 14 }}>
          ← Back to live
        </Link>

        <div style={{
          marginTop: 24, borderRadius: 28, padding: 32,
          border: isLive ? "1px solid rgba(134,239,172,0.2)" : "1px solid rgba(255,255,255,0.08)",
          background: isLive ? "linear-gradient(160deg, rgba(94,167,115,0.07) 0%, rgba(255,255,255,0.02) 100%)" : "rgba(255,255,255,0.03)",
        }}>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "0.35rem 0.8rem", borderRadius: 999,
            fontSize: 13, marginBottom: 20,
            color: statusColour,
            border: `1px solid ${statusColour}40`,
            background: `${statusColour}12`,
          }}>
            {isLive && (
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColour, display: "inline-block", animation: "pulse 2s ease infinite" }} />
            )}
            {room.timeLabel}
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.3rem)", marginBottom: 14, lineHeight: 1.05 }}>
            {room.title}
          </h1>

          <p style={{ opacity: 0.8, lineHeight: 1.8, maxWidth: 680, marginBottom: 24 }}>
            {room.description}
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, opacity: 0.75, marginBottom: 28 }}>
            <span>🎙</span>
            <span>{room.host}</span>
          </div>

          <div style={{
            minHeight: 320, borderRadius: 20,
            border: isLive ? "1px solid rgba(134,239,172,0.15)" : "1px dashed rgba(255,255,255,0.12)",
            background: isLive ? "rgba(94,167,115,0.04)" : "transparent",
            display: "grid", placeItems: "center",
            textAlign: "center", padding: 32,
          }}>
            {isLive ? (
              <div>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(94,167,115,0.12)", border: "1px solid rgba(134,239,172,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>
                  🎙
                </div>
                <p style={{ color: "#86efac", fontWeight: 600, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                  You are in the room
                </p>
                <p style={{ opacity: 0.6, maxWidth: 440, lineHeight: 1.7, fontSize: 14 }}>
                  Live audio, prayer chat, and presence count arrive in Phase 2. For now — be present, pray, and gather.
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "1.1rem", marginBottom: 10, opacity: 0.8 }}>
                  {isSoon ? "This room opens soon." : "This room is not live yet."}
                </p>
                <p style={{ opacity: 0.5, maxWidth: 440, lineHeight: 1.7, fontSize: 14 }}>
                  {room.timeLabel} · Come back when it starts.
                </p>
              </div>
            )}
          </div>

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
