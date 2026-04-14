"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/components/supabase-browser";

type RoomPresenceProps = {
  roomSlug: string;
};

function randomGuestName() {
  const value = Math.floor(Math.random() * 100000);
  return `Guest-${value}`;
}

export default function RoomPresence({ roomSlug }: RoomPresenceProps) {
  const [count, setCount] = useState(1);

  const presenceKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const guestName = randomGuestName();

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
            guest_name: guestName,
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
    <div style={{
      padding: 18,
      borderRadius: 20,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#86efac", display: "inline-block",
        animation: "pulse 2s ease infinite",
      }} />
     <span><strong>{count}</strong> praying together</span>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
