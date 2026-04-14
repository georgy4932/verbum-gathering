import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (roomError || !room) {
    notFound();
  }

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link href="/live" style={{ opacity: 0.7, textDecoration: "none" }}>
          ← Back to live
        </Link>

        <div style={{ marginTop: 24, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, padding: 28, background: "rgba(255,255,255,0.03)" }}>
          <p style={{ opacity: 0.65, marginBottom: 10 }}>{room.time_label}</p>

          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.3rem)", marginBottom: 16 }}>
            {room.title}
          </h1>

          <p style={{ opacity: 0.82, lineHeight: 1.8, maxWidth: 760 }}>
            {room.description}
          </p>

          <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
            <div style={{ padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <strong>Host:</strong> {room.host}
            </div>
            <div style={{ padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <strong>Type:</strong> {room.kind}
            </div>
          </div>

          <div style={{ marginTop: 24, minHeight: 260, borderRadius: 24, border: "1px dashed rgba(255,255,255,0.15)", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
            <div>
              <p style={{ fontSize: "1.1rem", marginBottom: 10 }}>Broadcast player area</p>
              <p style={{ opacity: 0.7, maxWidth: 520, lineHeight: 1.7 }}>
                This is where LiveKit or your streaming player will go in the next phase.
              </p>
            </div>
          </div>

          <LiveRoomRealtime roomSlug={slug} initialPosts={prayers ?? []} />
        </div>
      </div>
    </main>
  );
}
