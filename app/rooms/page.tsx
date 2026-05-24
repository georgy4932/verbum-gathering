import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import FellowshipRoomPresenceBadge from "@/components/fellowship-room-presence-badge";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("fellowship_rooms")
    .select("slug, name, description")
    .order("sort_order", { ascending: true });

  const rooms = data ?? [];

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <p style={{
          color: "var(--stone)", marginBottom: 12,
          letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12,
        }}>
          Fellowship
        </p>

        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", marginBottom: 16, lineHeight: 1.05 }}>
          Fellowship spaces
        </h1>

        <p style={{ maxWidth: 760, color: "var(--muted)", lineHeight: 1.7, marginBottom: 40 }}>
          Join believers for encouragement, testimony, prayer, and shared growth in the Word.
        </p>

        {error ? (
          <p style={{ color: "var(--live)", fontSize: 13 }}>Unable to load fellowship spaces.</p>
        ) : null}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {rooms.map((room) => (
            <article
              key={room.slug}
              style={{
                border: "1px solid var(--faint)",
                borderRadius: 24,
                padding: 24,
                background: "var(--card-surface)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <FellowshipRoomPresenceBadge roomSlug={room.slug} />

              <h2 style={{ fontSize: "1.3rem", margin: 0, lineHeight: 1.2, color: "var(--cream)" }}>
                {room.name}
              </h2>

              <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 14, margin: 0, flex: 1 }}>
                {room.description}
              </p>

              <Link
                href={`/rooms/${room.slug}`}
                style={{
                  marginTop: 4,
                  padding: "0.75rem 1rem",
                  borderRadius: 999,
                  border: "1px solid var(--faint2)",
                  background: "transparent",
                  color: "var(--muted)",
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
