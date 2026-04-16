import { supabase } from "@/lib/supabase";
import FellowshipRoomRealtime from "@/components/fellowship-room-realtime";
import FellowshipRoomPresence from "@/components/fellowship-room-presence";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatRoomTitle(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function FellowshipRoomPage({ params }: PageProps) {
  const { slug } = await params;

  const [{ data: room }, { data: messages }] = await Promise.all([
    supabase
      .from("fellowship_rooms")
      .select("name, description")
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("fellowship_messages")
      .select("id, author_name, message, created_at")
      .eq("room_slug", slug)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const title = room?.name || formatRoomTitle(slug);
  const description =
    room?.description ||
    "A quiet space for shared encouragement, listening, and reflection.";

  return (
    <main style={{ padding: "4rem 1.25rem 5rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <p
          style={{
            opacity: 0.55,
            marginBottom: 12,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Fellowship space
        </p>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 4rem)",
            lineHeight: 1.05,
            margin: "0 0 14px",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            opacity: 0.78,
            lineHeight: 1.75,
            margin: "0 0 12px",
            maxWidth: 680,
          }}
        >
          {description}
        </p>

        <p
          style={{
            opacity: 0.68,
            margin: "0 0 16px",
            fontSize: "1.02rem",
          }}
        >
          Remain here a while.
        </p>

        <p
          style={{
            opacity: 0.72,
            margin: "0 0 12px",
            lineHeight: 1.7,
          }}
        >
          Share with care. Encourage one another in truth and grace.
        </p>

        <FellowshipRoomPresence roomSlug={slug} />

        <div
          style={{
            marginTop: 32,
            paddingTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <FellowshipRoomRealtime
            roomSlug={slug}
            initialMessages={messages ?? []}
          />
        </div>

        <p
          style={{
            textAlign: "center",
            opacity: 0.45,
            marginTop: 40,
            fontSize: "0.9rem",
          }}
        >
          Go in peace.
        </p>
      </div>
    </main>
  );
}
