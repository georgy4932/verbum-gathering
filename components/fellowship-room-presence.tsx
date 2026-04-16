"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = {
  roomSlug: string;
};

export default function FellowshipRoomPresence({ roomSlug }: Props) {
  const [count, setCount] = useState(0);
  const presenceKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const channel = supabaseBrowser.channel(`fellowship-presence:${roomSlug}`, {
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
  }, [roomSlug, presenceKey]);

  let label = "No one else is here yet.";

  if (count === 1) {
    label = "1 person is here.";
  } else if (count > 1) {
    label = `${count} people are here, sharing and listening.`;
  }

  return (
    <p
      style={{
        opacity: 0.6,
        marginBottom: 0,
        lineHeight: 1.7,
      }}
    >
      {label}
    </p>
  );
}
