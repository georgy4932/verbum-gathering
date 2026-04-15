import { supabase } from "@/lib/supabase";
import FellowshipRoomRealtime from "@/components/fellowship-room-realtime";
import FellowshipRoomPresence from "@/components/fellowship-room-presence";

export default async function FellowshipRoomPage({ params }: any) {
  const { slug } = await params;

  const { data: messages } = await supabase
    .from("fellowship_messages")
    .select("id, author_name, message, created_at")
    .eq("room_slug", slug)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 12, textTransform: "capitalize" }}>
          {slug.replace(/-/g, " ")}
        </h1>

        <p style={{ opacity: 0.7, marginBottom: 8 }}>
          Share with care. Encourage one another in truth and grace.
        </p>

        <p style={{ opacity: 0.7, marginBottom: 16 }}>
          Remain here a while.
        </p>

        <FellowshipRoomPresence roomSlug={slug} />

        <FellowshipRoomRealtime
          roomSlug={slug}
          initialMessages={messages ?? []}
        />
      </div>
    </main>
  );
}
