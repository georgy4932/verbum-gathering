import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUserProfile } from "@/lib/profile";
import HomeLiveNow from "@/components/home-live-now";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (user && !profile) {
    redirect("/onboarding");
  }

  const [{ data: rooms }, { data: devotion }, { data: fellowshipRooms }] = await Promise.all([
    supabase.from("live_rooms").select("slug, title, description, status, time_label").order("sort_order").limit(3),
    supabase.from("devotions").select("title, scripture").order("published_at", { ascending: false }).limit(1).single(),
    supabase.from("fellowship_rooms").select("slug, name, members_label").order("sort_order").limit(3),
  ]);

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase", color: "#6b5530", marginBottom: 20 }}>
          Daily devotion · Fellowship · Bible study · Worship
        </p>

        <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 5rem)", marginBottom: 20, maxWidth: 700 }}>
          Don't just scroll.<br />Gather.
        </h1>

        <p style={{ fontSize: 17, opacity: 0.7, maxWidth: 520, lineHeight: 1.75, marginBottom: 36 }}>
          A Christian space for daily encounter, shared prayer, Bible study, and live worship.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 64 }}>
          <Link href="/live" style={{ display: "inline-flex", alignItems: "center", padding: "13px 26px", borderRadius: 9, background: "#c8a96a", color: "#0f0d0a", fontWeight: 600, fontSize: 13 }}>
            Enter Live
          </Link>
          <Link href="/today" style={{ display: "inline-flex", alignItems: "center", padding: "13px 26px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            Today's Devotion
          </Link>
        </div>

        <HomeLiveNow />

        <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", marginBottom: 20, opacity: 0.9 }}>Live now</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 56 }}>
          {(rooms ?? []).map((room) => (
            <Link href={`/live/${room.slug}`} key={room.slug} style={{ display: "block", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20, background: "rgba(255,255,255,0.03)", textDecoration: "none" }}>
              <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{room.time_label}</p>
              <h3 style={{ fontSize: "1.1rem", marginBottom: 8 }}>{room.title}</h3>
              <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>{room.description}</p>
            </Link>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(​​​​​​​​​​​​​​​​
