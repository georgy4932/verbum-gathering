import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function HomeLiveNow() {
  const { data: rooms } = await supabase
    .from("live_rooms")
    .select("slug, title, description")
    .eq("is_live", true)
    .order("starts_at", { ascending: true })
    .limit(3);

  if (!rooms || rooms.length === 0) {
    return null;
  }

  return (
    <section style={{ padding: "3rem 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "calc(100% - 2rem)" }}>
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              opacity: 0.7,
              marginBottom: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Live now
          </p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", marginBottom: 12 }}>
            Join the gathering
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {rooms.map((room) => (
            <Link
              key={room.slug}
              href={`/live/${room.slug}`}
              style={{
                display: "block",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: 20,
                background: "rgba(255,255,255,0.03)",
                textDecoration: "none",
              }}
            >
              <p style={{ opacity: 0.65, marginBottom: 10 }}>Live now</p>
              <h3 style={{ fontSize: "1.15rem", marginBottom: 10 }}>{room.title}</h3>
              <p style={{ opacity: 0.8, lineHeight: 1.6 }}>{room.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
