import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function GatheringPage() {
  const { data: liveRooms } = await supabase
    .from("live_rooms")
    .select("slug, title, is_live, time_label")
    .order("is_live", { ascending: false })
    .limit(3);

  const { data: fellowshipRooms } = await supabase
    .from("fellowship_rooms")
    .select("slug, name, members_label")
    .limit(3);

  const liveNow = liveRooms?.filter((r) => r.is_live) ?? [];
  const upcoming = liveRooms?.filter((r) => !r.is_live).slice(0, 1) ?? [];

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Gathering
        </p>

        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", margin: "12px 0", lineHeight: 1.05 }}>
          Gather in prayer, Scripture, and presence.
        </h1>

        <p style={{ maxWidth: 720, opacity: 0.75, lineHeight: 1.7, marginBottom: 40 }}>
          Prayer, Scripture, and shared presence with others — in real time or quiet spaces.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>

          <Link href="/live" style={{
            ...cardStyle,
            border: "1px solid rgba(134,239,172,0.25)",
            background: "rgba(134,239,172,0.04)",
          }}>
            <small style={{ ...labelStyle, color: "#86efac" }}>Live now</small>
            <h2 style={titleStyle}>Join a live gathering</h2>
            <p style={descStyle}>
              Enter a guided space for prayer, worship, or study happening now.
            </p>
            <span style={ctaStyle}>Enter gathering →</span>
          </Link>

          <Link href="/gathering/studies" style={cardStyle}>
            <small style={labelStyle}>Guided</small>
            <h2 style={titleStyle}>Join a Bible study</h2>
            <p style={descStyle}>
              Follow structured studies led by pastors and teachers. Return regularly and grow deeper in Scripture.
            </p>
            <span style={ctaStyle}>View studies →</span>
          </Link>

          <Link href="/rooms" style={{
            ...cardStyle,
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.015)",
          }}>
            <small style={labelStyle}>Open spaces</small>
            <h2 style={titleStyle}>Enter a fellowship space</h2>
            <p style={descStyle}>
              Quiet, ongoing spaces for prayer, testimony, and encouragement. Come quietly. Remain as long as you need.
            </p>
            <span style={ctaStyle}>Enter space →</span>
          </Link>

        </div>

        {(liveNow.length > 0 || upcoming.length > 0 || (fellowshipRooms?.length ?? 0) > 0) && (
          <div style={{
            padding: "18px 20px",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.015)",
            display: "grid",
            gap: 10,
            marginBottom: 32,
          }}>
            {liveNow.map((room) => (
              <p key={room.slug} style={{ margin: 0, opacity: 0.8 }}>
                <span style={{ color: "#86efac", marginRight: 8 }}>•</span>
                {room.title} is live now
              </p>
            ))}
            {upcoming.map((room) => (
              <p key={room.slug} style={{ margin: 0, opacity: 0.8 }}>
                <span style={{ opacity: 0.5, marginRight: 8 }}>•</span>
                {room.title} — {room.time_label}
              </p>
            ))}
            {fellowshipRooms?.slice(0, 1).map((room) => (
              <p key={room.slug} style={{ margin: 0, opacity: 0.8 }}>
                <span style={{ opacity: 0.5, marginRight: 8 }}>•</span>
                {room.members_label} in the {room.name}
              </p>
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", opacity: 0.45, fontSize: "0.9rem" }}>
          You can enter any space quietly. There is no pressure to speak.
        </p>

      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 24,
  background: "rgba(255,255,255,0.03)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  textDecoration: "none",
  color: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  margin: 0,
};

const descStyle: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 14,
  lineHeight: 1.7,
  margin: 0,
};

const ctaStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  opacity: 0.8,
};
