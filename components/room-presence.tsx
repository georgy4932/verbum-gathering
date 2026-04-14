"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/components/supabase-browser";

type RoomPresenceProps = {
  roomSlug: string;
};

export default function RoomPresence({ roomSlug }: RoomPresenceProps) {
  const [count, setCount] = useState(1);

  const presenceKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const channel = supabaseBrowser.channel(`presence:${roomSlug}`, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const total = Object.keys(state).length;
        setCount(total);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            room_slug: roomSlug,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [presenceKey, roomSlug]);

  return (
    <div
      style={{
        padding: 18,
        borderRadius: 20,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p style={{ opacity: 0.7, marginBottom: 10 }}>
        You are here with others.
      </p>
      <span><strong>{count}</strong> praying together</span>
    </div>
  );
}
