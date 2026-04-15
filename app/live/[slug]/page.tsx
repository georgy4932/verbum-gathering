import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LivekitRoomShell from "@/components/livekit-room-shell";
import LiveRoomRealtime from "@/components/live-room-realtime";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LiveRoomPage({ params }: PageProps) {
  const { slug } = await params;

  const [{ data: room, error: roomError }, { data: prayers }] = await Promise.all([
    supabase
      .from("live_rooms")
      .select("slug, title, description, status, time_label, host, kind")
      .eq("slug", slug)
      .single(),
    supabase
      .from("prayer_posts")
      .select("id, author_name, message, created_at")
      .eq("room_slug", slug)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (roomError || !room) {
    notFound();
  }

  return (
    <main style={{ padding: "4rem 1.25rem 5rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link href="/live" style={{ opacity: 0.68, textDecoration: "none" }}>
          ← Back to gatherings
        </Link>

        <div
          style={{
            marginTop: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 32,
            padding: 32,
            background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <p style={{ opacity: 0.58, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.82rem" }}>
            {room.time_label}
          </p>

          <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3.6rem)", margin: "0 0 14px", lineHeight: 1.08 }}>
            {room.title}
          </h1>

          <p style={{ opacity: 0.82, lineHeight: 1.8, maxWidth: 760, marginBottom: 22 }}>
            {room.description}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ opacity: 0.58, margin: "0 0 6px", fontSize: "0.9rem" }}>Host</p>
              <p style={{ margin: 0 }}>{room.host}</p>
            </div>
            <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ opacity: 0.58, margin: "0 0 6px", fontSize: "0.9rem" }}>Gathering type</p>
              <p style={{ margin: 0, textTransform: "capitalize" }}>{room.kind}</p>
            </div>
          </div>

          <div style={{ marginBottom: 24, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ opacity: 0.58, margin: "0 0 6px", fontSize: "0.9rem" }}>Focus</p>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              "Be still, and know that I am God." — Psalm 46:10
            </p>
          </div>

          <LivekitRoomShell roomName={slug} />

          <div style={{ marginTop: 28 }}>
            <LiveRoomRealtime roomSlug={slug} initialPosts={prayers ?? []} />
          </div>
        </div>
      </div>
    </main>
  );
}
