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
      <section style={{ padding: "5rem 1.25rem 3rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            A quiet place to gather
          </p>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.1, marginBottom: 20 }}>
            Come and be still.
          </h1>
          <p style={{ opacity: 0.8, fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 600, marginBottom: 32 }}>
            Join others in prayer, Scripture, and worship.
            Not to scroll — but to remain.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/gathering" style={{ display: "inline-flex", alignItems: "center", padding: "13px 26px", borderRadius: 9, background: "#c8a96a", color: "#0f0d0a", fontWeight: 600, fontSize: 13 }}>
              Enter gathering
            </Link>
            <Link href="/today" style={{ display: "inline-flex", alignItems: "center", padding: "13px 26px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              Today's Devotion
            </Link>
          </div>

          {!user ? (
            <div style={{ marginTop: 32, padding: "18px 22px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", maxWidth: 560 }}>
              <p style={{ margin: "0 0 10px", opacity: 0.82, lineHeight: 1.7 }}>
                To share prayers, enter live gatherings, and participate in fellowship spaces, you'll need to sign in.
              </p>
              <Link href="/sign-in" style={{ color: "#c8a96a", fontSize: 13, fontWeight: 500 }}>
                Sign in quietly →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section style={{ padding: "2rem 1.25rem 3rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Live now
          </p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", marginBottom: 24 }}>
            A gathering is happening
          </h2>
          <HomeLiveNow />
        </div>
      </section>

      <section style={{ padding: "2rem 1.25rem 4rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, background: "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase", color: "#6b5530" }}>
              Today
            </p>
            <h3 style={{ fontSize: "1.3rem", margin: 0 }}>
              {devotion?.title}
            </h3>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", opacity: 0.75, lineHeight: 1.75, fontSize: 15, borderLeft: "2px solid #6b5530", paddingLeft: 14 }}>
              {devotion?.scripture}
            </p>
            <Link href="/today" style={{ color: "#c8a96a", fontSize: 13, fontWeight: 500, marginTop: "auto" }}>
              Open today's devotion →
            </Link>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, background: "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase", color: "#6b5530" }}>
              Gathering spaces
            </p>
            <h3 style={{ fontSize: "1.3rem", margin: 0 }}>
              Fellowship
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(fellowshipRooms ?? []).map((r) => (
                <div key={r.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ opacity: 0.8 }}>{r.name}</span>
                  <FellowshipRoomPresenceBadge roomSlug={r.slug} />
                </div>
              ))}
            </div>
            <Link href="/rooms" style={{ color: "#c8a96a", fontSize: 13, fontWeight: 500, marginTop: "auto" }}>
              Explore spaces →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
