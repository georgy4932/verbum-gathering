import Link from "next/link";
import { liveRooms, todayDevotion, fellowshipRooms } from "@/lib/verbum-data";

export default function HomePage() {
  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <p style={{ opacity: 0.6, marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Daily devotion · Fellowship · Bible study · Worship
        </p>

        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", marginBottom: 16 }}>
          Don't just scroll.<br />Gather.
        </h1>

        <p style={{ maxWidth: 760, opacity: 0.75, lineHeight: 1.7, marginBottom: 32 }}>
          A Christian space for daily encounter, shared prayer, Bible study, and live worship.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 64 }}>
          <Link href="/live" style={{ display: "inline-flex", alignItems: "center", padding: "0.8rem 1.4rem", borderRadius: 999, background: "#5ea773", color: "#fff", fontWeight: 600, fontSize: 14 }}>
            Enter Live
          </Link>
          <Link href="/today" style={{ display: "inline-flex", alignItems: "center", padding: "0.8rem 1.4rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
            Today's Devotion
          </Link>
        </div>

        <h2 style={{ fontSize: "1.4rem", marginBottom: 20, opacity: 0.9 }}>Live now</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 48 }}>
          {liveRooms.map((room) => (
            <Link href={`/live/${room.slug}`} key={room.slug} style={{ display: "block", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20, background: "rgba(255,255,255,0.03)", textDecoration: "none" }}>
              <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{room.timeLabel}</p>
              <h3 style={{ fontSize: "1.1rem", marginBottom: 8 }}>{room.title}</h3>
              <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>{room.description}</p>
            </Link>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, background: "rgba(255,255,255,0.03)" }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>Today's devotion</h2>
            <p style={{ fontStyle: "italic", opacity: 0.8, lineHeight: 1.7, marginBottom: 16, fontSize: 15 }}>{todayDevotion.scripture}</p>
            <Link href="/today" style={{ color: "#d5b46a", fontSize: 13 }}>Open devotion →</Link>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, background: "rgba(255,255,255,0.03)" }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>Fellowship rooms</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {fellowshipRooms.slice(0, 3).map((r) => (
                <div key={r.slug} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.75 }}>
                  <span>{r.name}</span>
                  <span style={{ color: "#5ea773" }}>{r.membersLabel}</span>
                </div>
              ))}
            </div>
            <Link href="/rooms" style={{ color: "#d5b46a", fontSize: 13 }}>Explore rooms →</Link>
          </div>
        </div>

      </div>
    </main>
  );
}
