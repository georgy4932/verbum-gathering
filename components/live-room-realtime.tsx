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
        <h2 style={{ marginBottom: 16 }}>Prayer wall</h2>
        <PrayerWall roomSlug={roomSlug} initialPosts={initialPosts} />
      </div>
    </div>
  );
}
