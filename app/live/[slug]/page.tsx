import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
      .select("author_name, message, created_at")
      .eq("room_slug", slug)
      .order("created_at", { ascending: false })
      .limit(10),
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

        <div style={{
          marginTop: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 28, padding: 28,
          background: "rgba(255,255,255,0.03)",
        }}>
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

          <div style={{
            marginTop: 24, minHeight: 260, borderRadius: 24,
            border: "1px dashed rgba(255,255,255,0.15)",
            display: "grid", placeItems: "center",
            textAlign: "center", padding: 24,
          }}>
            <div>
              <p style={{ fontSize: "1.1rem", marginBottom: 10 }}>
                Broadcast player area
              </p>
              <p style={{ opacity: 0.7, maxWidth: 520, lineHeight: 1.7 }}>
                In Phase 4, this becomes the real live player and presence area.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <h2 style={{ marginBottom: 16 }}>Prayer wall</h2>

            <div style={{ display: "grid", gap: 14 }}>
              {(prayers ?? []).map((post, index) => (
                <article
                  key={`${post.author_name}-${index}`}
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 18, padding: 18,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <p style={{ fontWeight: 700, marginBottom: 8 }}>{post.author_name}</p>
                  <p style={{ opacity: 0.86, lineHeight: 1.7 }}>{post.message}</p>
                </article>
              ))}

              {(!prayers || prayers.length === 0) ? (
                <p style={{ opacity: 0.7 }}>No prayer posts yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
