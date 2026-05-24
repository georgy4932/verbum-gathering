import { createSupabaseServerClient } from "@/lib/supabase/server";
import FellowshipRoomRealtime from "@/components/fellowship-room-realtime";
import FellowshipRoomPresence from "@/components/fellowship-room-presence";
import Link from "next/link";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FellowshipRoomPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: room }, { data: messages }] = await Promise.all([
    supabase
      .from("fellowship_rooms")
      .select("name, description, passage_ref, theme")
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("fellowship_messages")
      .select("id, author_name, message, created_at")
      .eq("room_slug", slug)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const title       = room?.name        ?? slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const description = room?.description ?? "A quiet space for shared encouragement, listening, and reflection.";
  const passageRef  = room?.passage_ref ?? null;

  return (
    <main style={{ padding: "4rem 1.25rem 6rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        <div style={{ marginBottom: 28 }}>
          <Link
            href="/rooms"
            style={{ fontSize: 12, color: "var(--stone)", textDecoration: "none", opacity: 0.7 }}
          >
            ← Fellowship spaces
          </Link>
        </div>

        <p style={{
          color: "var(--stone)", marginBottom: 12,
          fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {room?.theme ?? "Fellowship space"}
        </p>

        <h1 style={{
          fontSize: "clamp(2.2rem, 5vw, 4rem)",
          lineHeight: 1.05,
          margin: "0 0 14px",
          letterSpacing: "-0.02em",
          color: "var(--cream)",
        }}>
          {title}
        </h1>

        <p style={{ color: "var(--muted)", lineHeight: 1.75, margin: "0 0 8px", maxWidth: 680 }}>
          {description}
        </p>

        {passageRef && (
          <p style={{ fontSize: 13, color: "var(--companion)", margin: "0 0 8px", fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}>
            {passageRef}
          </p>
        )}

        <p style={{ color: "var(--stone)", margin: "0 0 16px", fontSize: "0.95rem" }}>
          Remain here a while. Share with care.
        </p>

        <FellowshipRoomPresence roomSlug={slug} />

        <div style={{
          marginTop: 32,
          paddingTop: 28,
          borderTop: "1px solid var(--faint)",
        }}>
          <FellowshipRoomRealtime roomSlug={slug} initialMessages={messages ?? []} />
        </div>

        <p style={{ textAlign: "center", color: "var(--stone)", marginTop: 48, fontSize: "0.9rem", opacity: 0.5 }}>
          Go in peace.
        </p>
      </div>
    </main>
  );
}
