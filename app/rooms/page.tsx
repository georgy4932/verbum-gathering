import Link from "next/link";
import { supabase } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const { data, error } = await supabase
    .from("fellowship_rooms")
    .select("slug, name, description, members_label")
    .order("sort_order", { ascending: true });

  const rooms = data ?? [];

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <p style={{ opacity: 0.6, marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Fellowship
        </p>

        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", marginBottom: 16, lineHeight: 1.05 }}>
          Fellowship spaces
        </h1>

        <p style={{ maxWidth: 760, opacity: 0.75, lineHeight: 1.7, marginBottom: 40 }}>
          Join believers for encouragement, testimony, prayer, and shared growth in the Word.
        </p>

        {error ? <p style={{ color: "#f87171" }}>Unable to load fellowship rooms.</p> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {rooms.map((room) => (
            <article
              key={room.slug}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24, padding: 24,
                background: "rgba(255,255,255,0.03)",
                display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#86efac", fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#86efac", display: "inline-block" }} />
                {room.members_label}
              </div>

              <h2 style={{ fontSize: "1.3rem", margin: 0, lineHeight: 1.2 }}>{room.name}</h2>

              <p style={{ opacity: 0.75, lineHeight: 1.7, fontSize: 14, margin: 0, flex: 1 }}>
                {room.description}
              </p>

              <Link
                href={`/rooms/${room.slug}`}
                style={{
                  marginTop: 4,
                  padding: "0.75rem 1rem",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "block",
                }}
              >
                Enter space
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
