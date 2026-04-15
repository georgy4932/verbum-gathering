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

          <p style={{ opacity: 0.7, marginBottom: 20, fontSize: "1.05rem" }}>
            Remain here a while.
          </p>

          <p style={{ opacity: 0.82, lineHeight: 1.8, maxWidth: 760, marginBottom: 22 }}>
            {room.description}
          </p>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 28, opacity: 0.85 }}>
            <div style={{ minWidth: 160 }}>
              <p style={{ opacity: 0.6, margin: "0 0 4px", fontSize: "0.85rem" }}>Led by</p>
              <p style={{ margin: 0 }}>{room.host}</p>
            </div>
            <div style={{ minWidth: 160 }}>
              <p style={{ opacity: 0.6, margin: "0 0 4px", fontSize: "0.85rem" }}>Gathering</p>
              <p style={{ margin: 0, textTransform: "capitalize" }}>{room.kind}</p>
            </div>
          </div>

          <div
            style={{
              marginBottom: 36,
              padding: "28px 24px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              textAlign: "center",
            }}
          >
            <p style={{ opacity: 0.5, marginBottom: 10, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Focus
            </p>
            <p style={{ fontSize: "1.2rem", lineHeight: 1.8, maxWidth: 520, margin: "0 auto" }}>
              "Be still, and know that I am God."
            </p>
            <p style={{ opacity: 0.6, marginTop: 8 }}>Psalm 46:10</p>
          </div>

          <div
            style={{
              marginTop: 40,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <LivekitRoomShell roomName={slug} />

            <div style={{ marginTop: 32 }}>
              <LiveRoomRealtime roomSlug={slug} initialPosts={prayers ?? []} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
