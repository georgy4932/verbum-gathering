import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUserProfile } from "@/lib/profile";
import HomeLiveNow from "@/components/home-live-now";
import FellowshipRoomPresenceBadge from "@/components/fellowship-room-presence-badge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (user && !profile) {
    redirect("/onboarding");
  }

  const [{ data: devotion }, { data: fellowshipRooms }] = await Promise.all([
    supabase
      .from("devotions")
      .select("title, scripture")
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("fellowship_rooms")
      .select("slug, name")
      .order("sort_order")
      .limit(3),
  ]);

  return (
    <main>

      {/* Hero */}
      <section style={{ padding: "5rem 1.25rem 3.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: 700, height: 700,
          background: "radial-gradient(ellipse, rgba(200,169,106,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
          <span className="eyebrow">The Word, with you</span>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.05, marginBottom: 20 }}>
            Come and be still.
          </h1>
          <p style={{ color: "var(--stone)", fontSize: "1.1rem", lineHeight: 1.8, maxWidth: 560, marginBottom: 36 }}>
            One quiet place for Scripture, prayer, teaching, and worship.
            Not to scroll — but to remain with the Word.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/companion" className="button primary">
              Open Scripture
            </Link>
            <Link href="/gathering" className="button secondary">
              Enter gathering
            </Link>
          </div>

          {!user && (
            <div style={{
              marginTop: 36, padding: "18px 22px", borderRadius: 16,
              border: "1px solid var(--faint)", background: "rgba(255,255,255,0.02)",
              maxWidth: 520,
            }}>
              <p style={{ margin: "0 0 10px", color: "var(--stone)", lineHeight: 1.7, fontSize: 14 }}>
                To read with notes, join gatherings, and carry Scripture with you — sign in quietly.
              </p>
              <Link href="/auth/signin" className="text-link">
                Sign in →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Four Movements */}
      <section style={{ padding: "2.5rem 1.25rem 3rem", borderTop: "1px solid var(--faint)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <span className="eyebrow">Four movements</span>
            <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", marginBottom: 8 }}>
              One coherent life of faith
            </h2>
            <p style={{ color: "var(--stone)", fontSize: 14, lineHeight: 1.75, maxWidth: 560 }}>
              Scripture at the center. Every movement ordered around the Word — not content, not creators, not engagement.
            </p>
          </div>

          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>

            <Link href="/companion" className="movement-card companion">
              <span className="movement-label">Companion</span>
              <h2>The Word interpreted</h2>
              <p>Read Scripture. Reflect. Ask questions. Study with an intelligent companion that serves the text — and never replaces it.</p>
              <span className="enter">Open a passage →</span>
            </Link>

            <Link href="/gathering" className="movement-card gathering">
              <span className="movement-label">Gathering</span>
              <h2>The Word shared</h2>
              <p>Prayer rooms, Bible studies, live gatherings, and fellowship spaces ordered around Scripture and guided presence.</p>
              <span className="enter">Enter gathering →</span>
            </Link>

            <Link href="/studio" className="movement-card studio">
              <span className="movement-label">Studio</span>
              <h2>The Word proclaimed</h2>
              <p>Sermons, devotions, and teachings rooted in Scripture — from receiving truth to proclaiming it.</p>
              <span className="enter">Listen →</span>
            </Link>

            <Link href="/worship" className="movement-card worship">
              <span className="movement-label">Worship</span>
              <h2>The Word embodied</h2>
              <p>Music, liturgy, silence, and sacred practice. Truth becomes devotion and rhythm, not just information.</p>
              <span className="enter">Enter worship →</span>
            </Link>

          </div>
        </div>
      </section>

      {/* Live Now */}
      <section style={{ padding: "2.5rem 1.25rem 3rem", borderTop: "1px solid var(--faint)", background: "var(--bg1)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span className="eyebrow">Live now</span>
          <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", marginBottom: 24 }}>
            A gathering is happening
          </h2>
          <HomeLiveNow />
        </div>
      </section>

      {/* Today + Fellowship */}
      <section style={{ padding: "2.5rem 1.25rem 4rem", borderTop: "1px solid var(--faint)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

          {devotion && (
            <div className="card" style={{ borderRadius: 20 }}>
              <span className="label">Today's devotion</span>
              <h3>{devotion.title}</h3>
              <div className="scripture-block" style={{ marginTop: 4 }}>
                <p className="text">{devotion.scripture}</p>
              </div>
              <Link href="/today" className="text-link" style={{ marginTop: 8 }}>
                Open today's devotion →
              </Link>
            </div>
          )}

          <div className="card" style={{ borderRadius: 20 }}>
            <span className="label">Fellowship spaces</span>
            <h3>Gathering spaces</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {(fellowshipRooms ?? []).map((r) => (
                <div key={r.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{r.name}</span>
                  <FellowshipRoomPresenceBadge roomSlug={r.slug} />
                </div>
              ))}
            </div>
            <Link href="/rooms" className="text-link" style={{ marginTop: "auto" }}>
              Enter a space →
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}
