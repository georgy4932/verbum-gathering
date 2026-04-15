"use client";

import PrayerForm from "@/components/prayer-form";
import PrayerWall from "@/components/prayer-wall";
import RoomPresence from "@/components/room-presence";

type PrayerPost = {
  id?: string;
  author_name: string;
  message: string;
  created_at?: string;
};

type LiveRoomRealtimeProps = {
  roomSlug: string;
  initialPosts: PrayerPost[];
};

export default function LiveRoomRealtime({ roomSlug, initialPosts }: LiveRoomRealtimeProps) {
  return (
    <div style={{ marginTop: 28, display: "grid", gap: 24 }}>
      <RoomPresence roomSlug={roomSlug} />
      <PrayerForm roomSlug={roomSlug} />
      <div>
        <h3 style={{ marginBottom: 4, letterSpacing: "-0.02em" }}>Shared prayers</h3>
        <p style={{ opacity: 0.6, marginBottom: 8 }}>
          Offered quietly within this gathering
        </p>
        <p style={{ opacity: 0.5, fontSize: "0.85rem", marginBottom: 16 }}>
          These prayers continue as people remain.
        </p>
        <PrayerWall roomSlug={roomSlug} initialPosts={initialPosts} />
      </div>
    </div>
  );
}
