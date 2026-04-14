import SectionShell from "@/components/section-shell";
import LiveRoomCard from "@/components/live-room-card";
import { getLiveRooms } from "@/lib/db";

export const revalidate = 60;

export default async function LivePage() {
  const rooms = await getLiveRooms();

  return (
    <SectionShell
      eyebrow="Live"
      title="Gather live"
      description="Prayer, worship, and study happening in real time. Enter a room and join what God is doing now."
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
      }}>
        {rooms.map((room) => (
          <LiveRoomCard
            key={room.slug}
            room={{
              slug: room.slug,
              title: room.title,
              description: room.description,
              status: room.status,
              timeLabel: room.time_label,
              host: room.host,
              kind: room.kind,
            }}
          />
        ))}
      </div>
    </SectionShell>
  );
}
